-- Migration: Add Activity Logs Table
-- This table stores all system activities for the admin dashboard

USE menupi_db;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial activity logs from existing data
-- Recent registrations
INSERT INTO activity_logs (restaurant_id, user_id, action, details, created_at)
SELECT r.id, u.id, 'New Registration', CONCAT(u.name, ' (', u.email, ') signed up'), r.created_at
FROM restaurants r
LEFT JOIN users u ON r.id = u.restaurant_id AND u.role = 'owner'
WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY r.created_at DESC
LIMIT 50;

-- Screen creations
INSERT INTO activity_logs (restaurant_id, user_id, action, details, created_at)
SELECT s.restaurant_id, s.user_id, 'Screen Created', CONCAT('Screen "', s.name, '" created'), s.created_at
FROM screens s
WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY s.created_at DESC
LIMIT 50;

-- Media uploads
INSERT INTO activity_logs (restaurant_id, user_id, action, details, created_at)
SELECT m.restaurant_id, m.user_id, 'Media Uploaded', CONCAT('File "', m.file_name, '" uploaded (', m.file_type, ', ', m.file_size_mb, ' MB)'), m.created_at
FROM media m
WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY m.created_at DESC
LIMIT 50;

