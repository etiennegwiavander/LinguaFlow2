/*
  # Add native_language column to students table

  1. Changes
    - Add `native_language` column to students table to store the student's native language
    - This column is used for translation assistance during lessons

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add native_language column to students table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'native_language'
  ) THEN
    ALTER TABLE students ADD COLUMN native_language text;
  END IF;
END $$;