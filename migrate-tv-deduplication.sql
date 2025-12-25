-- Migration: TV Deduplication & Device Identity System
-- Implements three-layer identity model: device_uid (permanent), installation_id (ephemeral), tv_id (user-facing)
-- Prevents duplicate TVs on reinstall while maintaining clean ownership control

-- Add new identity fields to hardware_tvs table
ALTER TABLE hardware_tvs
ADD COLUMN IF NOT EXISTS device_uid VARCHAR(255) NULL UNIQUE COMMENT 'Permanent hardware-based identity (hashed MAC + Android ID)',
ADD COLUMN IF NOT EXISTS installation_id VARCHAR(255) NULL COMMENT 'Ephemeral ID for each app install (changes on reinstall)',
ADD COLUMN IF NOT EXISTS tv_id VARCHAR(50) NULL COMMENT 'Short user-facing code (e.g. TV-4K2J)',
ADD COLUMN IF NOT EXISTS mac_hash VARCHAR(255) NULL COMMENT 'Hashed MAC address for hardware identification',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL COMMENT 'When device was approved for management';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_uid ON hardware_tvs(device_uid);
CREATE INDEX IF NOT EXISTS idx_installation_id ON hardware_tvs(installation_id);
CREATE INDEX IF NOT EXISTS idx_tv_id ON hardware_tvs(tv_id);

-- Migrate existing device_id to device_uid (if device_uid is NULL)
-- This preserves existing devices while transitioning to new system
UPDATE hardware_tvs 
SET device_uid = device_id 
WHERE device_uid IS NULL AND device_id IS NOT NULL;

-- Note: device_id column remains for backward compatibility during transition
-- Eventually, device_uid will become the primary identifier

