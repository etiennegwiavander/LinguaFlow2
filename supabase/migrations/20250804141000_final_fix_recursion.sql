-- Final fix for infinite recursion in shared lessons RLS policies
-- This migration completely removes the problematic policies and creates a bypass approach

-- Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Allow lesson access via active shared lessons" ON lessons;
DROP POLICY IF EXISTS "Allow student access via active shared lessons" ON students;
DROP POLICY IF EXISTS "Shared lessons access" ON lessons;
DROP POLICY IF EXISTS "Shared lessons student access" ON students;
DROP POLICY IF EXISTS "Enable shared lesson access" ON lessons;
DROP POLICY IF EXISTS "Enable shared student access" ON students;

-- Temporarily disable RLS for shared lesson access
-- This is a more direct approach that avoids recursion entirely

-- Create a function to check if a lesson is shared
CREATE OR REPLACE FUNCTION is_lesson_shared(lesson_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_lessons 
    WHERE lesson_id = lesson_uuid 
    AND is_active = true 
    AND expires_at > NOW()
  );
$$;

-- Create a function to check if a student is part of a shared lesson
CREATE OR REPLACE FUNCTION is_student_in_shared_lesson(student_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lessons l
    JOIN shared_lessons sl ON sl.lesson_id = l.id
    WHERE l.student_id = student_uuid 
    AND sl.is_active = true 
    AND sl.expires_at > NOW()
  );
$$;

-- Create simple policies using the functions (this avoids recursion)
CREATE POLICY "Lessons shared access" ON lessons
    FOR SELECT 
    USING (
        tutor_id = auth.uid() OR is_lesson_shared(id)
    );

CREATE POLICY "Students shared access" ON students
    FOR SELECT 
    USING (
        tutor_id = auth.uid() OR is_student_in_shared_lesson(id)
    );