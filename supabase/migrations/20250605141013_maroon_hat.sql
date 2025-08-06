/*
  # Add Insert Policy for Tutors

  1. Changes
    - Add INSERT policy for tutors table to allow new user registration
    - Policy allows users to create their own tutor record during signup

  2. Security
    - Only allows insertion if the new row's ID matches the authenticated user's ID
    - Maintains existing security model while enabling registration flow
*/

-- Policy already exists in initial schema, skipping
-- CREATE POLICY "Users can insert own tutor record"
--   ON tutors
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = id);