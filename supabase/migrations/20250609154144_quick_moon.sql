/*
  # Add generated_lessons column to lessons table

  1. Changes
    - Add `generated_lessons` column to lessons table to store AI-generated lesson plans
    - Column type is text array to store multiple lesson plan JSON strings

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add generated_lessons column to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'generated_lessons'
  ) THEN
    ALTER TABLE lessons ADD COLUMN generated_lessons text[];
  END IF;
END $$;