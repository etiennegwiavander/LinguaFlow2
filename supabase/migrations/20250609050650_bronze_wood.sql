/*
  # Fix lessons table date column

  1. Changes
    - Add missing `date` column to lessons table if it doesn't exist
    - Update existing lessons to have a default date if needed

  2. Notes
    - This migration is safe and will not affect existing data
    - Uses conditional logic to only add column if it doesn't exist
*/

-- Add date column to lessons table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'date'
  ) THEN
    ALTER TABLE lessons ADD COLUMN date timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Update any existing lessons that might have null dates
UPDATE lessons SET date = created_at WHERE date IS NULL;