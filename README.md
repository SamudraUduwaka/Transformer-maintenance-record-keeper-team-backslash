# Transformer Maintenance Record Keeper – Team-Backslash

A comprehensive modular system to manage transformer image data, detect thermal anomalies using AI-powered computer vision, and maintain detailed inspection records with thermal analysis capabilities.

## System Architecture

### Modules
- **`transformer-dashboard/`**: React TypeScript frontend with Material-UI components
- **`transformer-api/`**: Java Spring Boot backend with REST APIs and ML integration
- **`anomaly-detector/`**: Python-based AI detection service using YOLOv11 segmentation

### Key Features
- **AI-Powered Thermal Analysis**: Automated detection of transformer faults using computer vision
- **Comprehensive Dashboard**: Real-time inspection management with detailed analytics
- **Weather Integration**: Weather condition tracking for inspection correlation
- **Responsive UI**: Modern, mobile-friendly interface with Material-UI
- **Real-time Processing**: Live thermal image analysis and fault detection
- **Maintenance Records**: Complete inspection history and trend analysis

## Setup Instructions

### Prerequisites
- **Git**
- **Node.js (LTS 18+)** + **npm** — for `transformer-dashboard`
- **Java 21+** + **Maven** — for `transformer-api`
- **MySQL 8+** — for data persistence
- **Python 3.8+** — for AI detection service
- **Cloudinary** account — for image uploads and storage

---

### 1) Clone the Repository
```bash
git clone https://github.com/SamudraUduwaka/Transformer-maintenance-record-keeper-team-backslash.git
cd Transformer-maintenance-record-keeper-team-backslash
```

### 2) Python Environment Setup for AI Detection

#### Install Required Python Packages
Run the following commands to install the required Python packages:
```bash
cd anomaly-detector
pip install -r requirements.txt
```

#### Verify Installation
```bash
python -c "from ultralytics import YOLO; print('YOLOv11 installed successfully')"
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
```

### 3) Create the Database (MySQL)

Use your favorite MySQL client or the MySQL shell:
```sql
CREATE DATABASE transformer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4) Backend Configuration (transformer-api)

#### Application Properties Configuration

In `transformer-api/src/main/resources/application.properties`, update these key values:

**Required Changes:**
```properties
# Update with your MySQL credentials
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

# Update these paths to match your project location (use absolute paths)
inference.script.path=C:/your/path/to/anomaly-detector/Fault Detection v11-2/seg_infer_and_label_5c.py
inference.weights.path=C:/your/path/to/anomaly-detector/Fault Detection v11/runs_yolo/tx_seg_5c_v11_cpu2/weights/best.pt
inference.temp.dir=C:/your/path/to/anomaly-detector/inference-uploads
```

**Optional Changes:**
```properties
# If using virtual environment, update python path
inference.python=C:/path/to/your/venv/Scripts/python.exe

# If using different timezone, update these
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/transformer_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=YOUR_TIMEZONE
spring.jpa.properties.hibernate.jdbc.time_zone=YOUR_TIMEZONE
spring.datasource.hikari.connectionInitSql=SET time_zone = 'YOUR_OFFSET'
```

**Note:** All other properties have sensible defaults and don't need modification for local development.

#### Run the Backend API

Navigate to the `transformer-api` directory:
```bash
cd transformer-api
```

**Option 1: Using Maven Wrapper (Recommended)**
```bash
# Linux/macOS
./mvnw spring-boot:run

# Windows (PowerShell/CMD)
./mvnw.cmd spring-boot:run
```

**Option 2: Using System Maven**
```bash
mvn spring-boot:run
```

The API will start on `http://localhost:8080`

#### API Endpoints Overview
- **Transformers**: `GET/POST/PUT/DELETE /api/transformers`
- **Inspections**: `GET/POST/PUT/DELETE /api/inspections`
- **Images**: `GET/POST /api/images`
- **AI Inference**: `POST /api/inference/predict`

### 5) Cloudinary Configuration (Image Management)

#### For Viewing Demo Data
You **do not need a Cloudinary account** to view the seeded demo images. All image URLs in the seed data are **public CDN links** and will load with internet access.

#### For Image Uploads (Required)
1. **Create Account**: Go to https://cloudinary.com/ and sign up (free tier sufficient)
2. **Get Credentials**: In Cloudinary Console, copy your **Cloud name**
3. **Create Upload Preset**: 
   - Go to *Settings* → *Upload* → *Upload presets* → **Add upload preset**
   - Set **Unsigned** = `true` and save the **Preset name**

#### Frontend Environment Configuration
Create `transformer-dashboard/.env`:
```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
VITE_API_BASE_URL=http://localhost:8080
```

### 6) Frontend Setup (transformer-dashboard)

