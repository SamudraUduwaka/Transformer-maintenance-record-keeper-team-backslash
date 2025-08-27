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

Configure datasource and (dev) JPA settings (If haven't added yet):

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
