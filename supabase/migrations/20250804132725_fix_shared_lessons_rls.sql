-- Fix infinite recursion in shared lessons RLS policies
-- Drop the problematic policies and recreate them without circular references

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow lesson access via active shared lessons" ON lessons;
DROP POLICY IF EXISTS "Allow student access via active shared lessons" ON students;

-- Create a simpler policy for lessons that avoids recursion
-- This allows anonymous access to lessons that have active shared links
CREATE POLICY "Shared lessons access" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_lessons 
            WHERE shared_lessons.lesson_id = lessons.id 
            AND shared_lessons.is_active = true 
            AND shared_lessons.expires_at > NOW()
        )
    );

-- Create a simpler policy for students that avoids recursion
-- This allows anonymous access to student info for shared lessons
CREATE POLICY "Shared lessons student access" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN shared_lessons ON shared_lessons.lesson_id = lessons.id
            WHERE lessons.student_id = students.id 
            AND shared_lessons.is_active = true 
            AND shared_lessons.expires_at > NOW()
        )
    );