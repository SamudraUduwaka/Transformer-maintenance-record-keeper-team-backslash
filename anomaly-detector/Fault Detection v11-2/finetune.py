from ultralytics import YOLO
import argparse
import os
import shutil
import yaml
from pathlib import Path
import mysql.connector
import cv2
import numpy as np

def fetch_manually_edited_data(db_config):
    """
    Fetch the most recent 64 manually edited images and their labels from the database
    """
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor(dictionary=True)
    
    # Query to get the most recent 64 manually edited predictions
    query = """
    SELECT p.image_path, pd.class_id, pd.polygon_xy, p.id as pred_id
    FROM prediction p
    JOIN prediction_detection pd ON p.id = pd.prediction_id
    WHERE pd.manually_edited = true
    ORDER BY p.created_at DESC
    LIMIT 64
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return results

def convert_to_yolo_format(polygon_xy, width, height):
    """
    Convert polygon coordinates to YOLO format
    Returns normalized coordinates and ensures correct format
    """
    # Convert string representation to numpy array
    polygons = np.array(eval(polygon_xy))
    
    # Ensure polygon is in the correct shape
    if len(polygons.shape) == 2 and polygons.shape[1] == 2:
        # Normalize coordinates
        normalized = polygons / np.array([width, height])
        
        # Ensure all coordinates are within [0, 1]
        normalized = np.clip(normalized, 0, 1)
        
        return normalized
    else:
        raise ValueError("Invalid polygon format")

def setup_training_data(manual_data, dataset_path, output_path):
    """
    Combine manually edited data with existing dataset, ensuring YOLOv11 format compatibility
    """
    # Create output directories
    train_images = Path(output_path) / 'train' / 'images'
    train_labels = Path(output_path) / 'train' / 'labels'
    train_images.mkdir(parents=True, exist_ok=True)
    train_labels.mkdir(parents=True, exist_ok=True)
    
    # First, copy the existing dataset which is already in YOLO format
    dataset_images = Path(dataset_path) / 'train' / 'images'
    dataset_labels = Path(dataset_path) / 'train' / 'labels'
    
    print(f"Copying existing dataset from {dataset_images}")
    for img_file in dataset_images.glob('*.jpg'):
        shutil.copy2(img_file, train_images / img_file.name)
        label_file = dataset_labels / f"{img_file.stem}.txt"
        if label_file.exists():
            shutil.copy2(label_file, train_labels / label_file.name)
    
    # Process manually edited data
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
                new_img_path = train_images / f"{unique_name}.jpg"
                
                # Copy and convert image
                shutil.copy2(img_path, new_img_path)
                
                # Convert polygon to YOLO format
                try:
                    normalized_polygons = convert_to_yolo_format(item['polygon_xy'], width, height)
                    
                    # Write YOLO format label
                    label_path = train_labels / f"{unique_name}.txt"
                    with open(label_path, 'w') as f:
                        # Format: <class_id> <x1> <y1> <x2> <y2> ... <xn> <yn>
                        coords = ' '.join([f"{x:.6f}" for x in normalized_polygons.flatten()])
                        f.write(f"{item['class_id']} {coords}\n")
                        
                except (ValueError, SyntaxError) as e:
                    print(f"Warning: Invalid polygon data for {img_path}: {e}")
                    continue
                    
            except Exception as e:
                print(f"Error processing {img_path}: {e}")
                continue
            
    print(f"Training data setup complete in {output_path}")

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
        'val': str(Path(dataset_path) / 'valid' / 'images'),  # Use original validation set
        'test': str(Path(dataset_path) / 'test' / 'images'),  # Use original test set
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
    
    if len(manual_data) < 64:
        print(f"Not enough manually edited images (found {len(manual_data)}, need 64)")
        return
    
    # Setup training data
    setup_training_data(manual_data, args.dataset, args.output)
    
    # Create data.yaml
    data_yaml = create_data_yaml(args.output)
    
    # Load and train model
    model = YOLO(args.best_pt)
    
    # Create project path for saving results
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