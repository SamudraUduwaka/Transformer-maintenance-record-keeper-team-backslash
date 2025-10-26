# TRANSFORMER MAINTENANCE SYSTEM - HIGH-LEVEL COMPONENT DIAGRAM

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          TRANSFORMER MAINTENANCE SYSTEM                           │
│                              Full Stack Architecture                              │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  PRESENTATION LAYER                                  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                         REACT FRONTEND (SPA)                                │    │
│  │                         Port: 5173 (Vite Dev)                              │    │
│  ├────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │   Login/     │  │  Dashboard   │  │ Transformer  │  │  Inspection  │  │    │
│  │  │   Register   │  │    Page      │  │  Inspection  │  │   Details    │  │    │
│  │  │    Page      │  │              │  │     Page     │  │     Page     │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │    │
│  │         │                 │                 │                 │           │    │
│  │  ┌──────┴─────────────────┴─────────────────┴─────────────────┴──────┐   │    │
│  │  │              REACT ROUTER (Client-Side Routing)                    │   │    │
│  │  └────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │                    COMPONENT LIBRARY                              │     │    │
│  │  │  • ThermalImageAnalysis.tsx - Display AI detections              │     │    │
│  │  │  • DrawingCanvas.tsx - Interactive annotation tools              │     │    │
│  │  │  • AppLayout.tsx - Main layout wrapper                           │     │    │
│  │  │  • Material-UI Components (MUI 7.3.1)                            │     │    │
│  │  └──────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │                  STATE MANAGEMENT                                 │     │    │
│  │  │  • React Hooks (useState, useEffect, useCallback)                │     │    │
│  │  │  • AuthContext (JWT token management)                            │     │    │
│  │  │  • useDetections Hook (annotation state)                         │     │    │
│  │  └──────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │                   SERVICE LAYER                                   │     │    │
│  │  │  • authService.ts - Authentication API calls                     │     │    │
│  │  │  • annotationService.ts - Detection CRUD operations              │     │    │
│  │  │  • Axios HTTP client                                             │     │    │
│  │  └──────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  └─────────────────────────────────┬───────────────────────────────────────────┘    │
│                                    │                                                │
│                                    │ HTTP/HTTPS (REST API)                          │
│                                    │ JSON Request/Response                          │
│                                    │ JWT in Authorization Header                    │
│                                    ▼                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                       │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                    SPRING BOOT BACKEND (REST API)                           │    │
│  │                         Port: 8080                                          │    │
│  │                    Spring Boot 3.5.4 + Java 21                             │    │
│  ├────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                             │    │
│  │  ┌─────────────────────── REST CONTROLLERS ───────────────────────┐        │    │
│  │  │                                                                  │        │    │
│  │  │  ┌────────────────────────────────────────────────────────┐   │        │    │
│  │  │  │  AuthController (/api/auth)                            │   │        │    │
│  │  │  │  ✓ POST /register - Register new user                 │   │        │    │
│  │  │  │  ✓ POST /login - Authenticate & get JWT               │   │        │    │
│  │  │  └────────────────────────────────────────────────────────┘   │        │    │
│  │  │                                                                  │        │    │
│  │  │  ┌────────────────────────────────────────────────────────┐   │        │    │
│  │  │  │  TransformerController (/api/transformers)             │   │        │    │
│  │  │  │  ✓ GET / - List all transformers                       │   │        │    │
│  │  │  │  ✓ POST / - Create transformer                         │   │        │    │
│  │  │  │  ✓ GET /{transformerNo} - Get details                  │   │        │    │
│  │  │  │  ✓ PUT /{transformerNo} - Update transformer           │   │        │    │
│  │  │  │  ✓ DELETE /{transformerNo} - Delete transformer        │   │        │    │
│  │  │  └────────────────────────────────────────────────────────┘   │        │    │
│  │  │                                                                  │        │    │
│  │  │  ┌────────────────────────────────────────────────────────┐   │        │    │
│  │  │  │  InspectionController (/api/inspections)               │   │        │    │
│  │  │  │  ✓ POST / - Create inspection                          │   │        │    │
│  │  │  │  ✓ GET /transformer/{transformerNo} - List by txfmr    │   │        │    │
│  │  │  │  ✓ GET /{id} - Get inspection details                  │   │        │    │
│  │  │  │  ✓ DELETE /{id} - Delete inspection                    │   │        │    │
│  │  │  └────────────────────────────────────────────────────────┘   │        │    │
│  │  │                                                                  │        │    │
│  │  │  ┌────────────────────────────────────────────────────────┐   │        │    │
│  │  │  │  ImageController (/api/images)                         │   │        │    │
│  │  │  │  ✓ POST / - Upload image metadata                      │   │        │    │
│  │  │  │  ✓ GET /{id} - Get image details                       │   │        │    │
│  │  │  │  ✓ GET /inspection/{inspectionId} - Get by inspection  │   │        │    │
│  │  │  └────────────────────────────────────────────────────────┘   │        │    │
│  │  │                                                                  │        │    │
│  │  │  ┌────────────────────────────────────────────────────────┐   │        │    │
│  │  │  │  InferenceController (/api/inference)                  │   │        │    │
│  │  │  │  ✓ POST /analyze - Trigger AI analysis                 │   │        │    │
│  │  │  │  ✓ PUT /threshold - Update confidence threshold        │   │        │    │
│  │  │  └────────────────────────────────────────────────────────┘   │        │    │
│  │  │                                                                  │        │    │
│  │  │  ┌────────────────────────────────────────────────────────┐   │        │    │
│  │  │  │  ManualDetectionController (/api/detections)           │   │        │    │
│  │  │  │  ✓ GET /prediction/{predictionId} - Get all detections │   │        │    │
│  │  │  │  ✓ POST / - Create manual annotation                   │   │        │    │
│  │  │  │  ✓ PUT /{id} - Update annotation                       │   │        │    │
│  │  │  │  ✓ DELETE /{id} - Delete annotation                    │   │        │    │
│  │  │  └────────────────────────────────────────────────────────┘   │        │    │
│  │  │                                                                  │        │    │
│  │  └──────────────────────────────────────────────────────────────┘        │    │
│  │                                                                             │    │
│  │  ┌─────────────────────── SERVICE LAYER ──────────────────────────┐       │    │
│  │  │                                                                  │       │    │
│  │  │  • AuthService - User authentication & JWT generation           │       │    │
│  │  │  • TransformerService - Transformer CRUD operations             │       │    │
│  │  │  • InspectionService - Inspection management                    │       │    │
│  │  │  • ImageService - Image metadata handling                       │       │    │
│  │  │  • PythonInferenceService - AI model integration ◄──────────┐  │       │    │
│  │  │  • ManualDetectionService - Annotation management           │  │       │    │
│  │  │  • ModelTrainingService - Scheduled retraining              │  │       │    │
│  │  │                                                               │  │       │    │
│  │  └───────────────────────────────────────────────────────────────┘       │    │
│  │                                                                             │    │
│  │  ┌─────────────────────── SECURITY LAYER ──────────────────────┐          │    │
│  │  │                                                               │          │    │
│  │  │  • Spring Security (JWT-based authentication)                │          │    │
│  │  │  • JwtAuthenticationFilter - Validate JWT on each request    │          │    │
│  │  │  • SecurityConfig - Configure permitted/protected endpoints  │          │    │
│  │  │  • BCryptPasswordEncoder - Password hashing                  │          │    │
│  │  │                                                               │          │    │
│  │  └───────────────────────────────────────────────────────────────┘          │    │
│  │                                                                             │    │
│  │  ┌─────────────────────── REPOSITORY LAYER ────────────────────┐          │    │
│  │  │                                                               │          │    │
│  │  │  Spring Data JPA Repositories (extends JpaRepository):       │          │    │
│  │  │  • UserRepository                                             │          │    │
│  │  │  • TransformerRepository                                      │          │    │
│  │  │  • InspectionRepository                                       │          │    │
│  │  │  • ImageRepository                                            │          │    │
│  │  │  • PredictionRepository                                       │          │    │
│  │  │  • PredictionDetectionRepository                             │          │    │
│  │  │  • DetectionClassRepository                                   │          │    │
│  │  │                                                               │          │    │
│  │  └───────────────────────────────────────────────────────────────┘          │    │
│  │                                     │                                        │    │
│  └─────────────────────────────────────┼────────────────────────────────────────┘    │
│                                        │ JDBC                                        │
│                                        ▼                                             │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                             AI/ML PROCESSING LAYER                                   │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │              PYTHON AI SERVICE (Process-based Integration)                  │    │
│  │                         Python 3.9 + PyTorch 2.8.0                         │    │
│  ├────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │         INFERENCE SCRIPT (seg_infer_and_label_5c.py)              │     │    │
│  │  │                                                                    │     │    │
│  │  │  Input Parameters:                                                │     │    │
│  │  │    --weights <path/to/best.pt>                                   │     │    │
│  │  │    --source <path/to/thermal/image.jpg>                          │     │    │
│  │  │    --conf <confidence_threshold> (default: 0.25)                 │     │    │
│  │  │    --iou <iou_threshold> (default: 0.025)                        │     │    │
│  │  │    --imgsz <image_size> (default: 640)                           │     │    │
│  │  │    --out <output_folder>                                         │     │    │
│  │  │    --stdout_json (output JSON to stdout)                         │     │    │
│  │  │                                                                    │     │    │
│  │  │  Processing Flow:                                                 │     │    │
│  │  │    1. Load YOLOv11n-seg model                                    │     │    │
│  │  │    2. Run inference on thermal image                             │     │    │
│  │  │    3. Detect anomalies (5 classes)                               │     │    │
│  │  │    4. Apply confidence thresholding                              │     │    │
│  │  │    5. Generate annotated image                                   │     │    │
│  │  │    6. Output JSON to stdout                                      │     │    │
│  │  │                                                                    │     │    │
│  │  │  Output Format (JSON):                                            │     │    │
│  │  │    {                                                              │     │    │
│  │  │      "image": "path/to/image.jpg",                               │     │    │
│  │  │      "pred_image_label": "FAULTY|OK",                            │     │    │
│  │  │      "timestamp": "2025-10-26T15:30:00",                         │     │    │
│  │  │      "detections": [                                              │     │    │
│  │  │        {                                                          │     │    │
│  │  │          "class_id": 0-4,                                         │     │    │
│  │  │          "class_name": "loose_joint_red",                        │     │    │
│  │  │          "reason": "Critical loose connection",                  │     │    │
│  │  │          "confidence": 0.87,                                     │     │    │
│  │  │          "polygon_xy": [[x,y], [x,y], ...]                      │     │    │
│  │  │        }                                                          │     │    │
│  │  │      ]                                                            │     │    │
│  │  │    }                                                              │     │    │
│  │  │                                                                    │     │    │
│  │  └────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │         YOLO MODEL (YOLOv11n-seg)                                 │     │    │
│  │  │                                                                    │     │    │
│  │  │  Model: Ultralytics YOLOv11 (nano segmentation variant)          │     │    │
│  │  │  Weights: best.pt (fine-tuned on thermal images)                 │     │    │
│  │  │                                                                    │     │    │
│  │  │  Detection Classes (5):                                           │     │    │
│  │  │    0: Point Overload (Faulty) - Red - CRITICAL                   │     │    │
│  │  │    1: Loose Joint (Faulty) - Red - CRITICAL                      │     │    │
│  │  │    2: Point Overload (Potential) - Yellow - WARNING              │     │    │
│  │  │    3: Loose Joint (Potential) - Yellow - WARNING                 │     │    │
│  │  │    4: Full Wire Overload - Yellow - WARNING                      │     │    │
│  │  │                                                                    │     │    │
│  │  │  Performance:                                                     │     │    │
│  │  │    - Inference time: 1-2 seconds per image (CPU)                │     │    │
│  │  │    - Input size: 640x640 pixels                                  │     │    │
│  │  │    - Output: Segmentation masks + bounding boxes                 │     │    │
│  │  │                                                                    │     │    │
│  │  └────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │      RETRAINING SCRIPT (finetune.py)                              │     │    │
│  │  │                                                                    │     │    │
│  │  │  Scheduled Execution: Daily at 1:00 AM                            │     │    │
│  │  │  Trigger: @Scheduled in ModelTrainingService                      │     │    │
│  │  │                                                                    │     │    │
│  │  │  Process:                                                          │     │    │
│  │  │    1. Fetch manual annotations from database                     │     │    │
│  │  │    2. Combine with baseline dataset                              │     │    │
│  │  │    3. Split data: 70% train, 20% validation, 10% test           │     │    │
│  │  │    4. Convert to YOLO format                                     │     │    │
│  │  │    5. Fine-tune model (60 epochs, lr=0.00001)                   │     │    │
│  │  │    6. Save improved weights                                      │     │    │
│  │  │    7. Update production model                                    │     │    │
│  │  │                                                                    │     │    │
│  │  └────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │    │
│  │  │         JAVA-PYTHON INTEGRATION                                   │     │    │
│  │  │                                                                    │     │    │
│  │  │  Communication: ProcessBuilder (OS-level process spawn)          │     │    │
│  │  │  Protocol: JSON via stdout                                        │     │    │
│  │  │                                                                    │     │    │
│  │  │  Spring Boot → Python:                                            │     │    │
│  │  │    - Build command with arguments                                │     │    │
│  │  │    - Execute Python process                                       │     │    │
│  │  │    - Capture stdout/stderr                                        │     │    │
│  │  │                                                                    │     │    │
│  │  │  Python → Spring Boot:                                            │     │    │
│  │  │    - Print JSON to stdout                                         │     │    │
│  │  │    - Exit with status code                                        │     │    │
│  │  │                                                                    │     │    │
│  │  └────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                             │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                          MySQL DATABASE                                     │    │
│  │                            Port: 3306                                       │    │
│  │                       Database: transformer_db                              │    │
│  ├────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                             │    │
│  │  ┌──────────────────────── DATABASE SCHEMA ─────────────────────────┐     │    │
│  │  │                                                                    │     │    │
│  │  │  ┌────────────────┐         ┌────────────────┐                   │     │    │
│  │  │  │  user          │         │ transformer    │                   │     │    │
│  │  │  ├────────────────┤         ├────────────────┤                   │     │    │
│  │  │  │ user_id (PK)   │         │ transformer_no │◄──┐               │     │    │
│  │  │  │ email          │         │ pole_no        │   │               │     │    │
│  │  │  │ password       │         │ region         │   │               │     │    │
│  │  │  │ name           │         │ type           │   │               │     │    │
│  │  │  │ created_at     │         │ location       │   │               │     │    │
│  │  │  └────────────────┘         │ favorite       │   │               │     │    │
│  │  │                              │ created_at     │   │               │     │    │
│  │  │                              │ updated_at     │   │               │     │    │
│  │  │                              └────────────────┘   │               │     │    │
│  │  │                                      │             │               │     │    │
│  │  │                                      │ 1           │               │     │    │
│  │  │                                      │             │               │     │    │
│  │  │                                      ▼ N           │               │     │    │
│  │  │                              ┌────────────────┐   │               │     │    │
│  │  │                              │ inspection     │   │               │     │    │
│  │  │                              ├────────────────┤   │               │     │    │
│  │  │                              │ inspection_id  │◄──┼──┐            │     │    │
│  │  │                              │ transformer_no │   │  │            │     │    │
│  │  │                              │ inspection_time│   │  │            │     │    │
│  │  │                              │ branch         │   │  │            │     │    │
│  │  │                              │ inspector      │   │  │            │     │    │
│  │  │                              │ favorite       │   │  │            │     │    │
│  │  │                              │ created_at     │   │  │            │     │    │
│  │  │                              │ updated_at     │   │  │            │     │    │
│  │  │                              └────────────────┘   │  │            │     │    │
│  │  │                                      │             │  │            │     │    │
│  │  │                              ┌───────┴──────┐      │  │            │     │    │
│  │  │                              │ 1           1│      │  │            │     │    │
│  │  │                              ▼              ▼      │  │            │     │    │
│  │  │                      ┌────────────┐  ┌────────────────┐           │     │    │
│  │  │                      │  image     │  │  prediction    │           │     │    │
│  │  │                      ├────────────┤  ├────────────────┤           │     │    │
│  │  │                      │ image_id   │  │ prediction_id  │◄──┐       │     │    │
│  │  │                      │ inspection │  │ inspection_id  │   │       │     │    │
│  │  │                      │ transformer│──┘  │ user_id        │   │       │     │    │
│  │  │                      │ image_url  │  │ session_type   │   │       │     │    │
│  │  │                      │ type       │  │ predicted_label│   │       │     │    │
│  │  │                      │ weather    │  │ model_timestamp│   │       │     │    │
│  │  │                      │ created_at │  │ issue_count    │   │       │     │    │
│  │  │                      │ updated_at │  │ created_at     │   │       │     │    │
│  │  │                      └────────────┘  │ updated_at     │   │       │     │    │
│  │  │                                      └────────────────┘   │       │     │    │
│  │  │                                              │ 1           │       │     │    │
│  │  │                                              │             │       │     │    │
│  │  │                                              ▼ N           │       │     │    │
│  │  │                                      ┌────────────────────┐│       │     │    │
│  │  │                                      │prediction_detection││       │     │    │
│  │  │                                      ├────────────────────┤│       │     │    │
│  │  │                                      │ detection_id (PK)  ││       │     │    │
│  │  │                                      │ prediction_id      │┘       │     │    │
│  │  │                                      │ inspection_id      │        │     │    │
│  │  │                                      │ log_entry_id       │        │     │    │
│  │  │                                      │ class_id (FK) ─────┼────┐   │     │    │
│  │  │                                      │ confidence         │    │   │     │    │
│  │  │                                      │ bbox_x, bbox_y     │    │   │     │    │
│  │  │                                      │ bbox_w, bbox_h     │    │   │     │    │
│  │  │                                      │ source             │    │   │     │    │
│  │  │                                      │ action_type        │    │   │     │    │
│  │  │                                      │ created_at         │    │   │     │    │
│  │  │                                      └────────────────────┘    │   │     │    │
│  │  │                                                                 │   │     │    │
│  │  │                                                                 ▼   │     │    │
│  │  │                                                      ┌──────────────┴───┐ │     │    │
│  │  │                                                      │ detection_class  │ │     │    │
│  │  │                                                      ├──────────────────┤ │     │    │
│  │  │                                                      │ class_id (PK)    │ │     │    │
│  │  │                                                      │ class_name       │ │     │    │
│  │  │                                                      │ reason           │ │     │    │
│  │  │                                                      └──────────────────┘ │     │    │
│  │  │                                                                           │     │    │
│  │  │  Key Relationships:                                                      │     │    │
│  │  │    • transformer (1) → (N) inspection                                   │     │    │
│  │  │    • transformer (1) → (N) image (denormalized FK)                      │     │    │
│  │  │    • inspection (1) → (1) image                                         │     │    │
│  │  │    • inspection (1) → (N) prediction                                    │     │    │
│  │  │    • prediction (1) → (N) prediction_detection                          │     │    │
│  │  │    • detection_class (1) → (N) prediction_detection                     │     │    │
│  │  │                                                                           │     │    │
│  │  └───────────────────────────────────────────────────────────────────────┘     │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                           │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐    │
│  │                    CLOUDINARY (Image Storage CDN)                           │    │
│  │                                                                             │    │
│  │  • Cloud-based image storage and delivery                                  │    │
│  │  • Unsigned upload preset: transformer_images_upload_unsigned              │    │
│  │  • Automatic image optimization (WebP, AVIF)                               │    │
│  │  • Global CDN distribution                                                  │    │
│  │  • Secure HTTPS URLs                                                        │    │
│  │                                                                             │    │
│  │  Upload Flow:                                                               │    │
│  │    Frontend → Cloudinary API → Secure URL → Backend (save metadata)        │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## DATA FLOW: Upload Inspection Image & Save Analysis

