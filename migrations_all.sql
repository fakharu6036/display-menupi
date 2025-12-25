-- ============================================================================
-- MENUPI Database Schema - Complete Migration
-- ============================================================================
-- This file contains all database migrations in the correct order.
-- Safe to run multiple times (idempotent).
-- 
-- IMPORTANT: Run this ONCE in Railway MySQL Shell after database is created.
-- Do NOT run this from the application code in production.
-- ============================================================================

-- ============================================================================
-- PART 1: Core Tables (Base Schema)
-- ============================================================================

-- Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    max_screens INT DEFAULT 1,
    account_status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin', 'staff', 'SUPER_ADMIN') DEFAULT 'owner',
    auth_method ENUM('local', 'google') DEFAULT 'local',
    google_id VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media Table
CREATE TABLE IF NOT EXISTS media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type ENUM('image', 'video', 'pdf', 'gif') DEFAULT 'image',
    file_size_mb DECIMAL(10, 2) DEFAULT 0,
    source ENUM('upload', 'unsplash', 'pexels', 'pixabay') DEFAULT 'upload',
    duration INT NULL COMMENT 'Duration in seconds for videos',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_file_type (file_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screens Table
CREATE TABLE IF NOT EXISTS screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    orientation ENUM('horizontal', 'vertical') DEFAULT 'horizontal',
    aspect_ratio VARCHAR(50) DEFAULT '16:9',
    screen_code VARCHAR(100) NOT NULL UNIQUE,
    template VARCHAR(100) DEFAULT 'default',
    display_mode ENUM('fit', 'fill', 'contain', 'cover') DEFAULT 'fit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_screen_code (screen_code),
    INDEX idx_last_seen_at (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screen Media Junction Table (Playlist Items)
CREATE TABLE IF NOT EXISTS screen_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screen_id INT NOT NULL,
    media_id INT NOT NULL,
    play_mode ENUM('seconds', 'times') DEFAULT 'seconds',
    play_value INT DEFAULT 10 COMMENT 'Duration in seconds or number of times',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    INDEX idx_screen_id (screen_id),
    INDEX idx_media_id (media_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    user_id INT NOT NULL,
    screen_id INT NOT NULL,
    repeat_type ENUM('daily', 'weekly', 'monthly', 'date', 'once') DEFAULT 'daily',
    days_of_week JSON NULL COMMENT 'Array of day numbers: [0=Sunday, 1=Monday, ...]',
    date DATE NULL COMMENT 'Specific date for "once" or "date" repeat type',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    priority INT DEFAULT 0 COMMENT 'Higher priority schedules override lower ones',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE,
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_screen_id (screen_id),
    INDEX idx_active (active),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 2: Hardware TVs Table (Device Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hardware_tvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permanent device identifier (legacy)',
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

-- ============================================================================
-- PART 3: Plan Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    requested_plan ENUM('free', 'basic', 'premium', 'enterprise') NOT NULL,
    status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 4: Add IP Tracking to hardware_tvs (Migration 1)
-- ============================================================================

ALTER TABLE hardware_tvs 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL COMMENT 'Last known IP address (IPv4 or IPv6)';

ALTER TABLE hardware_tvs 
ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500) NULL COMMENT 'Last known user agent string';

-- Add index for IP address (safe - will skip if exists)
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND index_name = 'idx_ip_address'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_ip_address ON hardware_tvs(ip_address)',
    'SELECT "Index idx_ip_address already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PART 5: Add Manual TV Management (Migration 2)
-- ============================================================================

ALTER TABLE hardware_tvs 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE COMMENT 'Whether this TV was manually added from /tvs page';

ALTER TABLE hardware_tvs 
ADD COLUMN IF NOT EXISTS is_android_tv BOOLEAN DEFAULT FALSE COMMENT 'Whether this is an Android TV device';

-- Add indexes for manual/Android TV flags (safe)
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND index_name = 'idx_is_manual'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_is_manual ON hardware_tvs(is_manual)',
    'SELECT "Index idx_is_manual already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND index_name = 'idx_is_android_tv'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_is_android_tv ON hardware_tvs(is_android_tv)',
    'SELECT "Index idx_is_android_tv already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PART 6: Add TV Deduplication Fields (Migration 3)
-- ============================================================================

ALTER TABLE hardware_tvs
ADD COLUMN IF NOT EXISTS device_uid VARCHAR(255) NULL COMMENT 'Permanent hardware-based identity (hashed MAC + Android ID)';

ALTER TABLE hardware_tvs
ADD COLUMN IF NOT EXISTS installation_id VARCHAR(255) NULL COMMENT 'Ephemeral ID for each app install (changes on reinstall)';

ALTER TABLE hardware_tvs
ADD COLUMN IF NOT EXISTS tv_id VARCHAR(50) NULL COMMENT 'Short user-facing code (e.g. TV-4K2J)';

ALTER TABLE hardware_tvs
ADD COLUMN IF NOT EXISTS mac_hash VARCHAR(255) NULL COMMENT 'Hashed MAC address for hardware identification';

ALTER TABLE hardware_tvs
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL COMMENT 'When device was approved for management';

-- Add UNIQUE constraint on device_uid (safe - will skip if exists)
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND constraint_name = 'device_uid'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE hardware_tvs ADD UNIQUE KEY device_uid (device_uid)',
    'SELECT "Unique constraint on device_uid already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for deduplication fields (safe)
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND index_name = 'idx_device_uid'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_device_uid ON hardware_tvs(device_uid)',
    'SELECT "Index idx_device_uid already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND index_name = 'idx_installation_id'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_installation_id ON hardware_tvs(installation_id)',
    'SELECT "Index idx_installation_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'hardware_tvs' 
    AND index_name = 'idx_tv_id'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_tv_id ON hardware_tvs(tv_id)',
    'SELECT "Index idx_tv_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate existing device_id to device_uid (if device_uid is NULL)
-- This preserves existing devices while transitioning to new system
UPDATE hardware_tvs 
SET device_uid = device_id 
WHERE device_uid IS NULL AND device_id IS NOT NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All tables and columns have been created/updated.
-- This migration is idempotent - safe to run multiple times.
-- ============================================================================

SELECT '✅ Database migration completed successfully' AS status;

