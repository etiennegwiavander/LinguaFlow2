-- Final RLS Policy Fix for Tutors Table
-- This migration ensures no infinite recursion in RLS policies

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own tutor record" ON tutors;
DROP POLICY IF EXISTS "Users can update own tutor record" ON tutors;
DROP POLICY IF EXISTS "Allow tutor registration" ON tutors;
DROP POLICY IF EXISTS "Admins can manage all tutors" ON tutors;

-- Drop the potentially problematic function
DROP FUNCTION IF EXISTS is_admin_user(uuid);

-- Create a simple, non-recursive admin check function
-- This function uses SECURITY DEFINER to bypass RLS completely
CREATE OR REPLACE FUNCTION check_admin_status(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM tutors WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_admin_status(uuid) TO authenticated;

-- Create simple, non-recursive policies

-- Policy 1: Users can always view their own record
CREATE POLICY "tutors_select_own" ON tutors
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own record
CREATE POLICY "tutors_update_own" ON tutors
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow INSERT for new user registration
CREATE POLICY "tutors_insert_own" ON tutors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can view all records (using non-recursive function)
CREATE POLICY "tutors_admin_select_all" ON tutors
  FOR SELECT TO authenticated
  USING (check_admin_status(auth.uid()));

-- Policy 5: Admins can update all records (using non-recursive function)
CREATE POLICY "tutors_admin_update_all" ON tutors
  FOR UPDATE TO authenticated
  USING (check_admin_status(auth.uid()))
  WITH CHECK (check_admin_status(auth.uid()));

-- Policy 6: Admins can delete records (using non-recursive function)
CREATE POLICY "tutors_admin_delete_all" ON tutors
  FOR DELETE TO authenticated
  USING (check_admin_status(auth.uid()));

-- Ensure RLS is enabled
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

-- Test the policies by creating a simple view that should work
CREATE OR REPLACE VIEW tutor_count AS
SELECT COUNT(*) as total_tutors FROM tutors;

-- Grant access to the view
GRANT SELECT ON tutor_count TO authenticated;

-- Add a comment to track this migration
COMMENT ON TABLE tutors IS 'RLS policies updated on 2025-09-09 to prevent infinite recursion';