### **SEQUENCE DIAGRAM**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  React   │    │ Spring   │    │  Python  │    │  MySQL   │    │Cloudinary│
│ Browser  │    │ Frontend │    │  Boot    │    │  YOLO    │    │ Database │    │   CDN    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │               │
     │               │               │               │               │               │
┌────┴────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: UPLOAD THERMAL IMAGE                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
     │               │               │               │               │               │
     │  1. Upload    │               │               │               │               │
     │  Image File   │               │               │               │               │
     ├──────────────►│               │               │               │               │
     │               │               │               │               │               │
     │               │  2. Upload to Cloudinary                      │               │
     │               │  POST /v1_1/{cloud}/auto/upload               │               │
     │               ├───────────────────────────────────────────────────────────────►│
     │               │               │               │               │               │
     │               │  3. Return secure_url                          │               │
     │               │◄───────────────────────────────────────────────────────────────┤
     │               │  {secure_url, public_id}                       │               │
     │               │               │               │               │               │
     │               │  4. Create Inspection                          │               │
     │               │  POST /api/inspections                         │               │
     │               │  {transformerNo, branch,                       │               │
     │               │   inspector, inspectionTime}                   │               │
     │               ├──────────────►│               │               │               │
     │               │               │  5. Save to DB                 │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  INSERT INTO inspection        │               │
     │               │               │                                │               │
     │               │  6. Return     │                                │               │
     │               │  {inspectionId}│                                │               │
     │               │◄──────────────┤                                │               │
     │               │               │               │               │               │
     │               │  7. Save Image Metadata                        │               │
     │               │  POST /api/images                              │               │
     │               │  {imageUrl, type,                              │               │
     │               │   weatherCondition, inspectionId}              │               │
     │               ├──────────────►│               │               │               │
     │               │               │  8. Save to DB                 │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  INSERT INTO image             │               │
     │               │               │                                │               │
     │               │  9. Success    │                                │               │
     │               │◄──────────────┤                                │               │
     │               │               │               │               │               │
     │  10. Show     │               │               │               │               │
     │  Success      │               │               │               │               │
     │◄──────────────┤               │               │               │               │
     │               │               │               │               │               │
