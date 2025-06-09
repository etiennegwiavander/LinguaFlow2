/*
  # Add Insert Policy for Tutors

  1. Changes
    - Add INSERT policy for tutors table to allow new user registration
    - Policy allows users to create their own tutor record during signup

  2. Security
    - Only allows insertion if the new row's ID matches the authenticated user's ID
    - Maintains existing security model while enabling registration flow
*/

-- Create INSERT policy for tutors if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tutors'
    AND policyname = 'Users can insert own tutor record'
  ) THEN
    CREATE POLICY "Users can insert own tutor record"
      ON tutors
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
