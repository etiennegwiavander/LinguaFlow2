/*
  # Add Google Calendar Webhook Columns

  1. Changes
    - Add columns to google_tokens table for managing Google Calendar push notifications:
      - channel_id (text): Stores the unique ID of the notification channel
      - resource_id (text): Stores the opaque ID for the watched resource
      - channel_expiration (timestamptz): Stores when the notification channel expires
    - Add indexes for better query performance

  2. Security
    - No changes to RLS policies needed as this is just adding columns
*/

-- Add webhook columns to google_tokens table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'google_tokens' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE google_tokens ADD COLUMN channel_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'google_tokens' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE google_tokens ADD COLUMN resource_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'google_tokens' AND column_name = 'channel_expiration'
  ) THEN
    ALTER TABLE google_tokens ADD COLUMN channel_expiration timestamptz;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_channel_id ON google_tokens(channel_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_channel_expiration ON google_tokens(channel_expiration);