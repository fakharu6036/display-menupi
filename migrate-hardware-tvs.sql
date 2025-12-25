-- Migration: Add hardware_tvs table for device identity
-- Run this after updating database.sql

CREATE TABLE IF NOT EXISTS hardware_tvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permanent device identifier',
    restaurant_id INT NULL COMMENT 'Assigned restaurant (can be NULL if unpaired)',
    assigned_screen_id INT NULL COMMENT 'Currently assigned screen',
    assigned_screen_code VARCHAR(100) NULL COMMENT 'Screen code for quick lookup',
    last_seen_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_screen_id) REFERENCES screens(id) ON DELETE SET NULL,
    INDEX idx_device_id (device_id),
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_assigned_screen_id (assigned_screen_id),
    INDEX idx_last_seen_at (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

