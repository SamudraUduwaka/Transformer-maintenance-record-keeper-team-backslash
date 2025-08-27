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


### 5) Frontend (transformer-dashboard)

Install deps and start the dev server:
```cmd
cd ../transformer-dashboard
npm install
npm run dev
```

- Open the URL shown in the terminal (Vite default is `http://localhost:5173`).



## List of Implemented Features (Stage-1)

### Frontend — `transformer-dashboard`
- Transformer & inspection **list/detail** views with forms to add new records with edit and delete features also implemented.
- **Image upload** to **Cloudinary** using an **unsigned preset**; secure URL returned from Cloudinary is sent to the backend.
- Displays stored image URLs in inspection views.

### Backend — `transformer-api`
- **REST APIs** for transformers, inspections (create, fetch, patch and delete). And for images create and fetch.
- **MySQL persistence** using JPA/Hibernate; schema auto-creation enabled for dev (`ddl-auto=update`).
- **Cloudinary URL storage**: image metadata (URL, type, weather) linked to inspection & transformer.
- **DTOs / service layer / repository** pattern (controllers → services → repositories).
- **CORS** configured for local development so the Vite app can call the API.
- **Database seeding** via `src/main/resources/data.sql` (transformers, inspections, and Cloudinary image URLs).

### Data & Assets
- Ready-to-run **seed dataset** with sample transformers, inspections, and **public** Cloudinary image URLs.
- Anyone can run the app and **view images without a Cloudinary account** (uploads require your own Cloudinary and Refer `Cloudinary Account & Access` section for more details).


## Known Limitations / Issues (Stage-1)

- **No authentication/authorization yet**  
  All API endpoints are open in dev; any client can create/read records. Auth & roles will be added in later stages.

- **CORS configuration may require adjustments**  
  Local dev assumes dashboard on `http://localhost:5173`. If you run on another port/origin, you may hit CORS errors until the backend config is updated.

- **Anomaly detector not wired yet**  
  `anomaly-detector/` exists as a placeholder; no API/UI integration in Stage-1.
