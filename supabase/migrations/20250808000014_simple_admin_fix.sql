-- Simple fix: Allow specific admin user ID to see all data

-- Drop the function-based policies if they still cause issues
DROP POLICY IF EXISTS "Admins can view all tutors" ON tutors;
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Admins can view all lessons" ON lessons;

-- Create simple policies that directly check for your admin user ID
CREATE POLICY "Admin user can view all tutors" ON tutors
  FOR SELECT TO authenticated
  USING (auth.uid() = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689'::uuid);

CREATE POLICY "Admin user can view all students" ON students
  FOR SELECT TO authenticated
  USING (auth.uid() = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689'::uuid);

CREATE POLICY "Admin user can view all lessons" ON lessons
  FOR SELECT TO authenticated
  USING (auth.uid() = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689'::uuid);

-- Simple admin policies created