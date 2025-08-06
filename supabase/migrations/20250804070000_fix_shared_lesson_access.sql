-- Fix shared lesson access by allowing lessons to be read via active shared_lessons
-- This allows the shared lesson page to access lesson content without authentication

-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow lesson access via active shared lessons" ON lessons;
DROP POLICY IF EXISTS "Allow student access via active shared lessons" ON students;

-- Add policy to allow reading lessons through active shared lessons
-- This policy allows anonymous access to lessons that have active shared links
CREATE POLICY "Allow lesson access via active shared lessons" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_lessons 
            WHERE shared_lessons.lesson_id = lessons.id 
            AND shared_lessons.is_active = true 
            AND shared_lessons.expires_at > NOW()
        )
    );

-- Add policy to allow reading students through active shared lessons
-- This policy allows anonymous access to student info for lessons with active shared links
CREATE POLICY "Allow student access via active shared lessons" ON students
    FOR SELECT USING (
        id IN (
            SELECT lessons.student_id 
            FROM lessons 
            JOIN shared_lessons ON shared_lessons.lesson_id = lessons.id
            WHERE shared_lessons.is_active = true 
            AND shared_lessons.expires_at > NOW()
        )
    );