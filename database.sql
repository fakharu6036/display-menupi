-- Digital Signage System Database Schema
-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS u859590789_disys;
-- USE u859590789_disys;

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
    role ENUM('owner', 'admin', 'staff') DEFAULT 'owner',
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

-- Hardware TVs Table (Device Identity)
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

-- Plan Requests Table
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

