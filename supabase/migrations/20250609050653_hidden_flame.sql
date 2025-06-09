/*
  # Add email column to google_tokens table

  1. Changes
    - Add email column to google_tokens table for storing user's Google email
    - This column is used to display which Google account is connected

  2. Notes
    - This is a safe addition that won't affect existing functionality
    - Email is optional and can be null for existing records
*/

-- Add email column to google_tokens table if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'google_tokens'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'google_tokens' AND column_name = 'email'
    ) THEN
      ALTER TABLE google_tokens ADD COLUMN email text;
    END IF;
  END IF;
END $$;