Navigate to frontend directory and install dependencies:
```bash
cd transformer-dashboard
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the URL shown in terminal)

### 7) Database Seeding

The application includes comprehensive seed data in `transformer-api/src/main/resources/data.sql`:

- **Sample transformers** with location and specification data
- **Inspection records** with timestamps and weather conditions  
- **Image URLs** hosted on Cloudinary (public access)
- **Detection results** from AI analysis

The seed data automatically loads when the application starts (controlled by `spring.sql.init.mode=always`).



## AI-Powered Thermal Anomaly Detection

### Detection System Overview

The system uses **YOLOv11 instance segmentation** to detect and classify thermal anomalies in transformer images. The AI model can identify 5 distinct classes of thermal conditions.

### Detection Classes

| Class ID | Class Name | Category | Description |
|----------|------------|----------|-------------|
| 0 | `full_wire_yellow` | Potential | Full wire overload showing yellow thermal signature |
| 1 | `loose_joint_red` | **Faulty** | Loose joint with red thermal signature (critical) |
| 2 | `loose_joint_yellow` | Potential | Loose joint with yellow thermal signature |
| 3 | `point_overload_red` | **Faulty** | Point overload with red thermal signature (critical) |
| 4 | `point_overload_yellow` | Potential | Point overload with yellow thermal signature |

### Classification Logic

The system applies intelligent classification logic to determine overall image status:

```python
# Status determination logic
def determine_image_status(detected_classes):
    FAULTY = {1, 3}       # loose_joint_red, point_overload_red
    POTENTIAL = {0, 2, 4} # full_wire_yellow, loose_joint_yellow, point_overload_yellow
    
    if any(class_id in FAULTY for class_id in detected_classes):
        return "Faulty"
    elif any(class_id in POTENTIAL for class_id in detected_classes):
        return "Potentially Faulty"
    else:
        return "Normal"
```

### Detection Features

- **Precise Segmentation**: Pixel-level detection with polygon boundary mapping
- **Multi-class Detection**: Simultaneous detection of multiple thermal anomaly types
- **Confidence Scoring**: Each detection includes confidence percentage
- **Visual Overlays**: Color-coded boundary visualization for easy interpretation
- **Detailed Reporting**: Comprehensive JSON output with detection metadata

### AI Model Specifications

- **Architecture**: YOLOv11n-seg (nano segmentation model)
- **Input Size**: 640x640 pixels
- **Training Dataset**: 5-class transformer thermal image dataset
- **Detection Threshold**: 0.25 (configurable)
- **IoU Threshold**: 0.025 (configurable)
- **Output Format**: JSON with polygon coordinates and bounding boxes

### API Integration

#### Inference Endpoint
```bash
POST /api/inference/predict
Content-Type: multipart/form-data

# Upload thermal image for analysis
curl -X POST -F "file=@thermal_image.jpg" http://localhost:8080/api/inference/predict
```

#### Response Format
```json
{
  "image": "image_filename.jpg",
  "predImageLabel": "Faulty",
  "detections": [
    {
      "classId": 1,
      "className": "loose_joint_red",
      "reason": "Loose Joint (Faulty)",
      "confidence": 0.89,
      "polygonXy": [[x1,y1], [x2,y2], ...],
      "boundingBox": {
        "x": 100, "y": 150,
        "width": 200, "height": 180
      }
    }
  ],
  "timestamp": "2024-10-05T10:30:00Z",
  "rawJson": "..."
}
```

### Integration Flow

1. **Image Upload**: User uploads thermal image via dashboard
2. **Preprocessing**: Image is prepared and sent to Python inference service
3. **AI Analysis**: YOLOv11 model processes image and detects anomalies
4. **Result Processing**: Detections are classified and formatted
5. **Database Storage**: Results are persisted with inspection record
6. **Visualization**: Dashboard displays results with color-coded overlays

### Performance Considerations

- **Processing Time**: ~2-5 seconds per image (depending on hardware)
- **File Support**: JPG, PNG formats recommended
- **Image Size**: Optimal at 640x640, automatically resized if needed
- **Concurrent Processing**: Single-threaded inference (can be scaled)

## Implemented Features

### Frontend Features (transformer-dashboard)

#### Core Functionality
- **Transformer Management**: Complete CRUD operations for transformer records
- **Inspection System**: Detailed inspection management with image upload
- **Image Gallery**: Cloudinary-integrated image storage and display
- **Weather Integration**: Weather condition tracking and display
- **Responsive Design**: Mobile-friendly Material-UI interface

#### Advanced UI Components
- **Thermal Analysis View**: Interactive thermal image analysis with AI detection results
- **Tooltip System**: Comprehensive help tooltips for all interactive elements
- **Status Indicators**: Visual status indicators for equipment condition
- **Data Visualization**: Charts and graphs for trend analysis
- **Real-time Updates**: Live status updates and notifications

### Backend Features (transformer-api)

#### REST API Services
- **RESTful Endpoints**: Complete API coverage for all entities
- **CORS Configuration**: Configured for local development environment
- **Real-time Processing**: Live AI inference integration
- **Data Persistence**: MySQL with JPA/Hibernate ORM

#### AI Integration
- **Python Service Bridge**: Seamless integration with Python AI services
- **Result Processing**: Intelligent processing and storage of AI results
- **Detection Management**: Database persistence of detection results
- **Analytics**: Comprehensive analytics and reporting capabilities

#### Data Management
- **Entity Relationships**: Well-designed entity relationships with DTOs
- **Mapping Services**: MapStruct-based entity-DTO mapping
- **Validation**: Comprehensive input validation and error handling
- **Performance**: Optimized queries and caching strategies


### Anomaly Detection Service (anomaly-detector)

#### AI Model Architecture
- **YOLOv11 Segmentation**: State-of-the-art instance segmentation for precise anomaly detection
- **Real-time Processing**: Optimized for fast inference on thermal images
- **Multi-class Detection**: Simultaneous detection of 5 distinct thermal anomaly types
- **Confidence Analysis**: Statistical confidence scoring for each detection

#### Technical Implementation
- **Python Integration**: Seamless integration with Java backend via subprocess execution
- **Artifact Management**: Configurable retention of processing artifacts
- **Flexible Configuration**: Adjustable confidence and IoU thresholds
- **Batch Processing**: Support for batch image processing capabilities

## Getting Started

### Quick Start Guide

1. **Clone and Setup Database**
   ```bash
   git clone [repository-url]
   mysql -u root -p -e "CREATE DATABASE transformer_db CHARACTER SET utf8mb4;"
   ```

2. **Install Python Dependencies**
   ```bash
   pip install ultralytics opencv-python numpy torch torchvision
   ```

3. **Configure Backend**
   - Update `application.properties` with your database credentials
   - Set correct paths for AI model files
   - Configure Cloudinary credentials (for uploads)

4. **Start Services**
   ```bash
   # Backend
   cd transformer-api && ./mvnw spring-boot:run
   
   # Frontend (new terminal)
   cd transformer-dashboard && npm install && npm run dev
   ```

5. **Access Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8080`
   - API Documentation: `http://localhost:8080/swagger-ui.html` (if enabled)

