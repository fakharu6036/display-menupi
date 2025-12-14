-- Migration: Add display_order column to screen_media table
-- Run this if you get "Unknown column 'display_order'" errors

-- Check if column exists, if not add it
ALTER TABLE screen_media 
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0 AFTER play_value;

-- Update existing records to have sequential order
UPDATE screen_media sm
INNER JOIN (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY screen_id ORDER BY id) - 1 as new_order
    FROM screen_media
) ordered ON sm.id = ordered.id
SET sm.display_order = ordered.new_order;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_display_order ON screen_media(display_order);

