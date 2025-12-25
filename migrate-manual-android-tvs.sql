-- Migration: Add manual TV management and Android TV detection
-- This allows users to manually add Android TV devices from the /tvs page
-- Only manually added TVs will be shown in the /tvs interface
-- Run this migration to enable the new Android TV management features
-- Requires MySQL 8.0.19+ or MariaDB 10.3.4+ for IF NOT EXISTS support

ALTER TABLE hardware_tvs 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE COMMENT 'Whether this TV was manually added from /tvs page',
ADD COLUMN IF NOT EXISTS is_android_tv BOOLEAN DEFAULT FALSE COMMENT 'Whether this is an Android TV device',
ADD INDEX idx_is_manual (is_manual),
ADD INDEX idx_is_android_tv (is_android_tv);