┌────┴────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: TRIGGER AI ANALYSIS                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
     │               │               │               │               │               │
     │  11. Click    │               │               │               │               │
     │  "Analyze"    │               │               │               │               │
     ├──────────────►│               │               │               │               │
     │               │               │               │               │               │
     │               │  12. Request AI Analysis                      │               │
     │               │  POST /api/inference/analyze                  │               │
     │               │  {imageUrl}                                   │               │
     │               ├──────────────►│               │               │               │
     │               │               │               │               │               │
     │               │               │  13. Download Image from CDN  │               │
     │               │               ├───────────────────────────────────────────────►│
     │               │               │               │               │               │
     │               │               │  14. Image data                │               │
     │               │               │◄───────────────────────────────────────────────┤
     │               │               │               │               │               │
     │               │               │  15. Save to temp:            │               │
     │               │               │  inference-uploads/{uuid}.jpg │               │
     │               │               │               │               │               │
     │               │               │  16. Execute Python Script     │               │
     │               │               │  python seg_infer_and_label_5c.py              │
     │               │               │  --weights best.pt            │               │
     │               │               │  --source {image_path}        │               │
     │               │               │  --conf 0.25 --stdout_json    │               │
     │               │               ├──────────────►│               │               │
     │               │               │               │               │               │
     │               │               │               │  17. Load YOLO Model          │
     │               │               │               │  (YOLOv11n-seg)               │
     │               │               │               │               │               │
     │               │               │               │  18. Run Inference            │
     │               │               │               │  (Detect anomalies)           │
     │               │               │               │               │               │
     │               │               │               │  19. Apply Thresholds         │
     │               │               │               │  (confidence > 0.25)          │
     │               │               │               │               │               │
     │               │               │  20. Return JSON to stdout     │               │
     │               │               │  {image, pred_label, detections}              │
     │               │               │◄──────────────┤               │               │
     │               │               │               │               │               │
     │               │               │  21. Parse JSON                │               │
     │               │               │  Convert to DTOs               │               │
     │               │               │               │               │               │
     │               │               │  22. Save Prediction           │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  INSERT INTO prediction        │               │
     │               │               │  (sessionType='AI_ANALYSIS')   │               │
     │               │               │                                │               │
     │               │               │  23. Save Detections           │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  INSERT INTO prediction_detection              │
     │               │               │  (source='AI_DETECTED', action='ORIGINAL')     │
     │               │               │                                │               │
     │               │  24. Return Results                            │               │
     │               │  {predictionId, detections[]}                 │               │
     │               │◄──────────────┤                                │               │
     │               │               │               │               │               │
     │  25. Display  │               │               │               │               │
     │  Annotated    │               │               │               │               │
     │  Image        │               │               │               │               │
     │◄──────────────┤               │               │               │               │
     │               │               │               │               │               │
