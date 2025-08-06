/*
  # Google Calendar Integration

  1. New Tables
    - `google_tokens`
      - `id` (uuid, primary key)
      - `tutor_id` (uuid, references tutors)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `expires_at` (timestamp)
      - `scope` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `calendar_events`
      - `id` (uuid, primary key)
      - `tutor_id` (uuid, references tutors)
      - `google_event_id` (text, unique)
      - `summary` (text)
      - `description` (text, nullable)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `location` (text, nullable)
      - `attendees` (jsonb, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create google_tokens table (already exists in initial schema)
-- CREATE TABLE IF NOT EXISTS google_tokens (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
--   access_token text NOT NULL,
--   refresh_token text NOT NULL,
--   expires_at timestamptz NOT NULL,
--   scope text NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar.readonly',
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );

-- ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Tutors can CRUD their own tokens
CREATE POLICY "Tutors can manage own google tokens"
  ON google_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Create calendar_events table (already exists in initial schema)
-- CREATE TABLE IF NOT EXISTS calendar_events (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
--   google_event_id text NOT NULL,
--   summary text NOT NULL,
--   description text,
--   start_time timestamptz NOT NULL,
--   end_time timestamptz NOT NULL,
--   location text,
--   attendees jsonb,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now(),
--   UNIQUE(tutor_id, google_event_id)
-- );

-- ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Tutors can CRUD their own calendar events
CREATE POLICY "Tutors can manage own calendar events"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_tutor_id ON google_tokens(tutor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tutor_id ON calendar_events(tutor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON calendar_events(google_event_id);

-- Create function to update updated_at timestamp
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- Create triggers for updated_at
-- CREATE TRIGGER update_google_tokens_updated_at 
--     BEFORE UPDATE ON google_tokens 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_calendar_events_updated_at 
--     BEFORE UPDATE ON calendar_events 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();