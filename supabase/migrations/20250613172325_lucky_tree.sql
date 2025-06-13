/*
  # Add interactive_lesson_content column to lessons table

  1. Changes
    - Add `interactive_lesson_content` column to lessons table to store AI-filled interactive lesson templates
    - Column type is jsonb to store the complete filled template structure

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add interactive_lesson_content column to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'interactive_lesson_content'
  ) THEN
    ALTER TABLE lessons ADD COLUMN interactive_lesson_content jsonb;
  END IF;
END $$;

-- Create index for better performance when querying interactive content
CREATE INDEX IF NOT EXISTS idx_lessons_interactive_lesson_content ON lessons USING GIN (interactive_lesson_content);