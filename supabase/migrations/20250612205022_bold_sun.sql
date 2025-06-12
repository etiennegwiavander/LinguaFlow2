/*
  # Add lesson_template_id to lessons table

  1. Changes
    - Add `lesson_template_id` column to lessons table
    - Create foreign key relationship to lesson_templates table
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed (existing policies cover this column)
*/

-- Add lesson_template_id column to lessons table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'lesson_template_id'
  ) THEN
    ALTER TABLE lessons ADD COLUMN lesson_template_id uuid REFERENCES lesson_templates(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_template_id ON lessons(lesson_template_id);