┌────┴────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: MANUAL ANNOTATION                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
     │               │               │               │               │               │
     │  26. Edit/Add │               │               │               │               │
     │  Annotation   │               │               │               │               │
     ├──────────────►│               │               │               │               │
     │               │               │               │               │               │
     │               │  27. Save Manual Detection                    │               │
     │               │  POST /api/detections                         │               │
     │               │  {predictionId, classId, x1, y1, x2, y2,      │               │
     │               │   confidence: 1.0, comments}                  │               │
     │               ├──────────────►│               │               │               │
     │               │               │               │               │               │
     │               │               │  28. Create Prediction         │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  INSERT INTO prediction        │               │
     │               │               │  (sessionType='MANUAL_EDITING')│               │
     │               │               │                                │               │
     │               │               │  29. Save Detection            │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  INSERT INTO prediction_detection              │
     │               │               │  (source='MANUALLY_ADDED')     │               │
     │               │               │                                │               │
     │               │  30. Success   │                                │               │
     │               │◄──────────────┤                                │               │
     │               │               │               │               │               │
     │  31. Update   │               │               │               │               │
     │  Display      │               │               │               │               │
     │◄──────────────┤               │               │               │               │
     │               │               │               │               │               │
┌────┴────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: AUTOMATED MODEL RETRAINING (Daily @ 1:00 AM)                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
     │               │               │               │               │               │
     │               │          ┌────┴─────┐         │               │               │
     │               │          │ @Scheduled│         │               │               │
     │               │          │  Task     │         │               │               │
     │               │          └────┬─────┘         │               │               │
     │               │               │               │               │               │
     │               │               │  32. Query manual edits       │               │
     │               │               ├──────────────────────────────►│               │
     │               │               │  SELECT * WHERE                │               │
     │               │               │  source='MANUALLY_ADDED'       │               │
     │               │               │  AND created_at >= YESTERDAY   │               │
     │               │               │                                │               │
     │               │               │  33. Return annotations        │               │
     │               │               │◄──────────────────────────────┤               │
     │               │               │               │               │               │
     │               │               │  34. Execute finetune.py       │               │
     │               │               │  (if edits >= 1)              │               │
     │               │               ├──────────────►│               │               │
     │               │               │               │               │               │
     │               │               │               │  35. Fetch data from DB       │
     │               │               │               ├──────────────────────────────►│
     │               │               │               │  (manual annotations)         │
     │               │               │               │                                │
     │               │               │               │  36. Combine with baseline    │
     │               │               │               │  (70/20/10 split)             │
     │               │               │               │               │               │
     │               │               │               │  37. Fine-tune YOLO           │
     │               │               │               │  (epochs=60, lr=0.00001)      │
     │               │               │               │               │               │
     │               │               │  38. Save improved weights     │               │
     │               │               │  (best_updated.pt)            │               │
     │               │               │◄──────────────┤               │               │
     │               │               │               │               │               │
     │               │               │  39. Update production model   │               │
     │               │               │  (replace best.pt)            │               │
     │               │               │               │               │               │
     │               │               │  40. Log success               │               │
     │               │               │                                │               │
     │               │               │               │               │               │
