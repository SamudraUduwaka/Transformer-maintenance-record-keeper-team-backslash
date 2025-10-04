from ultralytics import YOLO
import argparse, os, glob, json, cv2, numpy as np
from datetime import datetime

# === Your 5-class order (matches data.yaml) ===
NAMES = ["full_wire_yellow","loose_joint_red","loose_joint_yellow","point_overload_red","point_overload_yellow"]
FAULTY = {1, 3}       # loose_joint_red, point_overload_red
POTENTIAL = {0, 2, 4} # full_wire_yellow, loose_joint_yellow, point_overload_yellow

REASON_MAP = {
    0: "Full Wire Overload (Potential)",
    1: "Loose Joint (Faulty)",
    2: "Loose Joint (Potential)",
    3: "Point Overload (Faulty)",
    4: "Point Overload (Potential)",
}

# Bright, high-contrast boundary colors (BGR)
COLORS = {
    0: (0, 255, 180),  # lime-yellow
    1: (0, 0, 255),    # red
    2: (0, 215, 255),  # yellow
    3: (60, 20, 220),  # deep red
    4: (0, 255, 255),  # bright yellow
}

# Per-class thresholds if you want recall-first behavior (enabled with --use_class_thresh)
CLASS_THRESH = {1: 0.25, 3: 0.25, 0: 0.25, 2: 0.25, 4: 0.25}

def image_label_from_classes(classes):
    if any(c in FAULTY for c in classes): return "Faulty"
    if any(c in POTENTIAL for c in classes): return "Potentially Faulty"
    return "Normal"

def draw_outline_only(img, masks_xy, classes, confs, thickness=4, halo=2, label_scale=0.5):
    """Draw ONLY polygon boundaries with a high-contrast halo for visibility."""
    out = img.copy()
    for poly, cls, conf in zip(masks_xy, classes, confs):
        pts = np.array(poly, dtype=np.int32).reshape(-1,1,2)
        color = COLORS.get(int(cls), (255,255,255))

        # 1) Visibility halo (draw first): black then white, thicker than the main stroke
        if halo > 0:
            cv2.polylines(out, [pts], True, (0,0,0), thickness + 2*halo, lineType=cv2.LINE_AA)
            cv2.polylines(out, [pts], True, (255,255,255), thickness + halo, lineType=cv2.LINE_AA)

        # 2) Main colored outline
        cv2.polylines(out, [pts], True, color, thickness, lineType=cv2.LINE_AA)

        # 3) Label near centroid with a dark rectangle behind
        flat = pts.reshape(-1,2)
        M = cv2.moments(flat)
        if M["m00"] != 0:
            cx, cy = int(M["m10"]/M["m00"]), int(M["m01"]/M["m00"])
        else:
            cx, cy = int(flat[:,0].mean()), int(flat[:,1].mean())

        text = f"{REASON_MAP.get(int(cls), NAMES[int(cls)])} {float(conf):.2f}"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, label_scale, 1)
        x = max(0, min(cx - tw//2, out.shape[1] - tw - 1))
        y = max(th + 4, min(cy - 8, out.shape[0] - 1))
        cv2.rectangle(out, (x-4, y-th-6), (x+tw+4, y+4), (0,0,0), -1)
        cv2.putText(out, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, label_scale, (255,255,255), 1, cv2.LINE_AA)

    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", required=True, help="Path to best.pt")
    ap.add_argument("--source", required=True, help="Folder or glob of images")
    ap.add_argument("--out", default="predictions_test_5c", help="Output folder")
    ap.add_argument("--conf", type=float, default=0.10, help="Global confidence (ignored if --use_class_thresh)")
    ap.add_argument("--iou", type=float, default=0.70)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--use_class_thresh", action="store_true",
                    help="Use per-class thresholds (reds lower) to favor recall")
    ap.add_argument("--outline_thickness", type=int, default=4, help="Polygon boundary thickness (px)")
    ap.add_argument("--halo", type=int, default=2, help="Extra halo around outline for visibility (px)")
    ap.add_argument("--label_scale", type=float, default=0.5, help="Label text scale")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    ov_dir = os.path.join(args.out, "overlays"); os.makedirs(ov_dir, exist_ok=True)
    jsonl_path = os.path.join(args.out, "predictions.jsonl")

    model = YOLO(args.weights)

    # collect images
    if os.path.isdir(args.source):
        patterns = ["*.jpg","*.jpeg","*.png","*.bmp","*.JPG","*.PNG"]
        paths = []
        for p in patterns:
            paths += glob.glob(os.path.join(args.source, "**", p), recursive=True)
    else:
        paths = glob.glob(args.source, recursive=True)
    paths.sort()

    infer_conf = (min(CLASS_THRESH.values()) if args.use_class_thresh else args.conf)

    with open(jsonl_path, "w", encoding="utf-8") as f:
        for p in paths:
            r = model.predict(p, conf=infer_conf, iou=args.iou, imgsz=args.imgsz, verbose=False)[0]
            classes = r.boxes.cls.cpu().numpy().astype(int).tolist() if r.boxes is not None else []
            confs   = r.boxes.conf.cpu().numpy().tolist() if r.boxes is not None else []
            masks_xy= r.masks.xy if (r.masks is not None) else []

            # Filter detections
            if args.use_class_thresh:
                keep = [i for i,(c,cf) in enumerate(zip(classes, confs)) if cf >= CLASS_THRESH.get(int(c), args.conf)]
            else:
                keep = [i for i,cf in enumerate(confs) if cf >= args.conf]
            classes = [classes[i] for i in keep]
            confs   = [confs[i]   for i in keep]
            masks_xy= [masks_xy[i]for i in keep]

            # Image-level label
            label = image_label_from_classes(classes)

            dets = []
            for poly, cls, cf in zip(masks_xy, classes, confs):
                dets.append({
                    "class_id": int(cls),
                    "class_name": NAMES[int(cls)],
                    "reason": REASON_MAP.get(int(cls), NAMES[int(cls)]),
                    "confidence": float(cf),
                    "polygon_xy": [[float(x), float(y)] for x,y in poly]
                })

            rec = {
                "image": p,
                "pred_image_label": label,
                "detections": dets,
                "conf_used": args.conf if not args.use_class_thresh else "per-class",
                "iou": args.iou,
                "timestamp": datetime.utcnow().isoformat()+"Z"
            }
            f.write(json.dumps(rec) + "\n")

            img = cv2.imread(p)
            if img is not None:
                vis = draw_outline_only(
                    img, masks_xy, classes, confs,
                    thickness=int(args.outline_thickness),
                    halo=int(args.halo),
                    label_scale=float(args.label_scale)
                ) if len(dets)>0 else img
                outp = os.path.join(ov_dir, os.path.basename(p))
                cv2.imwrite(outp, vis)

    print("Saved JSONL:", jsonl_path)
    print("Saved overlays to:", ov_dir)

if __name__ == "__main__":
    main()
