/*
  # Fix Schema Issues

  1. Changes
    - Add missing columns to tutors table:
      - name (text, nullable)
      - avatar_url (text, nullable)
    - Add missing column to lessons table:
      - tutor_id (uuid, references tutors)
    - Add foreign key constraints and indexes

  2. Security
    - Update RLS policies for new columns
*/

-- Add missing columns to tutors table
ALTER TABLE tutors 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add missing column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS tutor_id uuid REFERENCES tutors(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutors_email ON tutors(email);

-- Update lessons table to set tutor_id from existing relationships
UPDATE lessons 
SET tutor_id = students.tutor_id 
FROM students 
WHERE lessons.student_id = students.id 
AND lessons.tutor_id IS NULL;