## Technical Stack

### Frontend Technology
- **React 18** with TypeScript for type safety
- **Material-UI (MUI)** for component library
- **Vite** for fast development and building
- **Axios** for API communication
- **React Router** for navigation

### Backend Technology
- **Java 21** with Spring Boot 3.x
- **Spring Data JPA** with Hibernate ORM
- **MySQL 8+** for data persistence
- **MapStruct** for entity-DTO mapping
- **Maven** for dependency management

### AI/ML Technology
- **Python 3.8+** runtime environment
- **YOLOv11** (Ultralytics) for object detection
- **OpenCV** for image processing
- **PyTorch** as deep learning framework
- **NumPy** for numerical computations

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Java version
java -version  # Should be 21+

# Verify MySQL connection
mysql -u root -p -e "SELECT 1;"

# Check application.properties paths
# Ensure all inference.* paths are absolute and exist
```

#### Python Inference Errors
```bash
# Verify Python packages
python -c "from ultralytics import YOLO; print('Success')"

# Check model file exists
ls -la "anomaly-detector/Fault Detection v11/runs_yolo/tx_seg_5c_v11_cpu2/weights/best.pt"

# Test script directly
cd "anomaly-detector/Fault Detection v11-2"
python seg_infer_and_label_5c.py --help
```

#### Frontend Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat .env  # Verify VITE_* variables are set
```

## API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transformers` | List all transformers |
| POST | `/api/transformers` | Create new transformer |
| GET | `/api/transformers/{id}` | Get transformer details |
| PUT | `/api/transformers/{id}` | Update transformer |
| DELETE | `/api/transformers/{id}` | Delete transformer |
| GET | `/api/inspections` | List all inspections |
| POST | `/api/inspections` | Create new inspection |
| GET | `/api/inspections/{id}` | Get inspection details |
| POST | `/api/inference/predict` | Run AI thermal analysis |

### Authentication
Currently, the API is **open for development**. Authentication and authorization will be implemented in future releases.

## Known Limitations & Future Enhancements

### Current Limitations

- **No Authentication**: All API endpoints are publicly accessible
- **CORS Configuration**: Currently configured for local development only
- **Single-threaded AI**: Inference processing is not parallelized
- **Limited Analytics**: Basic reporting functionality
- **No Real-time Updates**: No WebSocket or SSE implementation

### Planned Enhancements

- **User Authentication**: JWT-based authentication system
- **Role-based Access**: Different permission levels for users
- **Advanced Analytics**: Comprehensive reporting and trend analysis
- **Real-time Features**: Live updates and notifications
- **Mobile App**: Native mobile application
- **Cloud Deployment**: Production-ready cloud deployment guides
- **Performance Optimization**: Caching and optimization strategies

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **Java**: Follow Spring Boot best practices and Google Java Style Guide
- **TypeScript**: Use ESLint and Prettier for code formatting
- **Python**: Follow PEP 8 style guide
- **Database**: Use meaningful column names and proper indexing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- **Documentation**: Check this README and inline code documentation
- **Issues**: Open GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for general questions

---

**Team Backslash** - Transformer Maintenance Record Keeper
*Empowering predictive maintenance through AI-powered thermal analysis*
