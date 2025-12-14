-- Migration: Add Email Verification Columns to Users Table
-- Run this migration to add email verification functionality

USE menupi_db;

-- Add verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE AFTER google_id,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL AFTER is_verified,
ADD COLUMN IF NOT EXISTS token_expires TIMESTAMP NULL AFTER verification_token;

-- Add index for faster verification token lookups
CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_token);

-- Update existing users to be verified (for backward compatibility)
UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL OR is_verified = FALSE;