```

---

## KEY REST API ENDPOINTS SUMMARY

### **Authentication (Public)**
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/register` | Register new user | `{email, password, name}` | `{token, user}` |
| POST | `/api/auth/login` | Login user | `{email, password}` | `{token, user}` |

### **Transformers (Protected - JWT Required)**
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/transformers` | List all transformers | `TransformerDTO[]` |
| POST | `/api/transformers` | Create transformer | `TransformerDTO` |
| GET | `/api/transformers/{transformerNo}` | Get details | `TransformerDTO` |
| PUT | `/api/transformers/{transformerNo}` | Update transformer | `TransformerDTO` |
| DELETE | `/api/transformers/{transformerNo}` | Delete transformer | `204 No Content` |

### **Inspections (Protected - JWT Required)**
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/api/inspections` | Create inspection | `InspectionDTO` |
| GET | `/api/inspections/transformer/{transformerNo}` | List by transformer | `InspectionDTO[]` |
| GET | `/api/inspections/{id}` | Get details | `InspectionDTO` |
| DELETE | `/api/inspections/{id}` | Delete inspection | `204 No Content` |

### **Images (Protected - JWT Required)**
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/api/images` | Save image metadata | `ImageDTO` |
| GET | `/api/images/{id}` | Get image details | `ImageDTO` |
| GET | `/api/images/inspection/{inspectionId}` | Get by inspection | `ImageDTO` |

### **AI Inference (Protected - JWT Required)**
| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/inference/analyze` | Trigger AI analysis | `{imageUrl}` | `PredictionDTO` |
| PUT | `/api/inference/threshold` | Update confidence threshold | `{percentage}` | `200 OK` |

