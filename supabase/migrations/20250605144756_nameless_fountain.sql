/*
  # Create Storage Bucket for Profile Pictures

  1. New Storage Bucket
    - Create a new storage bucket called 'profiles' for storing user profile pictures
    - Enable public access to the bucket
    - Set up security policies for authenticated users
*/

-- Create a new storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  POSITION(auth.uid()::text IN name) > 0
);

-- Allow public access to view profile pictures
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');