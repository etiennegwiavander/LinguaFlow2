/*
  # Create Calendar Webhook Logs Table

  1. New Tables
    - `calendar_webhook_logs`
      - `id` (uuid, primary key)
      - `tutor_id` (uuid, references tutors)
      - `channel_id` (text)
      - `resource_id` (text)
      - `resource_state` (text)
      - `message_number` (text)
      - `headers` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on calendar_webhook_logs table
    - Add policies for authenticated users to access their own logs
*/

-- Create calendar_webhook_logs table
CREATE TABLE IF NOT EXISTS calendar_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  channel_id text NOT NULL,
  resource_id text NOT NULL,
  resource_state text,
  message_number text,
  headers jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE calendar_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for tutors to view their own logs
CREATE POLICY "Tutors can view their own webhook logs"
  ON calendar_webhook_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_webhook_logs_tutor_id ON calendar_webhook_logs(tutor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_webhook_logs_channel_id ON calendar_webhook_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_calendar_webhook_logs_created_at ON calendar_webhook_logs(created_at);