### **Detections/Annotations (Protected - JWT Required)**
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/detections/prediction/{predictionId}` | Get all detections | `DetectionDTO[]` |
| POST | `/api/detections` | Create manual annotation | `DetectionDTO` |
| PUT | `/api/detections/{id}` | Update annotation | `DetectionDTO` |
| DELETE | `/api/detections/{id}` | Delete annotation | `204 No Content` |

---

## TECHNOLOGY STACK

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.1.0 | UI framework |
| | TypeScript | 5.8.3 | Type safety |
| | Material-UI | 7.3.1 | Component library |
| | Vite | 7.0.4 | Build tool |
| | React Router | 7.8.1 | Client-side routing |
| **Backend** | Spring Boot | 3.5.4 | Application framework |
| | Java | 21 | Programming language |
| | Spring Security | - | JWT authentication |
| | Spring Data JPA | - | ORM |
| | Hibernate | - | Database abstraction |
| **AI/ML** | Python | 3.9 | Scripting language |
| | PyTorch | 2.8.0 | Deep learning framework |
| | Ultralytics YOLO | v11 | Object detection model |
| **Database** | MySQL | 8.x | Relational database |
| **Storage** | Cloudinary | - | Image CDN & storage |
| **Security** | JWT | - | Token-based auth |
| | BCrypt | - | Password hashing |

---

## DATA FLOW PATTERNS

### **1. RESTful Principles Applied:**
- **Resource-based URLs:** `/api/transformers`, `/api/inspections`
- **HTTP Methods:** GET (read), POST (create), PUT (update), DELETE (delete)
- **Stateless:** JWT tokens for authentication (no server sessions)
- **JSON Format:** All request/response bodies use JSON
- **Status Codes:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 404 Not Found

### **2. Security Patterns:**
- **JWT Authentication:** Bearer token in `Authorization` header
- **CORS Configuration:** Allow localhost origins for development
- **Password Hashing:** BCrypt with salt
- **Public Endpoints:** `/api/auth/**` (login/register only)
- **Protected Endpoints:** All other APIs require valid JWT

### **3. Integration Patterns:**
- **Java-Python Communication:** ProcessBuilder (OS-level process spawn)
- **Data Exchange:** JSON via stdout/stdin
- **Asynchronous Processing:** Python runs in separate process
- **Error Handling:** Exit codes and stderr capture

### **4. Storage Patterns:**
- **Metadata in Database:** All structured data (transformers, inspections, detections)
- **Images in Cloud:** Cloudinary CDN for binary files
- **Temporary Files:** Local filesystem for AI processing, cleaned after use
- **Model Weights:** Local filesystem, versioned and backed up

---

*This diagram represents the complete end-to-end architecture of the Transformer Maintenance System, showing all components, their interactions, and data flows.*
