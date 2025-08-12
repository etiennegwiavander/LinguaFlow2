-- Add admin policies to allow admins to see all tutors and students

-- Add policy for admins to view all tutors
CREATE POLICY "Admins can view all tutors" ON tutors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors admin_tutor 
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  );

-- Add policy for admins to view all students  
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors admin_tutor 
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  );

-- Add policy for admins to view all lessons
CREATE POLICY "Admins can view all lessons" ON lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tutors admin_tutor 
      WHERE admin_tutor.id = auth.uid() 
      AND admin_tutor.is_admin = true
    )
  );

-- Admin policies created successfully