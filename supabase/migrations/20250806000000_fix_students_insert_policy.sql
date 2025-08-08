-- Fix RLS policies for students table to allow INSERT operations
-- This addresses the "new row violates row-level security policy" error when adding students

-- Add INSERT policy for students table
CREATE POLICY "Tutors can insert students" ON students
    FOR INSERT 
    TO authenticated
    WITH CHECK (tutor_id = auth.uid());

-- Add UPDATE policy for students table  
CREATE POLICY "Tutors can update their students" ON students
    FOR UPDATE 
    TO authenticated
    USING (tutor_id = auth.uid())
    WITH CHECK (tutor_id = auth.uid());

-- Add DELETE policy for students table
CREATE POLICY "Tutors can delete their students" ON students
    FOR DELETE 
    TO authenticated
    USING (tutor_id = auth.uid());