-- Migration: Add IP address tracking to hardware_tvs table
-- This helps identify devices by their network location
-- Run this after the main database.sql

ALTER TABLE hardware_tvs 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL COMMENT 'Last known IP address (IPv4 or IPv6)',
ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500) NULL COMMENT 'Last known user agent string',
ADD INDEX idx_ip_address (ip_address);

