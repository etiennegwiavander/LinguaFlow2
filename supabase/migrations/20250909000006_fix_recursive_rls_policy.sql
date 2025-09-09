-- Fix infinite recursion in tutors RLS policy
-- The previous policy was checking tutors table within tutors table policy, causing recursion

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Tutors can view own record and admins can view all" ON tutors;
DROP POLICY IF EXISTS "Tutors can update own record" ON tutors;
DROP POLICY IF EXISTS "Admins can manage all tutors" ON tutors;

-- Create simple, non-recursive policies
-- Policy 1: Users can always view their own record
CREATE POLICY "Users can view own tutor record" ON tutors
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own record
CREATE POLICY "Users can update own tutor record" ON tutors
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow INSERT for new user registration (during signup)
CREATE POLICY "Allow tutor registration" ON tutors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a function to check admin status without recursion
-- This function uses a direct query with security definer to avoid RLS
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM tutors WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Policy 4: Admin policy using the non-recursive function
CREATE POLICY "Admins can manage all tutors" ON tutors
  FOR ALL TO authenticated
  USING (is_admin_user(auth.uid()) OR auth.uid() = id)
  WITH CHECK (is_admin_user(auth.uid()) OR auth.uid() = id);

-- Note: For a more robust admin system, you would typically:
-- 1. Create a separate admin_users table
-- 2. Use a function that doesn't query the same table
-- 3. Or use service role for admin operations (which we're doing with the API routes)