# Transformer Maintenance Record Keeper – Team-Backslash

Modular system to manage transformer image data, detect thermal anomalies, and keep maintenance records.

## Modules
- `transformer-dashboard/`: React frontend
- `transformer-api/`: Java Spring Boot backend
- `anomaly-detector/`: Python Flask + OpenCV service

## Setup Instructions

### Prerequisites
- **Git**
- **Node.js (LTS)** + **npm** — for `transformer-dashboard`
- **Java 21+** + **Maven Wrapper** — for `transformer-api`
- **MySQL 8+**
- **Cloudinary** account — for image uploads

---

### 1) Clone the repo
```bash
git clone https://github.com/SamudraUduwaka/Transformer-maintenance-record-keeper-team-backslash.git
cd Transformer-maintenance-record-keeper-team-backslash
```

### 2) Create the database (MySQL)

Use your favorite client or the MySQL shell:
```sql
CREATE DATABASE transformer_db CHARACTER SET utf8mb4;
```

### 3) Backend (transformer-api)

#### i) Configure datasource and (dev) JPA settings (If haven't added yet):

In `transformer-api/src/main/resources/application.properties`

```yaml
spring.application.name=transformer-api

# --- MySQL ---
spring.datasource.url=jdbc:mysql://localhost:3306/transformer_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username= `YOUR_DB_USERNAME`
spring.datasource.password= `YOUR_DB_PASSWORD`
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# --- JPA/Hibernate (dev) ---
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# --- Make schema.sql and data.sql run ---
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true

server.port=8080
```

#### ii) Run the API:

Navigate to `transformer-api`
```cmd
cd transformer-api
```

Run the backend

- `Linux/macOS:`
```cmd
./mvnw spring-boot:run
```
- `Windows (PowerShell/CMD):`
```cmd
mvnw.cmd spring-boot:run
```

By default the API runs on `http://localhost:8080`


## Cloudinary Account & Access (As Cloudinary is used in this project for image management)

You **do not need a Cloudinary account to *view* the seeded demo images**.  
All image URLs stored in our seed file are **public CDN links** and will load as long as you have internet access.

You **do need a Cloudinary account** if you want to **upload new images from the dashboard** or **seed your own dataset**.

### Create a Cloudinary account (for uploads)
1. Go to https://cloudinary.com/ and sign up (free tier is enough).
2. In the **Cloudinary Console** copy your **Cloud name** (e.g., `abc123`).
3. Create an **unsigned upload preset**  
   - *Settings* → *Upload* → *Upload presets* → **Add upload preset**  
   - Set **Unsigned** = `true` and save the **Preset name** (e.g., `dev_unsigned`).
4. In `transformer-dashboard/.env`, add:
   ```bash
   VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
   VITE_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_preset>
   VITE_API_BASE_URL=http://localhost:8080
5. Restart the frontend (npm run dev). New images you upload will go to your Cloudinary and the backend will store the returned URLs.


### 4) Seed Data (data.sql) & Image URLs

We ship demo data in `transformer-api/src/main/resources/data.sql.`

This file inserts:
- Sample transformers and inspections
- Image URLs hosted on Cloudinary under our team cloud (read-only public links), e.g. `https://res.cloudinary.com/ddleqtgrj/image/upload/...`
