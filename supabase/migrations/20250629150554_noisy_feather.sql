/*
  # Create Admin Credentials Table

  1. New Tables
    - `admin_credentials`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `hashed_password` (text, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on admin_credentials table
    - Add policies for authenticated users
*/

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their own credentials (for internal use, e.g., profile management)
CREATE POLICY "Admins can view their own credentials"
  ON admin_credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admins can update their own password (if needed)
CREATE POLICY "Admins can update their own credentials"
  ON admin_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert an initial admin user with password 'admin123'
-- In production, you should use a properly hashed password
-- This is just for demonstration purposes
INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', '$2a$10$X7oqG9Vu9Xj.UxQxM0QOIeYwvUy5zBKUU4xJ4xNR6oDUpsKJFkQgG')
ON CONFLICT (username) DO NOTHING;

-- Grant execute permission on the function to authenticated users
COMMENT ON TABLE admin_credentials IS 'Stores admin user credentials for the separate admin portal';