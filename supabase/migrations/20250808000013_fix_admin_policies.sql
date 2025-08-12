-- Fix infinite recursion in admin policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all tutors" ON tutors;
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Admins can view all lessons" ON lessons;

-- Create a simpler admin policy that checks auth.jwt() for admin status
-- First, we need to ensure the JWT contains the admin status
-- This approach uses a function to avoid recursion

-- Create a function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tutors 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
$$;

-- Now create policies using this function
CREATE POLICY "Admins can view all tutors" ON tutors
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all students" ON students
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all lessons" ON lessons
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admin policies fixed