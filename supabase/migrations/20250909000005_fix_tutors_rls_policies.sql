-- Fix tutors RLS policies to allow admin portal to see all tutors
-- This fixes the issue where admin portal only shows limited tutors

-- Drop all existing conflicting policies on tutors table
DROP POLICY IF EXISTS "Users can view own tutor record" ON tutors;
DROP POLICY IF EXISTS "Admins can view all tutors" ON tutors;
DROP POLICY IF EXISTS "Admin user can view all tutors" ON tutors;

-- Create a comprehensive policy that allows:
-- 1. Users to view their own record
-- 2. Admins to view all records
CREATE POLICY "Tutors can view own record and admins can view all" ON tutors
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM tutors admin_tutor 
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  );

-- Create policy for tutors to update their own records
CREATE POLICY "Tutors can update own record" ON tutors
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for admins to manage all tutor records
CREATE POLICY "Admins can manage all tutors" ON tutors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors admin_tutor 
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutors admin_tutor 
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  );