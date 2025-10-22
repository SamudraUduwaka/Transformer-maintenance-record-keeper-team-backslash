from ultralytics import YOLO
import argparse
import os
import shutil
import yaml
from pathlib import Path
import mysql.connector
import cv2
import numpy as np
import torch

def fetch_manually_edited_data(db_config):
    """
    Fetch the most recent 64 manually edited images and their labels from the database
    """
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor(dictionary=True)
    
    # Query to get manually edited predictions from today
    query = """
    SELECT 
        CONCAT('inference-uploads/pred-', p.prediction_id, '/image.jpg') as image_path,
        pd.class_id,
        pd.bbox_x, pd.bbox_y, pd.bbox_w, pd.bbox_h,
        p.prediction_id as pred_id
    FROM prediction p
    JOIN prediction_detection pd ON p.prediction_id = pd.prediction_id
    JOIN inspection i ON p.inspection_id = i.inspection_id
    WHERE (pd.source = 'MANUALLY_ADDED' OR pd.action_type IN ('EDITED', 'DELETED'))
    AND DATE(pd.created_at) = CURDATE()
    ORDER BY pd.created_at
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return results

def convert_to_yolo_format(bbox_x, bbox_y, bbox_w, bbox_h, width, height):
    """
    Convert bounding box coordinates to YOLO format
    Returns normalized coordinates: center_x, center_y, width, height
    All values normalized between 0 and 1
    """
    # Calculate center points and normalize
    center_x = (bbox_x + bbox_w/2) / width
    center_y = (bbox_y + bbox_h/2) / height
    
    # Normalize width and height
    norm_width = bbox_w / width
    norm_height = bbox_h / height
    
    # Ensure all coordinates are within [0, 1]
    center_x = np.clip(center_x, 0, 1)
    center_y = np.clip(center_y, 0, 1)
    norm_width = np.clip(norm_width, 0, 1)
    norm_height = np.clip(norm_height, 0, 1)
    
    return center_x, center_y, norm_width, norm_height

def setup_training_data(manual_data, dataset_path, output_path):
    """
    Combine manually edited data with existing dataset, ensuring YOLOv11 format compatibility.
    Split data into train (70%), valid (20%), and test (10%) sets.
    """
    # Create output directories for all splits
    splits = ['train', 'valid', 'test']
    split_dirs = {}
    for split in splits:
        split_dirs[split] = {
            'images': Path(output_path) / split / 'images',
            'labels': Path(output_path) / split / 'labels'
        }
        split_dirs[split]['images'].mkdir(parents=True, exist_ok=True)
        split_dirs[split]['labels'].mkdir(parents=True, exist_ok=True)
    
    # First, gather all existing dataset files
    dataset_images = []
    dataset_labels = []
    print(f"Collecting existing dataset from {dataset_path}")
    for split in splits:
        split_img_dir = Path(dataset_path) / split / 'images'
        split_lbl_dir = Path(dataset_path) / split / 'labels'
        
        for img_file in split_img_dir.glob('*.jpg'):
            label_file = split_lbl_dir / f"{img_file.stem}.txt"
            if label_file.exists():
                dataset_images.append(img_file)
                dataset_labels.append(label_file)
    
    # Now collect all manual edit files
    manual_files = []
    print(f"Processing {len(manual_data)} manually edited images")
    
    for item in manual_data:
        img_path = item['image_path']
        if os.path.exists(img_path):
            try:
                # Read image for dimensions
                img = cv2.imread(img_path)
                if img is None:
                    print(f"Warning: Could not read image {img_path}")
                    continue
                    
                height, width = img.shape[:2]
                
                # Generate unique filename using prediction ID to avoid conflicts
                unique_name = f"manual_{item['pred_id']}"
                
                # Convert bounding box to YOLO format
                try:
                    yolo_coords = convert_to_yolo_format(
                        item['bbox_x'], item['bbox_y'],
                        item['bbox_w'], item['bbox_h'],
                        width, height
                    )
                    
                    # Store the file info for later distribution
                    manual_files.append({
                        'src_img': img_path,
                        'name': unique_name,
                        'class_id': item['class_id'],
                        'coords': yolo_coords,
                        'img': img
                    })
                        
                except (ValueError, KeyError) as e:
                    print(f"Warning: Invalid bounding box data for {img_path}: {e}")
                    continue
                    
            except Exception as e:
                print(f"Error processing {img_path}: {e}")
                continue
    
    # Calculate split sizes
    total_files = len(dataset_images) + len(manual_files)
    train_size = int(total_files * 0.7)
    valid_size = int(total_files * 0.2)
    # test_size will be the remainder
    
    # Combine and shuffle all files
    import random
    all_files = []
    
    # Add existing dataset files
    for img_file, label_file in zip(dataset_images, dataset_labels):
        all_files.append(('dataset', img_file, label_file))
    
    # Add manual files
    for manual in manual_files:
        all_files.append(('manual', manual))
    
    random.shuffle(all_files)
    
    # Distribute files according to splits
    split_points = [0, train_size, train_size + valid_size]
    current_splits = ['train', 'valid', 'test']
    
    for i, (start, end) in enumerate(zip(split_points, split_points[1:] + [None])):
        split = current_splits[i]
        split_files = all_files[start:end]
        
        for file_info in split_files:
            if file_info[0] == 'dataset':
                _, img_file, label_file = file_info
                # Copy dataset files
                shutil.copy2(img_file, split_dirs[split]['images'] / img_file.name)
                shutil.copy2(label_file, split_dirs[split]['labels'] / label_file.name)
            else:
                _, manual = file_info
                # Save manual files
                new_img_path = split_dirs[split]['images'] / f"{manual['name']}.jpg"
                label_path = split_dirs[split]['labels'] / f"{manual['name']}.txt"
                
                # Save image
                cv2.imwrite(str(new_img_path), manual['img'])
                
                # Save label
                with open(label_path, 'w') as f:
                    coords = ' '.join([f"{x:.6f}" for x in manual['coords']])
                    f.write(f"{manual['class_id']} {coords}\n")
    
    print(f"Training data setup complete in {output_path} with splits:")
    for split in splits:
        img_count = len(list(split_dirs[split]['images'].glob('*.jpg')))
        print(f"- {split}: {img_count} images ({img_count/total_files*100:.1f}%)")

def create_data_yaml(output_path, dataset_path, nc=5):
    """
    Create data.yaml for training, maintaining compatibility with existing dataset structure
    """
    # Read the original data.yaml to maintain consistency
    orig_yaml_path = Path(dataset_path) / 'data.yaml'
    if orig_yaml_path.exists():
        with open(orig_yaml_path, 'r') as f:
            orig_config = yaml.safe_load(f)
            names = orig_config.get('names', [
                'full_wire_yellow', 'loose_joint_red', 'loose_joint_yellow',
                'point_overload_red', 'point_overload_yellow'
            ])
    else:
        names = [
            'full_wire_yellow', 'loose_joint_red', 'loose_joint_yellow',
            'point_overload_red', 'point_overload_yellow'
        ]
    
    # Create new yaml content
    yaml_content = {
        'train': str(Path(output_path) / 'train' / 'images'),
        'val': str(Path(output_path) / 'valid' / 'images'),  # Use new validation set
        'test': str(Path(output_path) / 'test' / 'images'),  # Use new test set
        'nc': nc,
        'names': names
    }
    
    yaml_path = Path(output_path) / 'data.yaml'
    with open(yaml_path, 'w') as f:
        yaml.dump(yaml_content, f, sort_keys=False)
    
    print(f"Created data.yaml at {yaml_path}")
    return str(yaml_path)

def main():
    parser = argparse.ArgumentParser(description='Fine-tune YOLO model with manually edited data')
    parser.add_argument('--best-pt', type=str, required=True, help='Path to existing best.pt')
    parser.add_argument('--dataset', type=str, required=True, help='Path to original dataset')
    parser.add_argument('--output', type=str, required=True, help='Path for combined dataset and training')
    parser.add_argument('--db-host', type=str, required=True)
    parser.add_argument('--db-user', type=str, required=True)
    parser.add_argument('--db-pass', type=str, required=True)
    parser.add_argument('--db-name', type=str, required=True)
    
    args = parser.parse_args()
    
    # Database configuration
    db_config = {
        'host': args.db_host,
        'user': args.db_user,
        'password': args.db_pass,
        'database': args.db_name
    }
    
    # Fetch manually edited data
    manual_data = fetch_manually_edited_data(db_config)
    
    if len(manual_data) < 1:
        print(f"No manually edited images found for training")
        return
    
    print(f"Found {len(manual_data)} manually edited images for training")
    
    # Setup training data
    setup_training_data(manual_data, args.dataset, args.output)
    
    # Create data.yaml using both output path and original dataset path
    data_yaml = create_data_yaml(args.output, args.dataset)
    
    # Load and train model
    model = YOLO(args.best_pt)
    
    # Train with fine-tuning parameters optimized for small datasets
    results = model.train(
        data=data_yaml,
        epochs=60,  # Reduced epochs for fine-tuning
        imgsz=640,  # Same image size as initial training
        batch=4,    # Very small batch size for small datasets
        device='0' if torch.cuda.is_available() else 'cpu',
        project=args.output,
        name='finetune',
        exist_ok=True,
        resume=False,  # Start a new training session
        pretrained=True,  # Use the loaded weights as initialization
        # Fine-tuning specific parameters
        patience=50,  # More patience for small datasets
        optimizer='AdamW',
        lr0=0.00001,  # Very low learning rate for fine-tuning
        lrf=0.01,    # Final learning rate factor
        momentum=0.937,
        weight_decay=0.0005,  # Reduced weight decay for small datasets
        warmup_epochs=5.0,    # More warmup epochs
        warmup_momentum=0.8,
        warmup_bias_lr=0.01,
        box=7.5,     # Box loss gain
        cls=0.3,     # Reduced class loss for fine-tuning
        dfl=1.5,     # DFL loss gain
        close_mosaic=0,  # Disable mosaic augmentation for small datasets
        label_smoothing=0.0,  # Disable label smoothing
        augment=True,  # Enable default augmentations
        mixup=0.1,    # Light mixup
        copy_paste=0.1,  # Light copy-paste
        degrees=10.0,   # Rotation augmentation
        translate=0.1,  # Translation augmentation
        scale=0.1,     # Scale augmentation
        shear=5.0,     # Shear augmentation
        perspective=0.0001,  # Slight perspective augmentation
        flipud=0.1,    # Vertical flip
        fliplr=0.5,    # Horizontal flip
        mosaic=0.1,    # Light mosaic
        hsv_h=0.015,   # Hue augmentation
        hsv_s=0.2,     # Saturation augmentation
        hsv_v=0.1,     # Value augmentation
    )
    
    print("Fine-tuning completed. Results saved in:", args.output)
    
    # Save the best model from this fine-tuning session
    best_model_path = Path(args.output) / 'finetune' / 'weights' / 'best.pt'
    if best_model_path.exists():
        print("Best fine-tuned model saved at:", best_model_path)
    project_dir = Path(args.best_pt).parent.parent.parent  # Go up to runs_yolo directory
    
    results = model.train(
        data=data_yaml,
        imgsz=640,
        epochs=20,
        batch=8,
        device='cpu',
        lr0=0.0015,
        optimizer='AdamW',
        cos_lr=True,
        patience=15,
        hsv_h=0,
        hsv_s=0.2,
        hsv_v=0.2,
        degrees=10,
        translate=0.1,
        scale=0.5,
        shear=0,
        mosaic=0,
        mixup=0,
        project=str(project_dir),  # Save in same directory as original
        name='tx_seg_5c_v11_cpu2'  # Use same name to maintain structure
    )
    
    # Get paths for weight files
    new_best = project_dir / 'tx_seg_5c_v11_cpu2' / 'weights' / 'best.pt'
    backup_path = args.best_pt.replace('best.pt', 'best_backup.pt')
    
    if new_best.exists():
        # Create backup of old weights
        print(f"Creating backup of old weights at {backup_path}")
        shutil.copy2(args.best_pt, backup_path)
        
        # Update with new weights
        print(f"Updating {args.best_pt} with new weights")
        shutil.copy2(new_best, args.best_pt)
        
        print("Model weights updated successfully")
        print(f"Old weights backed up at: {backup_path}")
        print(f"New weights installed at: {args.best_pt}")
    else:
        print("Warning: Training completed but no new best.pt was found")

if __name__ == "__main__":
    main()