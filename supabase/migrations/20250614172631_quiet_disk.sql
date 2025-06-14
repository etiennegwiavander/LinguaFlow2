/*
  # Add sub_topics column to lessons table

  1. Changes
    - Add `sub_topics` column to lessons table to store AI-generated sub-topics
    - Column type is jsonb to store array of sub-topic objects with title, category, and level

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add sub_topics column to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'sub_topics'
  ) THEN
    ALTER TABLE lessons ADD COLUMN sub_topics jsonb;
  END IF;
END $$;

-- Create index for better performance when querying sub-topics
CREATE INDEX IF NOT EXISTS idx_lessons_sub_topics ON lessons USING GIN (sub_topics);