/*
  # Add notes column to lessons table

  1. Changes
    - Add notes column to lessons table if it doesn't exist
    - This column stores lesson notes and is used by the lesson generation feature

  2. Notes
    - This is a safe addition that won't affect existing functionality
    - Notes column is nullable for existing records
*/

-- Add notes column to lessons table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'notes'
  ) THEN
    ALTER TABLE lessons ADD COLUMN notes text;
  END IF;
END $$;