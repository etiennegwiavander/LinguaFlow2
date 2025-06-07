/*
  # Add email column to google_tokens table

  1. Changes
    - Add email column to google_tokens table to store the calendar email address
    - This allows users to specify which Google account's calendar to sync

  2. Security
    - No changes to RLS policies needed
*/

-- Add email column to google_tokens table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'google_tokens' AND column_name = 'email'
  ) THEN
    ALTER TABLE google_tokens ADD COLUMN email text;
  END IF;
END $$;