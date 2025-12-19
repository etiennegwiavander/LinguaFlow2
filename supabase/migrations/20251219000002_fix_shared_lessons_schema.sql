-- Fix shared_lessons table schema to match the application code
-- This migration updates the table structure to include student_name and lesson_title

-- First, check if the new columns already exist
DO $$
BEGIN
    -- Add student_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_lessons' 
        AND column_name = 'student_name'
    ) THEN
        ALTER TABLE shared_lessons ADD COLUMN student_name TEXT;
    END IF;

    -- Add lesson_title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_lessons' 
        AND column_name = 'lesson_title'
    ) THEN
        ALTER TABLE shared_lessons ADD COLUMN lesson_title TEXT;
    END IF;

    -- Add shared_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_lessons' 
        AND column_name = 'shared_at'
    ) THEN
        ALTER TABLE shared_lessons ADD COLUMN shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE shared_lessons 
SET 
    student_name = COALESCE(student_name, 'Student'),
    lesson_title = COALESCE(lesson_title, 'Interactive Lesson'),
    shared_at = COALESCE(shared_at, created_at)
WHERE student_name IS NULL OR lesson_title IS NULL OR shared_at IS NULL;

-- Make the new columns NOT NULL after setting default values
ALTER TABLE shared_lessons ALTER COLUMN student_name SET NOT NULL;
ALTER TABLE shared_lessons ALTER COLUMN lesson_title SET NOT NULL;
ALTER TABLE shared_lessons ALTER COLUMN shared_at SET NOT NULL;

-- The share_token column can remain for backward compatibility
-- but we'll make it optional since the new code doesn't use it
ALTER TABLE shared_lessons ALTER COLUMN share_token DROP NOT NULL;

-- Update RLS policies to match the new schema requirements
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view active shared lessons" ON shared_lessons;
DROP POLICY IF EXISTS "Tutors can create shared lessons for their lessons" ON shared_lessons;
DROP POLICY IF EXISTS "Tutors can update their own shared lessons" ON shared_lessons;
DROP POLICY IF EXISTS "Tutors can delete their own shared lessons" ON shared_lessons;

-- Recreate policies with proper logic
CREATE POLICY "Anyone can view active shared lessons" ON shared_lessons
    FOR SELECT USING (
        is_active = true 
        AND expires_at > NOW()
    );

CREATE POLICY "Tutors can create shared lessons for their lessons" ON shared_lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = lesson_id 
            AND lessons.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can update their own shared lessons" ON shared_lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = lesson_id 
            AND lessons.tutor_id = auth.uid()
        )
    );

CREATE POLICY "Tutors can delete their own shared lessons" ON shared_lessons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = lesson_id 
            AND lessons.tutor_id = auth.uid()
        )
    );