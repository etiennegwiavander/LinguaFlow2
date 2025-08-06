-- Temporary solution: Disable RLS for shared lesson access
-- This is a more direct approach that completely bypasses the recursion issue

-- First, let's see what policies exist and drop them all
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on lessons table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'lessons' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lessons', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on students table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'students' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON students', policy_record.policyname);
    END LOOP;
END $$;

-- Create very simple policies that allow anonymous access for shared lessons
-- and authenticated access for tutors

-- For lessons: Allow if user is tutor OR if lesson is shared (using function)
CREATE POLICY "Simple lessons access" ON lessons
    FOR SELECT 
    USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN tutor_id = auth.uid()
            ELSE is_lesson_shared(id)
        END
    );

-- For students: Allow if user is tutor OR if student is in shared lesson (using function)
CREATE POLICY "Simple students access" ON students
    FOR SELECT 
    USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN tutor_id = auth.uid()
            ELSE is_student_in_shared_lesson(id)
        END
    );