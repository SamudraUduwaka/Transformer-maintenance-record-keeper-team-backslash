-- ===== Detection Classes (idempotent) =====
INSERT IGNORE INTO classes (class_id, class_name, reason) VALUES
(0, 'loose_joint_red', 'Loose joint overheating (reddish core).'),
(1, 'loose_joint_yellow', 'Loose joint warming (yellow core).'),
(2, 'point_overload_red', 'Localized critical hot spot.'),
(3, 'point_overload_yellow', 'Localized warm spot.'),
(4, 'full_wire_yellow', 'Entire wire overheated.');

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
  (inspection_id, transformer_no, inspection_time, branch, inspector, created_at, updated_at, favorite)
VALUES
(1,'AZ-8801','2024-01-15 09:30:00','Nugegoda','System', NOW(), NOW(), 0),
(2,'AZ-8802','2024-01-15 10:00:00','Maharagama','System', NOW(), NOW(), 0),
(3,'AZ-8803','2024-01-15 10:30:00','Kotte','System', NOW(), NOW(), 0),
(4,'AZ-8804','2024-01-15 11:00:00','Dehiwala','System', NOW(), NOW(), 0),
(5,'AZ-8805','2024-01-15 11:30:00','Nugegoda','System', NOW(), NOW(), 0),
(6,'AZ-8801','2024-01-20 09:30:00','Nugegoda','System', NOW(), NOW(), 0),
(7,'AZ-8802','2024-01-20 10:00:00','Maharagama','System', NOW(), NOW(), 0),
(8,'AZ-8803','2024-01-20 10:30:00','Kotte','System', NOW(), NOW(), 0),
(9,'AZ-8804','2024-01-20 11:00:00','Dehiwala','System', NOW(), NOW(), 0),
(10,'AZ-8805','2024-01-20 11:30:00','Nugegoda','System', NOW(), NOW(), 0),
(11,'AZ-8801','2024-01-25 09:30:00','Nugegoda','System', NOW(), NOW(), 0),
(12,'AZ-8802','2024-01-25 10:00:00','Maharagama','System', NOW(), NOW(), 0),
(13,'AZ-8803','2024-01-25 10:30:00','Kotte','System', NOW(), NOW(), 0),
(14,'AZ-8804','2024-01-25 11:00:00','Dehiwala','System', NOW(), NOW(), 0),
(15,'AZ-8805','2024-01-25 11:30:00','Nugegoda','System', NOW(), NOW(), 0);

-- ===== Images (one per inspection; omit image_id so AUTO_INCREMENT is used) =====
INSERT IGNORE INTO image
  (inspection_id, transformer_no, image_url, type, weather_condition, created_at, updated_at)
VALUES
(1,'AZ-8801','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662094/T1_normal_004_gylsee.jpg','baseline','Sunny', NOW(), NOW()),
(6,'AZ-8801','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662113/T1_normal_003_olh7pr.jpg','baseline','Cloudy', NOW(), NOW()),
(11,'AZ-8801','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662053/T1_normal_001_e0b706.jpg','baseline','Rainy', NOW(), NOW()),

(2,'AZ-8802','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662646/T4_normal_001_lxkhqf.png','baseline','Sunny', NOW(), NOW()),
(7,'AZ-8802','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662662/T5_normal_001_attxhb.png','baseline','Cloudy', NOW(), NOW()),
(12,'AZ-8802','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662602/T2_normal_001_eydful.png','baseline','Rainy', NOW(), NOW()),

(3,'AZ-8803','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662213/T6_normal_001_lzomfh.jpg','baseline','Sunny', NOW(), NOW()),
(8,'AZ-8803','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662207/T6_normal_002_cd2s1e.jpg','baseline','Cloudy', NOW(), NOW()),
(13,'AZ-8803','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662211/T6_normal_003_jrstug.jpg','baseline','Rainy', NOW(), NOW()),

(4,'AZ-8804','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662383/T7_normal_002_rclksi.jpg','baseline','Sunny', NOW(), NOW()),
(9,'AZ-8804','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662391/T7_normal_003_wjcvui.jpg','baseline','Cloudy', NOW(), NOW()),
(14,'AZ-8804','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662380/T7_normal_001_v4zo5j.jpg','baseline','Rainy', NOW(), NOW()),

(5,'AZ-8805','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662419/T8_normal_002_huap8c.jpg','baseline','Sunny', NOW(), NOW()),
(10,'AZ-8805','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662414/T8_normal_003_z1eplm.jpg','baseline','Cloudy', NOW(), NOW()),
(15,'AZ-8805','https://res.cloudinary.com/ddleqtgrj/image/upload/v1759662425/T8_normal_001_pficpv.jpg','baseline','Rainy', NOW(), NOW());
