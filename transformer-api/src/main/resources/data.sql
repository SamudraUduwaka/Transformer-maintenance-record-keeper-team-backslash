-- ===== Transformers (5) - idempotent =====
INSERT IGNORE INTO transformer
  (transformer_no, pole_no, region, type, location, favorite, created_at, updated_at)
VALUES
('AZ-8801','EN-122-A','Nugegoda','Bulk','Near Keells, Embuldeniya', 0, NOW(), NOW()),
('AZ-8802','EN-122-B','Maharagama','Distribution','High St, Maharagama', 0, NOW(), NOW()),
('AZ-8803','EN-122-C','Kotte','Bulk','Market Rd, Kotte', 0, NOW(), NOW()),
('AZ-8804','EN-122-D','Dehiwala','Distribution','Station Rd, Dehiwala', 0, NOW(), NOW()),
('AZ-8805','EN-122-E','Nugegoda','Bulk','Pagoda Rd, Nugegoda', 0, NOW(), NOW());

-- ===== Baseline + extra inspections (fixed IDs; idempotent) =====
INSERT IGNORE INTO inspection
  (inspection_id, transformer_no, inspection_time, branch, inspector, created_at, updated_at)
VALUES
(1,'AZ-8801','2024-01-15 09:30:00','Nugegoda','System', NOW(), NOW()),
(2,'AZ-8802','2024-01-15 10:00:00','Maharagama','System', NOW(), NOW()),
(3,'AZ-8803','2024-01-15 10:30:00','Kotte','System', NOW(), NOW()),
(4,'AZ-8804','2024-01-15 11:00:00','Dehiwala','System', NOW(), NOW()),
(5,'AZ-8805','2024-01-15 11:30:00','Nugegoda','System', NOW(), NOW()),
(6,'AZ-8801','2024-01-20 09:30:00','Nugegoda','System', NOW(), NOW()),
(7,'AZ-8802','2024-01-20 10:00:00','Maharagama','System', NOW(), NOW()),
(8,'AZ-8803','2024-01-20 10:30:00','Kotte','System', NOW(), NOW()),
(9,'AZ-8804','2024-01-20 11:00:00','Dehiwala','System', NOW(), NOW()),
(10,'AZ-8805','2024-01-20 11:30:00','Nugegoda','System', NOW(), NOW()),
(11,'AZ-8801','2024-01-25 09:30:00','Nugegoda','System', NOW(), NOW()),
(12,'AZ-8802','2024-01-25 10:00:00','Maharagama','System', NOW(), NOW()),
(13,'AZ-8803','2024-01-25 10:30:00','Kotte','System', NOW(), NOW()),
(14,'AZ-8804','2024-01-25 11:00:00','Dehiwala','System', NOW(), NOW()),
(15,'AZ-8805','2024-01-25 11:30:00','Nugegoda','System', NOW(), NOW());

-- ===== Images (one per inspection; omit image_id so AUTO_INCREMENT is used) =====
INSERT IGNORE INTO image
  (inspection_id, transformer_no, image_url, type, weather_condition, created_at, updated_at)
VALUES
(1,'AZ-8801','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301699/p9094_ahmqc3.bmp','baseline','Sunny', NOW(), NOW()),
(6,'AZ-8801','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301659/p6001_udjhob.bmp','baseline','Cloudy', NOW(), NOW()),
(11,'AZ-8801','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301580/p3027_nzgwvf.bmp','baseline','Rainy', NOW(), NOW()),

(2,'AZ-8802','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301689/p8053_nglld9.bmp','baseline','Sunny', NOW(), NOW()),
(7,'AZ-8802','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301645/p5027_ndtpdt.bmp','baseline','Cloudy', NOW(), NOW()),
(12,'AZ-8802','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301516/p1001_hke7at.bmp','baseline','Rainy', NOW(), NOW()),

(3,'AZ-8803','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301672/p7026_knf0ft.bmp','baseline','Sunny', NOW(), NOW()),
(8,'AZ-8803','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756301627/p4001_cioj3g.bmp','baseline','Cloudy', NOW(), NOW()),
(13,'AZ-8803','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302533/p2001_udsaya.bmp','baseline','Rainy', NOW(), NOW()),

(4,'AZ-8804','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302684/p9085_u3duca.bmp','baseline','Sunny', NOW(), NOW()),
(9,'AZ-8804','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302601/p6001_bgexf3.bmp','baseline','Cloudy', NOW(), NOW()),
(14,'AZ-8804','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302569/p4001_bos6as.bmp','baseline','Rainy', NOW(), NOW()),

(5,'AZ-8805','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302619/p8053_qm2iwj.bmp','baseline','Sunny', NOW(), NOW()),
(10,'AZ-8805','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302579/p5027_amdy3m.bmp','baseline','Cloudy', NOW(), NOW()),
(15,'AZ-8805','https://res.cloudinary.com/ddleqtgrj/image/upload/v1756302544/p3027_e8kga1.bmp','baseline','Rainy', NOW(), NOW());
