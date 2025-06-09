/*
  # Add materials column to lessons table

  1. Changes
    - Add materials column to lessons table as text array
    - This column stores the lesson materials for each lesson

  2. Notes
    - Uses conditional logic to only add column if it doesn't exist
    - Safe migration that won't affect existing data
*/

-- Add materials column to lessons table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'materials'
  ) THEN
    ALTER TABLE lessons ADD COLUMN materials text[] DEFAULT '{}';
  END IF;
END $$;