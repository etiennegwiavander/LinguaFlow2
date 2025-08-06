-- Fix infinite recursion in shared lessons RLS policies
-- This migration removes problematic policies and creates simpler ones

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Allow lesson access via active shared lessons" ON lessons;
DROP POLICY IF EXISTS "Allow student access via active shared lessons" ON students;
DROP POLICY IF EXISTS "Shared lessons access" ON lessons;
DROP POLICY IF EXISTS "Shared lessons student access" ON students;

-- Create a simple policy for lessons that allows access via shared lessons
-- This policy uses a direct subquery without joins to avoid recursion
CREATE POLICY "Enable shared lesson access" ON lessons
    FOR SELECT 
    USING (
        -- Allow access if lesson has an active shared link
        id IN (
            SELECT lesson_id 
            FROM shared_lessons 
            WHERE is_active = true 
            AND expires_at > NOW()
        )
        OR
        -- Keep existing tutor access
        tutor_id = auth.uid()
    );

-- Create a simple policy for students that allows access via shared lessons
-- This policy uses a direct approach without complex joins
CREATE POLICY "Enable shared student access" ON students
    FOR SELECT 
    USING (
        -- Allow access if student's lesson has an active shared link
        id IN (
            SELECT l.student_id 
            FROM lessons l
            WHERE l.id IN (
                SELECT lesson_id 
                FROM shared_lessons 
                WHERE is_active = true 
                AND expires_at > NOW()
            )
        )
        OR
        -- Keep existing tutor access
        tutor_id = auth.uid()
    );