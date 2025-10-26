# TRANSFORMER MAINTENANCE SYSTEM - EXAM ANSWERS

## TABLE OF CONTENTS
1. [Architecture & Design](#architecture--design)
2. [Database Schema](#database-schema)
3. [Phase 1: Transformer & Image Management](#phase-1-transformer--image-management)
4. [Phase 2: Anomaly Detection](#phase-2-anomaly-detection)
5. [Phase 3: Interactive Annotation](#phase-3-interactive-annotation)
6. [Phase 4: Maintenance Records](#phase-4-maintenance-records)
7. [Technical Implementation](#technical-implementation)
8. [Data Flow & Integration](#data-flow--integration)

---

## ARCHITECTURE & DESIGN

### Q: Explain the overall architecture of your transformer maintenance system

**Answer:**
Our system follows a **three-tier architecture**:

1. **Presentation Layer (Frontend - React)**
   - Single Page Application (SPA) built with React
   - Material-UI components for consistent UI/UX
   - Handles user interactions, image display, and annotation tools
   - Communicates with backend via RESTful APIs

2. **Application Layer (Backend - Spring Boot)**
   - RESTful API layer with controllers handling HTTP requests
   - Service layer containing business logic
   - Repository layer for database operations using JPA
   - Security layer with JWT-based authentication
   - Integration with Python-based AI model via ProcessBuilder

3. **Data Layer**
   - MySQL relational database for structured data (transformers, inspections, predictions, annotations)
   - File system storage for thermal images (inference-uploads directory)
   - Training dataset storage for model retraining

### Q: Describe how the frontend and backend communicate

**Answer:**
Communication happens through **RESTful APIs over HTTP**:

1. **Request Flow:**
   - Frontend makes HTTP requests (GET, POST, PUT, DELETE) to backend endpoints
   - Requests include JWT token in Authorization header for authenticated endpoints
   - Request/response bodies use JSON format
   - Base URL: `http://localhost:8080/api` (configured in frontend services)

2. **Key API Endpoints:**
   - `/api/transformers` - Transformer CRUD operations
   - `/api/inspections` - Inspection management
   - `/api/images` - Upload and retrieve thermal images
   - `/api/predictions/{predictionId}/detections` - Get all detections
   - `/api/detections` - Create/update/delete manual annotations
   - `/api/auth/login` & `/api/auth/register` - Authentication

3. **Frontend Service Layer:**
   ```typescript
   // annotationService.ts
   const API_BASE_URL = 'http://localhost:8080/api';
   
   async createDetection(data: CreateAnnotationRequest) {
       const response = await fetch(`${API_BASE_URL}/detections`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               ...authService.getAuthHeader(),  // Adds JWT token
           },
           body: JSON.stringify(data),
       });
       return response.json();
   }
   ```

4. **Data Transfer Objects (DTOs):**
   - `TransformerDTO`, `InspectionDTO`, `PredictionDTO`, `DetectionDTO`
   - DTOs validate input and structure responses
   - TypeScript interfaces on frontend mirror backend DTOs

### Q: What design patterns did you use and why?

**Answer:**

1. **MVC Pattern (Model-View-Controller)**
   - **Model:** JPA entities (Transformer, Inspection, Prediction, etc.)
   - **View:** React components
   - **Controller:** Spring REST controllers
   - **Why:** Separates concerns, makes code maintainable

2. **Repository Pattern**
   - Spring Data JPA repositories for data access
   - **Why:** Abstracts database operations, easy to test

3. **Service Layer Pattern**
   - Business logic in service classes
   - **Why:** Separates business logic from controllers, promotes reusability

4. **DTO Pattern**
   - Data Transfer Objects for API communication
   - **Why:** Decouples internal entities from external API contract

5. **Dependency Injection**
   - Spring's @Autowired for dependency management
   - **Why:** Loose coupling, easier testing with mocks

6. **Builder Pattern**
   - Lombok's @Builder for entity creation
   - **Why:** Clean object construction with many parameters

---

## DATABASE SCHEMA

### Q: Explain your database schema for storing transformers, images, and annotations

**Answer:**

**Core Tables:**

1. **transformer**
   ```
   - transformer_no (PK, VARCHAR) - Unique identifier
   - pole_no (VARCHAR) - Physical pole number
   - region (VARCHAR) - Geographic location
   - type (VARCHAR) - Transformer type/model
   - location (VARCHAR) - Detailed address
   - favorite (BOOLEAN) - Quick access flag
   - created_at, updated_at (TIMESTAMP)
   ```

2. **inspection**
   ```
   - inspection_id (PK, AUTO_INCREMENT)
   - transformer_no (FK) - Links to transformer
   - inspection_time (TIMESTAMP) - When inspection occurred
   - branch (VARCHAR) - Branch/department
   - inspector (VARCHAR) - Inspector name
   - favorite (BOOLEAN)
   - created_at, updated_at (TIMESTAMP)
   ```

3. **image**
   ```
   - image_id (PK, AUTO_INCREMENT)
   - inspection_id (FK, UNIQUE) - One-to-one with inspection
   - transformer_no (FK) - Direct link to transformer
   - image_url (VARCHAR) - File path/URL
   - type (VARCHAR) - "baseline" or "maintenance"
   - weather_condition (VARCHAR) - "sunny", "cloudy", "rainy"
   - created_at, updated_at (TIMESTAMP)
   ```

4. **prediction**
   ```
   - prediction_id (PK, AUTO_INCREMENT)
   - inspection_id (FK) - Links to inspection
   - user_id (FK) - Who triggered analysis
   - session_type (VARCHAR) - "AI_ANALYSIS" or "MANUAL_EDITING"
   - predicted_label (VARCHAR) - Overall assessment
   - model_timestamp (VARCHAR) - AI model execution time
   - issue_count (INT) - Number of anomalies detected
   - created_at, updated_at (TIMESTAMP)
   ```

5. **prediction_detection**
   ```
   - detection_id (PK, AUTO_INCREMENT)
   - prediction_id (FK) - Links to prediction session
   - inspection_id (INT) - Denormalized for quick access
   - log_entry_id (INT) - Sequence number within prediction
   - class_id (INT, FK) - Type of anomaly detected
   - confidence (DOUBLE) - AI confidence score (0-1)
   - bbox_x, bbox_y, bbox_w, bbox_h (INT) - Bounding box coordinates
   - source (ENUM) - "AI_DETECTED", "MANUALLY_ADDED"
   - action_type (ENUM) - "ORIGINAL", "EDITED", "DELETED"
   - created_at (TIMESTAMP)
   ```

6. **detection_class**
   ```
   - class_id (PK)
   - class_name (VARCHAR) - e.g., "loose_joint_red", "point_overload_yellow"
   - reason (VARCHAR) - Description of the issue
   ```

### Q: How do you maintain relationships between transformers, baseline images, and maintenance images?

**Answer:**

**Relationship Structure:**
```
Transformer (1) ←→ (N) Inspection (1) ←→ (1) Image
     ↓
   (N) Prediction (1) ←→ (N) PredictionDetection
```

**Key Relationships:**

1. **Transformer ↔ Inspection:** One-to-Many
   - A transformer can have multiple inspections over time
   - `@OneToMany` in Transformer entity
   - `@ManyToOne` in Inspection entity

2. **Inspection ↔ Image:** One-to-One
   - Each inspection has exactly one thermal image
   - `@OneToOne` with unique constraint on inspection_id
   - Ensures data integrity

3. **Image ↔ Transformer:** Many-to-One (Denormalized)
   - Direct link for efficient queries
   - Helps retrieve all images for a transformer quickly

4. **Inspection ↔ Prediction:** One-to-Many
   - One inspection can have multiple prediction sessions (initial AI analysis + manual edits)
   - Tracks version history of analysis

5. **Prediction ↔ PredictionDetection:** One-to-Many
   - One prediction session contains multiple detected anomalies
   - Cascade delete ensures cleanup

**Baseline vs Maintenance Differentiation:**
- Stored in `image.type` field: "baseline" or "maintenance"
- Baseline images have `weather_condition` populated
- Query by type to fetch appropriate comparison images

### Q: How are annotations persisted in the database?

**Answer:**

Annotations are stored in the **prediction_detection** table with comprehensive metadata:

1. **Storage Structure:**
   ```java
   PredictionDetection {
       - detection_id: Unique identifier
       - prediction_id: Links to analysis session
       - class_id: Anomaly type (FK to detection_class)
       - confidence: AI confidence or 1.0 for manual
       - bbox_x, bbox_y, bbox_w, bbox_h: Coordinates
       - source: "AI_DETECTED" | "MANUALLY_ADDED"
       - action_type: "ORIGINAL" | "EDITED" | "DELETED"
       - created_at: Timestamp
   }
   ```

2. **Annotation Workflow:**
   
   **AI Detection (Phase 2):**
   - AI model detects anomalies
   - Saved with source="AI_DETECTED", action_type="ORIGINAL"
   - Confidence score from model (0.0 - 1.0)

   **Manual Edit (Phase 3):**
   - User adjusts existing detection:
     - Creates new row with action_type="EDITED"
     - Original detection remains with action_type="ORIGINAL"
   
   - User deletes false positive:
     - Creates new row with action_type="DELETED"
     - Marks detection as invalid for future reference
   
   - User adds new annotation:
     - Creates new row with source="MANUALLY_ADDED"
     - Confidence = 1.0 (human verified)

3. **Version Tracking:**
   - Each modification creates a new prediction session
   - Preserves audit trail of changes
   - Can retrieve any historical state

4. **Query Strategy:**
   ```sql
   -- Get latest valid annotations
   SELECT * FROM prediction_detection pd
   JOIN (SELECT MAX(prediction_id) as latest_pid 
         FROM prediction 
         WHERE inspection_id = ?) latest
   ON pd.prediction_id = latest.latest_pid
   WHERE pd.action_type != 'DELETED'
   ```

---

## PHASE 1: TRANSFORMER & IMAGE MANAGEMENT

### Q: How do you categorize baseline images by environmental conditions?

**Answer:**

Environmental categorization is handled during image upload:

1. **Database Field:**
   - `image.weather_condition` (VARCHAR)
   - Allowed values: "sunny", "cloudy", "rainy"

2. **Upload Process:**
   ```java
   // Frontend sends:
   {
     "transformerNo": "T001",
     "imageFile": <binary>,
     "type": "baseline",
     "weatherCondition": "sunny"  // Dropdown selection
   }
   
   // Backend validates and stores:
   Image image = new Image();
   image.setType("baseline");
   image.setWeatherCondition(weatherCondition);
   imageRepository.save(image);
   ```

3. **Frontend Implementation:**
   - Dropdown/Select component with three options
   - Only shown when image type is "baseline"
   - Required field validation before submission

4. **Use Case:**
   - When analyzing maintenance images, system can compare with baseline under similar weather
   - Improves accuracy by accounting for environmental thermal variations

### Q: Explain the metadata stored with each uploaded image

**Answer:**

**Image Entity Metadata:**
```java
{
  "imageId": 1,                    // Auto-generated primary key
  "inspectionId": 5,              // Link to inspection record
  "transformerNo": "T001",        // Direct link to transformer
  "imageUrl": "path/to/image.jpg", // File system location
  "type": "baseline|maintenance",  // Image classification
  "weatherCondition": "sunny",    // Environmental context (baseline only)
  "createdAt": "2025-10-26T10:30:00", // Upload timestamp
  "updatedAt": "2025-10-26T10:30:00"  // Last modification
}
```

**Associated Inspection Metadata:**
```java
{
  "inspectionId": 5,
  "transformerNo": "T001",
  "inspectionTime": "2025-10-26T09:00:00",
  "branch": "Distribution North",
  "inspector": "John Doe",
  "favorite": false
}
```

**Complete Context:**
- Who uploaded (inspector)
- When uploaded (created_at)
- Which transformer (transformer_no)
- What type (baseline/maintenance)
- Weather conditions (for baseline)
- Physical location (from transformer entity)

### Q: How do you handle image storage and retrieval efficiently?

**Answer:**

**Storage Strategy:**

1. **Cloud Storage (Cloudinary):**
   ```typescript
   // InspectionDetails.tsx
   const CLOUD_NAME = "ddleqtgrj";
   const UNSIGNED_PRESET = "transformer_images_upload_unsigned";
   
   async function uploadUnsignedToCloudinary(file: File) {
       const form = new FormData();
       form.append("file", file);
       form.append("upload_preset", UNSIGNED_PRESET);
       
       const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
       const resp = await fetch(url, { method: "POST", body: form });
       
       // Returns: { secure_url, public_id, resource_type }
       return resp.json();
   }
   ```

2. **Two-Step Upload Process:**
   ```typescript
   // Step 1: Upload image to Cloudinary
   const cloudinaryResponse = await uploadUnsignedToCloudinary(imageFile);
   
   // Step 2: Save metadata to backend
   await saveImageMetadata({
       imageUrl: cloudinaryResponse.secure_url,  // Cloudinary URL
       type: "thermal",  // or "baseline"
       weatherCondition: "Sunny",
       inspectionId: inspectionId,
       transformerNo: transformerNo
   });
   ```

3. **Why Cloudinary:**
   - **CDN:** Global delivery, fast loading
   - **No server storage:** Backend doesn't handle binary data
   - **Automatic optimization:** Image compression, format conversion
   - **Scalability:** Unlimited storage
   - **Security:** Unsigned preset restricts upload to specific folder

4. **Local Development Alternative:**
   - AI inference uses local file system
   - Structure: `inference-uploads/pred-{uuid}/image.jpg`
   - Database stores only the file path reference

**Retrieval Strategy:**

1. **Database Query:**
   ```sql
   SELECT image_url FROM image WHERE inspection_id = ?
   ```

2. **Frontend Display:**
   ```tsx
   <img src={inspection.imageUrl} alt="Thermal Image" />
   // imageUrl is Cloudinary URL - direct load from CDN
   ```

3. **Caching:**
   - Browser caching for Cloudinary URLs
   - CDN edge caching worldwide
   - No backend involvement in image serving

4. **Optimization:**
   - Lazy loading in React components
   - Cloudinary automatic format selection (WebP, AVIF)
   - Responsive images via URL transformations

---

## PHASE 2: ANOMALY DETECTION

### Q: Describe your AI-based anomaly detection approach

**Answer:**

**Detection Method:** Deep Learning with YOLOv11 Segmentation Model

**Approach:**

1. **Model Architecture:**
   - YOLOv11n-seg (YOLO11 nano segmentation model)
   - Pre-trained on custom thermal image dataset
   - Detects 5 anomaly classes:
     - loose_joint_red (critical)
     - loose_joint_yellow (warning)
     - point_overload_red (critical)
     - point_overload_yellow (warning)
     - full_wire_yellow (warning)

2. **Integration Architecture:**
   ```
   Spring Boot → ProcessBuilder → Python Script → YOLO Model → JSON Output → Spring Boot
   ```

3. **Python Integration:**
   ```java
   // PythonInferenceService.java
   ProcessBuilder pb = new ProcessBuilder(
       "python",
       "seg_infer_and_label_5c.py",
       "--weights", "best.pt",
       "--source", imagePath,
       "--conf", "0.25",    // Confidence threshold
       "--iou", "0.025"     // NMS threshold
   );
   Process p = pb.start();
   String jsonOutput = readOutput(p);
   PredictionDTO result = parseJson(jsonOutput);
   ```

4. **Why YOLO:**
   - **Real-time:** Fast inference (<2s per image)
   - **Accurate:** Proven architecture for object detection
   - **Flexible:** Can retrain with manual corrections

### Q: How does the system compare maintenance images with baseline images?

**Answer:**

**Comparison Logic:**

1. **Image Retrieval:**
   ```java
   // Get baseline image for same transformer
   Image baseline = imageRepository
       .findByTransformerNoAndType(transformerNo, "baseline")
       .orElse(null);
   
   // Get maintenance image from current inspection
   Image maintenance = inspection.getImage();
   ```

2. **AI Analysis:**
   - **No Direct Pixel Comparison:** YOLO analyzes maintenance image independently
   - Detects anomalies based on learned thermal patterns
   - Not dependent on baseline for detection

3. **Visual Comparison (Frontend):**
   - Side-by-side display of baseline and maintenance
   - Helps engineers visually assess changes
   - Anomalies highlighted on maintenance image only

4. **Threshold-based Flagging:**
   ```python
   # In Python script
   CLASS_THRESH = {
       0: 0.25,  # Confidence threshold per class
       1: 0.25,
       2: 0.25,
       3: 0.25,
       4: 0.25
   }
   
   for detection in results:
       if detection.confidence > CLASS_THRESH[detection.class_id]:
           mark_as_anomaly(detection)
   ```

5. **Metadata Comparison:**
   - System can track:
     - Number of anomalies now vs baseline
     - Severity changes over time
     - New hotspot locations

**Note:** The baseline serves as visual reference for engineers, but AI detection is absolute (not differential analysis).

### Q: Explain your thresholding mechanism for detecting anomalies

**Answer:**

**Threshold System:**

1. **Confidence Threshold:**
   - Default: 25% (0.25)
   - Configurable per class via `CLASS_THRESH` mapping
   - Adjustable through application.properties

2. **Dynamic Threshold Update:**
   ```java
   // PythonInferenceService.java
   public void updateClassThresholdPercentage(double percentage) {
       double fraction = percentage / 100.0;
       // Updates Python script's CLASS_THRESH variable
       modifyPythonScriptThreshold(fraction);
   }
   ```

3. **IOU (Intersection over Union) Threshold:**
   - Set to 0.025 for Non-Maximum Suppression
   - Removes duplicate/overlapping detections
   - Keeps only most confident detection per location

4. **Multi-level Severity:**
   - Red-class anomalies: High severity (immediate action)
   - Yellow-class anomalies: Medium severity (monitor/schedule)
   - System can prioritize based on class_name

5. **Threshold Tuning:**
   - Lower threshold → More detections (higher recall, more false positives)
   - Higher threshold → Fewer detections (lower recall, fewer false positives)
   - Current 25% balances precision/recall for production use

### Q: How do you optimize model inference time?

**Answer:**

**Optimization Strategies:**

1. **Model Selection:**
   - YOLOv11n (nano variant) - smallest/fastest
   - Trade-off: Slightly lower accuracy for speed
   - Inference time: ~1-2 seconds per image on CPU

2. **Device Configuration:**
   ```python
   device = '0' if torch.cuda.is_available() else 'cpu'
   model.train(device=device, ...)
   ```
   - Auto-detects GPU if available
   - Falls back to CPU gracefully

3. **Image Size:**
   - Fixed input size: 640x640 pixels
   - Smaller than training data for faster processing
   - Maintains accuracy while improving speed

4. **Batch Processing:**
   - Current: Single image processing
   - Future: Can batch multiple inspections

5. **Asynchronous Processing:**
   - Analysis runs in separate Python process
   - Doesn't block Spring Boot main thread
   - Can return job ID and poll for results

6. **Caching:**
   - Results stored in database
   - Re-analysis only if image changes
   - Avoid redundant computation

7. **Resource Management:**
   - Model loaded once, reused for all inferences
   - Proper cleanup of temporary files
   - Memory-efficient image handling

---

## PHASE 2: ANOMALY DETECTION (DETAILED)

### Q: Explain the complete flow of how Python inference integration works

**Answer:**

**System Architecture:**

The system uses a **Java-Python hybrid architecture** where:
- Spring Boot backend handles HTTP requests and database operations
- Python YOLO model performs AI inference
- Communication via ProcessBuilder and JSON

**Complete Inference Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: INFERENCE FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. USER ACTION (Frontend)
   │
   ├─> User uploads thermal image via React UI
   │   POST /api/inference/analyze
   │   Content-Type: multipart/form-data
   │
   ↓

2. SPRING BOOT CONTROLLER (InferenceController.java)
   │
   ├─> @PostMapping("/analyze")
   ├─> Receives MultipartFile
   ├─> Calls pythonInferenceService.runInference(file)
   │
   ↓

3. PYTHON INFERENCE SERVICE (PythonInferenceService.java)
   │
   ├─> Step 3a: FILE PREPARATION
   │   ├─> Generate UUID for unique run ID
   │   ├─> Save uploaded file to: inference-uploads/{uuid}-{filename}
   │   └─> Validate script and weights exist
   │
   ├─> Step 3b: BUILD PYTHON COMMAND
   │   ProcessBuilder cmd = [
   │       "python",
   │       "seg_infer_and_label_5c.py",
   │       "--weights", "best.pt",
   │       "--source", "inference-uploads/{uuid}-image.jpg",
   │       "--out", "inference-uploads/pred-{uuid}/",
   │       "--conf", "0.25",           // Confidence threshold
   │       "--iou", "0.025",           // NMS threshold
   │       "--imgsz", "640",           // Image size
   │       "--stdout_json"             // Output format
   │   ]
   │
   ├─> Step 3c: EXECUTE PYTHON PROCESS
   │   ├─> ProcessBuilder.start()
   │   ├─> Capture stdout/stderr via BufferedReader
   │   └─> Wait for process completion (waitFor())
   │
   ↓

4. PYTHON SCRIPT EXECUTION (seg_infer_and_label_5c.py)
   │
   ├─> Step 4a: LOAD MODEL
   │   └─> model = YOLO(weights_path)  # YOLOv11n-seg
   │
   ├─> Step 4b: RUN INFERENCE
   │   └─> results = model.predict(
   │           source=image_path,
   │           conf=0.25,
   │           iou=0.025,
   │           imgsz=640
   │       )
   │
   ├─> Step 4c: PROCESS DETECTIONS
   │   For each detection in results:
   │       ├─> Extract class_id (0-4)
   │       ├─> Map to class_name (e.g., "loose_joint_red")
   │       ├─> Get confidence score
   │       ├─> Extract polygon coordinates
   │       └─> Check against CLASS_THRESH
   │
   ├─> Step 4d: GENERATE OUTPUT
   │   ├─> Create annotated image with bounding boxes
   │   ├─> Save to: inference-uploads/pred-{uuid}/overlays/
   │   └─> Print JSON to stdout:
   │       {
   │           "image": "path/to/image.jpg",
   │           "pred_image_label": "FAULTY",
   │           "timestamp": "2025-10-26T15:30:00",
   │           "detections": [
   │               {
   │                   "class_id": 1,
   │                   "class_name": "loose_joint_red",
   │                   "reason": "Critical loose connection",
   │                   "confidence": 0.87,
   │                   "polygon_xy": [[150,200],[230,200],...]
   │               }
   │           ]
   │       }
   │
   ↓

5. JAVA PROCESSING (Back to PythonInferenceService)
   │
   ├─> Step 5a: PARSE JSON OUTPUT
   │   ├─> Read last JSON line from stdout
   │   ├─> ObjectMapper.readTree(jsonLine)
   │   └─> Extract: image, pred_label, timestamp, detections[]
   │
   ├─> Step 5b: CONVERT TO DTOs
   │   For each detection in JSON:
   │       ├─> Create DetectionDTO
   │       ├─> Calculate bounding box from polygon:
   │       │   minX = min(all x coordinates)
   │       │   minY = min(all y coordinates)
   │       │   width = maxX - minX
   │       │   height = maxY - minY
   │       └─> BoundingBoxDTO(minX, minY, width, height)
   │
   ├─> Step 5c: BUILD RESPONSE
   │   └─> PredictionDTO(
   │           image, predLabel, detections, timestamp, rawJson
   │       )
   │
   ├─> Step 5d: CLEANUP (Optional)
   │   ├─> Delete temp input file
   │   └─> Delete output folder (if keepArtifacts=false)
   │
   ↓

6. DATABASE PERSISTENCE (InferenceController)
   │
   ├─> Create Prediction entity
   │   ├─> prediction.sessionType = "AI_ANALYSIS"
   │   ├─> prediction.predictedLabel = "FAULTY"
   │   ├─> prediction.modelTimestamp = "2025-10-26T15:30:00"
   │   └─> prediction.issueCount = detections.size()
   │
   ├─> For each detection:
   │   └─> Create PredictionDetection entity
   │       ├─> classId = 1
   │       ├─> confidence = 0.87
   │       ├─> bboxX, bboxY, bboxW, bboxH
   │       ├─> source = "AI_DETECTED"
   │       └─> actionType = "ORIGINAL"
   │
   └─> Save to database
   
   ↓

7. RESPONSE TO FRONTEND
   │
   └─> Return JSON:
       {
           "predictionId": 123,
           "predictedLabel": "FAULTY",
           "issueCount": 3,
           "detections": [
               {
                   "classId": 1,
                   "className": "loose_joint_red",
                   "confidence": 0.87,
                   "boundingBox": { "x": 150, "y": 200, "width": 80, "height": 120 }
               }
           ]
       }

8. FRONTEND RENDERING (ThermalImageAnalysis.tsx)
   │
   ├─> Display thermal image
   ├─> Overlay bounding boxes (color-coded by severity)
   ├─> Show anomaly list with details
   └─> Enable zoom/pan controls
```

**Key Integration Points:**

1. **File Handling:**
   - Java saves uploaded file to temp directory
   - Python reads from same path
   - UUID ensures no collisions

2. **Process Communication:**
   - Java uses ProcessBuilder (OS-level process spawn)
   - Python outputs JSON to stdout
   - Java reads stdout line-by-line

3. **Error Handling:**
   - Check exit code (0 = success)
   - Validate file paths before execution
   - Capture stderr for debugging

4. **Data Mapping:**
   - JSON → Java DTOs via Jackson ObjectMapper
   - Polygon coordinates → Axis-aligned bounding box
   - Class IDs → Human-readable names

**Configuration (application.properties):**
```properties
inference.python=python
inference.script.path=anomaly-detector/Fault Detection v11-2/seg_infer_and_label_5c.py
inference.weights.path=anomaly-detector/Fault Detection v11/runs_yolo/.../best.pt
inference.temp.dir=inference-uploads
inference.keep.artifacts=false
```

---

## PHASE 3: INTERACTIVE ANNOTATION

### Q: Explain how users can modify AI-detected anomalies

**Answer:**

**Annotation UI Components:**

The system uses two main React components:
1. **ThermalImageAnalysis.tsx** - Displays AI detections with bounding boxes
2. **DrawingCanvas.tsx** - Interactive annotation tool for editing

**Annotation Actions:**

1. **Edit Existing Detection:**
   ```typescript
   // DrawingCanvas.tsx
   const handleEditDetection = async (detection: ActivityLogEntry) => {
       // User clicks on existing bounding box
       // Canvas allows dragging/resizing
       // On save:
       const updatedData = {
           predictionId: detection.predictionId,
           classId: detection.classId,
           x1: newBounds.x,
           y1: newBounds.y,
           x2: newBounds.x + newBounds.width,
           y2: newBounds.y + newBounds.height,
           confidence: 1.0,  // Manual edits = 100% confidence
           comments: userComments
       };
       
       await annotationService.updateDetection(
           detection.detectionId, 
           updatedData
       );
   };
   ```

2. **Delete False Positive:**
   ```typescript
   // useDetections.ts hook
   const deleteDetection = async (detectionId: number, reason?: string) => {
       try {
           await annotationService.deleteDetection(detectionId, reason);
           // Remove from UI state (soft delete in backend)
           setDetections(prev => 
               prev.filter(d => d.detectionId !== detectionId)
           );
       } catch (err) {
           setError('Failed to delete detection');
       }
   };
   ```

3. **Add New Annotation:**
   ```typescript
   // DrawingCanvas.tsx
   const handleAddDetection = async () => {
       // User draws new bounding box
       // Selects fault type from dropdown
       // Adds optional comments
       
       const newDetection: CreateAnnotationRequest = {
           predictionId: currentPredictionId,
           classId: selectedFaultTypeId,  // 0-4 for different fault types
           x1: boundingBox.x,
           y1: boundingBox.y,
           x2: boundingBox.x + boundingBox.width,
           y2: boundingBox.y + boundingBox.height,
           confidence: 1.0,
           comments: userComments
       };
       
       const created = await annotationService.createDetection(newDetection);
       setDetections(prev => [...prev, created]);
   };
   ```

**UI Features:**
- **Zoom & Pan:** ZoomableImage component for detailed inspection
- **Color Coding:** Red for critical (faulty), Orange for warning (potential)
- **Fault Types Dropdown:** 5 predefined types matching backend classes
- **Canvas Drawing:** Mouse-based rectangle drawing
- **Real-time Updates:** useDetections hook manages state

**Backend Processing:**
```java
@PostMapping("/api/manual-detections")
public ResponseEntity<?> saveManualDetection(@RequestBody DetectionDTO dto) {
    // Create new prediction session
    Prediction prediction = new Prediction();
    prediction.setSessionType("MANUAL_EDITING");
    prediction.setInspection(inspection);
    predictionRepository.save(prediction);
    
    // Create detection entry
    PredictionDetection detection = new PredictionDetection();
    detection.setPrediction(prediction);
    detection.setSource(DetectionSource.MANUALLY_ADDED);
    detection.setActionType(dto.getActionType());
    // ... set other fields
    detectionRepository.save(detection);
    
    return ResponseEntity.ok(detection);
}
```

### Q: How are user annotations stored and retrieved?

**Answer:**

**Storage Schema:**
```
prediction_detection table:
- detection_id (PK)
- prediction_id (FK) → Links to prediction session
- inspection_id → Denormalized for fast queries
- log_entry_id → Sequence number
- class_id → Anomaly type
- confidence → 1.0 for manual, <1.0 for AI
- bbox_x, bbox_y, bbox_w, bbox_h → Coordinates
- source → ENUM('AI_DETECTED', 'MANUALLY_ADDED')
- action_type → ENUM('ORIGINAL', 'EDITED', 'DELETED')
- created_at → Timestamp
```

**Retrieval Logic:**

1. **Get Latest Annotations:**
   ```java
   // ManualDetectionService.java
   public List<PredictionDetection> getLatestAnnotations(Integer inspectionId) {
       // Get most recent prediction for this inspection
       Prediction latestPrediction = predictionRepository
           .findTopByInspectionIdOrderByCreatedAtDesc(inspectionId);
       
       // Get all detections from that session
       return detectionRepository
           .findByPredictionIdAndActionTypeNot(
               latestPrediction.getId(), 
               ActionType.DELETED
           );
   }
   ```

2. **Get Annotation History:**
   ```java
   public List<Prediction> getAnnotationHistory(Integer inspectionId) {
       return predictionRepository
           .findByInspectionIdOrderByCreatedAtDesc(inspectionId);
       // Returns all sessions with their detections
   }
   ```

3. **Query Optimization:**
   - Index on (inspection_id, created_at)
   - Index on (prediction_id, action_type)
   - Denormalized inspection_id in prediction_detection for fast access

### Q: Describe the feedback loop - how do manual corrections improve the AI model?

**Answer:**

**Feedback Integration Pipeline:**

1. **Data Collection:**
   ```java
   // Daily scheduled task
   @Scheduled(cron = "0 0 1 * * *")  // 1 AM daily
   public void collectManualEdits() {
       LocalDate today = LocalDate.now();
       
       // Query all manual edits from today
       List<PredictionDetection> manualEdits = detectionRepository
           .findBySourceAndCreatedAtBetween(
               DetectionSource.MANUALLY_ADDED,
               today.atStartOfDay(),
               today.plusDays(1).atStartOfDay()
           );
       
       if (manualEdits.size() >= 1) {
           triggerModelRetraining(manualEdits);
       }
   }
   ```

2. **Retraining Trigger:**
   ```java
   private void triggerModelRetraining(List<PredictionDetection> edits) {
       ProcessBuilder pb = new ProcessBuilder(
           "python",
           "finetune.py",
           "--best-pt", currentModelPath,
           "--dataset", baselineDatasetPath,
           "--output", retrainingOutputPath,
           "--db-host", dbHost,
           "--db-user", dbUser,
           "--db-pass", dbPass,
           "--db-name", dbName
       );
       
       Process p = pb.start();
       int exitCode = p.waitFor();
       
       if (exitCode == 0) {
           updateModelWeights();
       }
   }
   ```

3. **Python Retraining Script (finetune.py):**
   ```python
   # Fetch manual edits from database
   query = """
       SELECT image_path, class_id, bbox_x, bbox_y, bbox_w, bbox_h
       FROM prediction_detection
       WHERE source = 'MANUALLY_ADDED'
         AND DATE(created_at) = CURDATE()
   """
   manual_data = fetch_from_db(query)
   
   # Combine with existing training data
   combined_dataset = merge_datasets(baseline_dataset, manual_data)
   
   # Fine-tune model
   model = YOLO(existing_weights)
   results = model.train(
       data=combined_dataset,
       epochs=60,
       batch=4,
       lr0=0.00001,  # Low learning rate for fine-tuning
       patience=50
   )
   
   # Save improved weights
   model.save('best_updated.pt')
   ```

4. **Model Update:**
   ```java
   private void updateModelWeights() {
       Path newWeights = Paths.get(retrainingOutputPath, "best.pt");
       Path currentWeights = Paths.get(weightsPath);
       
       // Backup old model
       Files.copy(currentWeights, 
                  Paths.get(weightsPath + ".backup"));
       
       // Install new model
       Files.copy(newWeights, currentWeights, 
                  StandardCopyOption.REPLACE_EXISTING);
       
       logger.info("Model updated with manual corrections");
   }
   ```

**Feedback Loop Benefits:**
- Model learns from human expertise
- Reduces false positives over time
- Adapts to site-specific thermal patterns
- Continuous improvement without manual retraining

### Q: What metadata is logged when users annotate images?

**Answer:**

**Annotation Metadata:**

1. **User Information:**
   ```java
   PredictionDetection {
       prediction.user_id → Who made the annotation
       prediction.created_at → When annotation was made
       prediction.session_type → "MANUAL_EDITING"
   }
   ```

2. **Detection Metadata:**
   ```java
   {
       detection_id: 123,
       prediction_id: 45,
       inspection_id: 10,
       log_entry_id: 1,
       
       // Annotation details
       class_id: 2,               // Anomaly type
       confidence: 1.0,           // Manual = 100%
       
       // Spatial data
       bbox_x: 150,
       bbox_y: 200,
       bbox_w: 80,
       bbox_h: 120,
       
       // Tracking
       source: "MANUALLY_ADDED",
       action_type: "ORIGINAL",
       created_at: "2025-10-26T14:30:00"
   }
   ```

3. **Change Tracking:**
   - Original AI detection preserved
   - Each edit creates new row
   - Full audit trail of modifications

4. **Exportable Log Format (JSON):**
   ```json
   {
       "inspection_id": 10,
       "image_url": "path/to/image.jpg",
       "ai_detections": [
           {
               "class": "loose_joint_red",
               "confidence": 0.87,
               "bounds": [150, 200, 80, 120],
               "source": "AI_DETECTED"
           }
       ],
       "manual_edits": [
           {
               "class": "loose_joint_red",
               "confidence": 1.0,
               "bounds": [155, 205, 75, 115],
               "source": "MANUALLY_ADDED",
               "action": "EDITED",
               "editor": "john.doe",
               "timestamp": "2025-10-26T14:30:00"
           }
       ]
   }
   ```

---

## PHASE 4: MAINTENANCE RECORD GENERATION

### Q: Describe the planned implementation for Phase 4 (Maintenance Record Generation)

**Answer:**

**Phase 4 Overview:**
Generate transformer-specific digital maintenance records based on thermal inspection results with AI annotations and manual engineer inputs.

**Required Features (FR4.1 - FR4.3):**

**1. FR4.1: Generate Maintenance Record Form**

**Planned Implementation:**
```typescript
// Frontend: MaintenanceRecordGenerator.tsx
interface MaintenanceRecord {
    recordId: number;
    transformerNo: string;
    inspectionId: number;
    inspectionTime: string;
    thermalImageUrl: string;
    annotatedImageUrl: string;  // With bounding boxes
    detectedAnomalies: DetectionSummary[];
    // Engineer input fields
    inspectorName: string;
    status: "OK" | "NEEDS_MAINTENANCE" | "URGENT";
    voltage?: number;
    current?: number;
    recommendedAction?: string;
    additionalRemarks?: string;
    createdAt: string;
    updatedAt: string;
}

const generateRecord = async (inspectionId: number) => {
    // Fetch inspection data
    const inspection = await api.get(`/inspections/${inspectionId}`);
    
    // Fetch latest prediction with detections
    const prediction = await api.get(`/predictions/latest/${inspectionId}`);
    
    // Pre-populate form
    const record = {
        transformerNo: inspection.transformerNo,
        inspectionTime: inspection.inspectionTime,
        thermalImageUrl: inspection.imageUrl,
        detectedAnomalies: prediction.detections.map(d => ({
            className: d.className,
            confidence: d.confidence,
            location: `(${d.bboxX}, ${d.bboxY})`,
            severity: d.className.includes('red') ? 'CRITICAL' : 'WARNING'
        }))
    };
    
    return record;
};
```

**Backend Endpoint:**
```java
// MaintenanceRecordController.java
@PostMapping("/maintenance-records")
public ResponseEntity<MaintenanceRecordDTO> createRecord(
    @RequestBody CreateRecordRequest request
) {
    // Fetch inspection + prediction data
    Inspection inspection = inspectionService.findById(request.getInspectionId());
    Prediction prediction = predictionService.getLatestForInspection(request.getInspectionId());
    
    // Create pre-filled record
    MaintenanceRecord record = new MaintenanceRecord();
    record.setInspection(inspection);
    record.setPrediction(prediction);
    record.setGeneratedAt(LocalDateTime.now());
    
    return ResponseEntity.ok(mapper.toDTO(record));
}
```

**2. FR4.2: Editable Engineer Input Fields**

**Form Structure:**
```tsx
// MaintenanceRecordForm.tsx
<Form>
    {/* System-Generated (Read-Only) */}
    <Section title="Transformer Information">
        <TextField label="Transformer No" value={record.transformerNo} disabled />
        <TextField label="Inspection Date" value={record.inspectionTime} disabled />
        <ImagePreview src={record.annotatedImageUrl} alt="Annotated Thermal" />
    </Section>
    
    <Section title="Detected Anomalies">
        <Table>
            {record.detectedAnomalies.map(anomaly => (
                <Row>
                    <Cell>{anomaly.className}</Cell>
                    <Cell>{anomaly.confidence.toFixed(2)}</Cell>
                    <Cell><Chip label={anomaly.severity} color={getSeverityColor(anomaly.severity)} /></Cell>
                </Row>
            ))}
        </Table>
    </Section>
    
    {/* Engineer Input (Editable) */}
    <Section title="Engineer Assessment">
        <TextField 
            label="Inspector Name" 
            value={inspectorName} 
            onChange={e => setInspectorName(e.target.value)}
            required
        />
        
        <Select label="Transformer Status" value={status} onChange={e => setStatus(e.target.value)}>
            <MenuItem value="OK">OK - No Action Required</MenuItem>
            <MenuItem value="NEEDS_MAINTENANCE">Needs Scheduled Maintenance</MenuItem>
            <MenuItem value="URGENT">Urgent Attention Required</MenuItem>
        </Select>
        
        <TextField 
            label="Voltage (V)" 
            type="number"
            value={voltage}
            onChange={e => setVoltage(e.target.value)}
        />
        
        <TextField 
            label="Current (A)" 
            type="number"
            value={current}
            onChange={e => setCurrent(e.target.value)}
        />
        
        <TextField 
            label="Recommended Action" 
            multiline
            rows={3}
            value={recommendedAction}
            onChange={e => setRecommendedAction(e.target.value)}
        />
        
        <TextField 
            label="Additional Remarks" 
            multiline
            rows={4}
            value={additionalRemarks}
            onChange={e => setAdditionalRemarks(e.target.value)}
        />
    </Section>
    
    <Button onClick={handleSave}>Save Maintenance Record</Button>
    <Button onClick={handleExportPDF}>Export as PDF</Button>
</Form>
```

**3. FR4.3: Save and Retrieve Completed Records**

**Database Schema:**
```sql
CREATE TABLE maintenance_record (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    transformer_no VARCHAR(50) NOT NULL,
    inspection_id INT NOT NULL,
    prediction_id INT,
    
    -- Engineer inputs
    inspector_name VARCHAR(100) NOT NULL,
    status ENUM('OK', 'NEEDS_MAINTENANCE', 'URGENT') NOT NULL,
    voltage DECIMAL(10,2),
    current_amperes DECIMAL(10,2),
    recommended_action TEXT,
    additional_remarks TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,  -- user_id
    
    FOREIGN KEY (transformer_no) REFERENCES transformer(transformer_no),
    FOREIGN KEY (inspection_id) REFERENCES inspection(inspection_id),
    FOREIGN KEY (prediction_id) REFERENCES prediction(prediction_id),
    FOREIGN KEY (created_by) REFERENCES user(user_id)
);

-- Index for fast retrieval
CREATE INDEX idx_transformer_records ON maintenance_record(transformer_no, created_at DESC);
```

**Save Implementation:**
```java
// MaintenanceRecordService.java
@Transactional
public MaintenanceRecord saveRecord(SaveRecordRequest request) {
    MaintenanceRecord record = new MaintenanceRecord();
    record.setTransformerNo(request.getTransformerNo());
    record.setInspectionId(request.getInspectionId());
    record.setPredictionId(request.getPredictionId());
    
    // Engineer inputs
    record.setInspectorName(request.getInspectorName());
    record.setStatus(request.getStatus());
    record.setVoltage(request.getVoltage());
    record.setCurrentAmperes(request.getCurrent());
    record.setRecommendedAction(request.getRecommendedAction());
    record.setAdditionalRemarks(request.getAdditionalRemarks());
    
    record.setCreatedBy(getCurrentUserId());
    
    return recordRepository.save(record);
}
```

**Retrieval - Record History Viewer:**
```typescript
// MaintenanceRecordHistory.tsx
const RecordHistory: React.FC<{ transformerNo: string }> = ({ transformerNo }) => {
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    
    useEffect(() => {
        api.get(`/maintenance-records/transformer/${transformerNo}`)
           .then(data => setRecords(data));
    }, [transformerNo]);
    
    return (
        <Timeline>
            {records.map(record => (
                <TimelineItem key={record.recordId}>
                    <TimelineDate>{record.createdAt}</TimelineDate>
                    <Card>
                        <CardHeader 
                            title={`Inspection ${record.inspectionId}`}
                            subheader={`Inspector: ${record.inspectorName}`}
                        />
                        <CardContent>
                            <Chip label={record.status} />
                            <Typography>Anomalies: {record.detectedAnomalies.length}</Typography>
                            <Button onClick={() => viewDetails(record.recordId)}>
                                View Full Record
                            </Button>
                            <Button onClick={() => downloadPDF(record.recordId)}>
                                Download PDF
                            </Button>
                        </CardContent>
                    </Card>
                </TimelineItem>
            ))}
        </Timeline>
    );
};
```

**PDF Export Feature:**
```java
// PDFExportService.java
public byte[] generatePDF(Integer recordId) {
    MaintenanceRecord record = recordRepository.findById(recordId)
        .orElseThrow(() -> new RecordNotFoundException(recordId));
    
    // Use iText or Apache PDFBox
    Document document = new Document();
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    PdfWriter.getInstance(document, baos);
    
    document.open();
    
    // Header
    document.add(new Paragraph("TRANSFORMER MAINTENANCE RECORD"));
    document.add(new Paragraph("Transformer No: " + record.getTransformerNo()));
    document.add(new Paragraph("Inspection Date: " + record.getInspectionTime()));
    
    // Thermal Image
    Image thermalImg = Image.getInstance(record.getAnnotatedImageUrl());
    thermalImg.scaleToFit(400, 300);
    document.add(thermalImg);
    
    // Anomalies Table
    PdfPTable table = new PdfPTable(3);
    table.addCell("Anomaly Type");
    table.addCell("Confidence");
    table.addCell("Severity");
    for (Detection d : record.getDetections()) {
        table.addCell(d.getClassName());
        table.addCell(String.format("%.2f", d.getConfidence()));
        table.addCell(d.getSeverity());
    }
    document.add(table);
    
    // Engineer Assessment
    document.add(new Paragraph("\nEngineer Assessment"));
    document.add(new Paragraph("Inspector: " + record.getInspectorName()));
    document.add(new Paragraph("Status: " + record.getStatus()));
    document.add(new Paragraph("Voltage: " + record.getVoltage() + " V"));
    document.add(new Paragraph("Current: " + record.getCurrentAmperes() + " A"));
    document.add(new Paragraph("Recommended Action: " + record.getRecommendedAction()));
    document.add(new Paragraph("Remarks: " + record.getAdditionalRemarks()));
    
    document.close();
    return baos.toByteArray();
}
```

**Why Phase 4 is Important:**
1. **Digitization:** Replaces manual handwritten forms
2. **Traceability:** Complete audit trail of all inspections
3. **Efficiency:** Pre-populated with AI detections
4. **Compliance:** Structured records for regulatory audits
5. **Analytics:** Historical data for trend analysis

**Implementation Challenges:**
1. PDF generation with proper formatting
2. Ensuring print-ready output quality
3. Handling large image files in PDFs
4. Version control for updated records
5. Role-based access control for editing

---

## DATA FLOW & INTEGRATION

### Q: Trace the complete flow from image upload to maintenance record generation

**Answer:**

**End-to-End Flow (All 4 Phases):**

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE SYSTEM FLOW (PHASES 1-4)                   │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: IMAGE UPLOAD & MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. USER UPLOADS THERMAL IMAGE
   ├─> Frontend: InspectionDetails.tsx
   ├─> Upload to Cloudinary
   ├─> POST /api/inspections {transformerNo, branch, inspector, inspectionTime}
   └─> POST /api/images {imageUrl, type: "maintenance", weatherCondition, inspectionId}
   
2. DATABASE RECORDS CREATED
   ├─> transformer table: Existing or new transformer record
   ├─> inspection table: New inspection entry
   └─> image table: Image metadata with Cloudinary URL
   
3. RESPONSE TO FRONTEND
   └─> inspectionId: 123, imageUrl: "https://cloudinary.../image.jpg"

═══════════════════════════════════════════════════════════════════

PHASE 2: AI-BASED ANOMALY DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. USER TRIGGERS ANALYSIS
   └─> Frontend: Click "Analyze Image" button
       POST /api/inference/analyze {imageUrl}

5. JAVA-PYTHON INTEGRATION
   ├─> InferenceController receives request
   ├─> PythonInferenceService.runInference()
   │   ├─> Download image from Cloudinary URL
   │   ├─> Save to: inference-uploads/{uuid}-image.jpg
   │   ├─> Build ProcessBuilder command:
   │   │   python seg_infer_and_label_5c.py 
   │   │   --weights best.pt 
   │   │   --source inference-uploads/{uuid}-image.jpg
   │   │   --conf 0.25 --iou 0.025 --stdout_json
   │   └─> Execute Python process
   
6. PYTHON YOLO INFERENCE
   ├─> Load YOLOv11n-seg model
   ├─> Run prediction on thermal image
   ├─> Detect anomalies (5 classes):
   │   - Point Overload (Faulty) - Red
   │   - Loose Joint (Faulty) - Red
   │   - Point Overload (Potential) - Yellow
   │   - Loose Joint (Potential) - Yellow
   │   - Full Wire Overload - Yellow
   ├─> Generate annotated image with overlays
   └─> Output JSON to stdout:
       {
           "image": "path/to/image.jpg",
           "pred_image_label": "FAULTY",
           "timestamp": "2025-10-26T15:30:00",
           "detections": [
               {
                   "class_id": 1,
                   "class_name": "loose_joint_red",
                   "confidence": 0.87,
                   "polygon_xy": [[x,y], [x,y], ...]
               }
           ]
       }

7. JAVA PROCESSES RESULTS
   ├─> Parse JSON output from stdout
   ├─> Convert to DTOs (PredictionDTO, DetectionDTO)
   ├─> Calculate bounding boxes from polygons
   └─> Return to controller

8. DATABASE PERSISTENCE
   ├─> Create Prediction entity
   │   ├─> sessionType = "AI_ANALYSIS"
   │   ├─> predictedLabel = "FAULTY"
   │   ├─> modelTimestamp = "2025-10-26T15:30:00"
   │   └─> issueCount = 3
   │
   └─> For each detection:
       Create PredictionDetection entity
       ├─> classId = 1
       ├─> confidence = 0.87
       ├─> bboxX, bboxY, bboxW, bboxH
       ├─> source = "AI_DETECTED"
       └─> actionType = "ORIGINAL"

9. FRONTEND DISPLAY
   ├─> ThermalImageAnalysis.tsx renders results
   ├─> Show thermal image with bounding boxes
   ├─> Color-code by severity (red/orange)
   ├─> List detected anomalies with details
   └─> Enable zoom/pan controls

═══════════════════════════════════════════════════════════════════

PHASE 3: INTERACTIVE ANNOTATION & FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. ENGINEER REVIEWS DETECTIONS
    └─> DrawingCanvas.tsx provides annotation tools

11. USER MODIFIES ANNOTATIONS
    ├─> Option A: Edit existing detection
    │   └─> Drag/resize bounding box
    │       POST /api/detections/{detectionId} {x1, y1, x2, y2, classId}
    │
    ├─> Option B: Delete false positive
    │   └─> Click delete button
    │       DELETE /api/detections/{detectionId}
    │
    └─> Option C: Add new annotation
        └─> Draw new bounding box
            POST /api/detections {predictionId, classId, x1, y1, x2, y2, confidence: 1.0}

12. DATABASE UPDATE
    ├─> Create new Prediction entry
    │   └─> sessionType = "MANUAL_EDITING"
    │
    └─> Create PredictionDetection entry
        ├─> source = "MANUALLY_ADDED"
        └─> actionType = "EDITED" | "DELETED" | "ORIGINAL"

13. FEEDBACK LOOP (Automated Daily)
    ├─> ModelTrainingService @Scheduled(cron = "0 0 1 * * *")
    ├─> Query manual edits: WHERE source = 'MANUALLY_ADDED' AND DATE(created_at) = YESTERDAY
    ├─> Execute finetune.py with:
    │   ├─> Fetch manually edited data from database
    │   ├─> Split into train/valid/test (70/20/10)
    │   ├─> Convert to YOLO format
    │   ├─> Fine-tune model with low learning rate
    │   └─> Save improved weights
    └─> Update model for next inference

═══════════════════════════════════════════════════════════════════

PHASE 4: MAINTENANCE RECORD GENERATION (PLANNED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. GENERATE MAINTENANCE RECORD
    ├─> POST /api/maintenance-records {inspectionId}
    ├─> Fetch inspection, prediction, detections
    └─> Pre-populate form:
        ├─> Transformer metadata
        ├─> Thermal image (annotated)
        ├─> AI-detected anomalies
        └─> Editable fields (inspector, status, readings)

15. ENGINEER FILLS FORM
    ├─> Add inspector name
    ├─> Select status: OK / NEEDS_MAINTENANCE / URGENT
    ├─> Input electrical readings (voltage, current)
    ├─> Recommended action
    └─> Additional remarks

16. SAVE COMPLETED RECORD
    ├─> POST /api/maintenance-records/save
    └─> Database: maintenance_record table
        ├─> record_id, transformer_no, inspection_id
        ├─> inspector_name, status, voltage, current
        └─> recommended_action, additional_remarks

17. EXPORT & RETRIEVE
    ├─> GET /api/maintenance-records/transformer/{transformerNo}
    │   └─> Returns history of all records
    │
    └─> GET /api/maintenance-records/{recordId}/pdf
        └─> Generate PDF report with:
            ├─> Transformer details
            ├─> Annotated thermal image
            ├─> Anomaly table
            └─> Engineer assessment
```

**Database State Evolution:**

```
After Phase 1 (Upload):
├─ transformer: 1 row
├─ inspection: 1 row
└─ image: 1 row

After Phase 2 (AI Analysis):
├─ prediction: 1 row (AI_ANALYSIS)
└─ prediction_detection: N rows (AI detections)

After Phase 3 (Manual Edit):
├─ prediction: 2 rows (AI_ANALYSIS + MANUAL_EDITING)
└─ prediction_detection: N + M rows (original + edits)

After Phase 4 (Record Generation):
└─ maintenance_record: 1 row (completed form)
```

**Data Flow Summary:**
```
Image Upload → AI Analysis → Manual Validation → Record Generation
     ↓              ↓               ↓                   ↓
  Database     AI Detections   User Edits         Final Report
                    ↓               ↓
                    └───> Feedback Loop (Model Retraining)
```
   ↓
   Fine-tune YOLO model
   ↓
   Update model weights
   ↓
   Next analysis uses improved model
```

**Database State Evolution:**

```
After Step 1 (Upload):
- transformer: 1 row
- inspection: 1 row
- image: 1 row

After Step 2 (AI Analysis):
- prediction: 1 row (AI_ANALYSIS)
- prediction_detection: N rows (detected anomalies)

After Step 4 (Manual Edit):
- prediction: 2 rows (AI_ANALYSIS + MANUAL_EDITING)
- prediction_detection: N + M rows (original + edits)
```

---

## TECHNOLOGY STACK

### Q: What technologies and frameworks did you use?

**Answer:**

**Frontend (React SPA):**
```json
{
  "Framework": "React 19.1.0",
  "Language": "TypeScript 5.8.3",
  "UI Library": "Material-UI (MUI) 7.3.1",
  "Routing": "React Router DOM 7.8.1",
  "Date Handling": "dayjs 1.11.14, date-fns 4.1.0",
  "Build Tool": "Vite 7.0.4",
  "HTTP Client": "Fetch API (native), Axios 1.11.0",
  "State Management": "React Hooks (useState, useEffect, useCallback)"
}
```

**Backend (Spring Boot API):**
```
Framework: Spring Boot 3.x
Language: Java 17
Database: MySQL 8.x
ORM: Spring Data JPA / Hibernate
Security: Spring Security with JWT
Build Tool: Maven
```

**AI/ML:**
```
Model: YOLOv11n-seg (Ultralytics)
Framework: PyTorch 2.8.0
Language: Python 3.9
Integration: ProcessBuilder (Java → Python)
Database Access: mysql-connector-python
```

**External Services:**
```
Image Storage: Cloudinary (CDN + Cloud Storage)
Authentication: JWT tokens
```

**Development Tools:**
```
Version Control: Git
Code Formatting: ESLint (frontend)
Type Checking: TypeScript
API Testing: Postman (implied)
```

---

## KNOWN LIMITATIONS & FUTURE IMPROVEMENTS

### Known Bugs/Limitations:

1. **Model Retraining:**
   - Currently CPU-only (slow)
   - Could benefit from GPU acceleration
   - Progress bar UTF-8 encoding issues in logs

2. **Annotation Versioning:**
   - No UI to switch between annotation versions
   - Can only view latest state via API

3. **Baseline Comparison:**
   - AI doesn't directly compare baseline vs maintenance
   - Visual side-by-side comparison only

4. **Concurrent Editing:**
   - No real-time collaboration
   - Last-save-wins conflict resolution

5. **Hardcoded Configuration:**
   - API base URL hardcoded in frontend services
   - Cloudinary credentials in component file
   - Should use environment variables

6. **Error Handling:**
   - Generic error messages in some places
   - Could improve user feedback

### Future Improvements:

1. **Real-time Collaboration:** WebSocket for multi-user editing
2. **GPU Support:** Faster inference and training with CUDA
3. **Differential Analysis:** True pixel-level baseline vs maintenance comparison
4. **Export Formats:** PDF reports, Excel summaries
5. **Mobile App:** Field engineer mobile interface (React Native)
6. **Notification System:** Email/SMS alerts on critical anomalies
7. **Analytics Dashboard:** Trends, statistics, predictive maintenance
8. **Offline Mode:** PWA for field work without internet
9. **Audit Logging:** Complete user action tracking
10. **Role-based Access:** Admin, Engineer, Viewer roles

---

*This document covers all major aspects of the transformer maintenance system for exam preparation.*
