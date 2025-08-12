-- Initial schema for LinguaFlow application
-- This creates the base tables needed for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deletion_scheduled boolean DEFAULT false
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_language text NOT NULL,
  proficiency_level text,
  end_goals text,
  grammar_weaknesses text,
  vocabulary_gaps text,
  pronunciation_challenges text,
  conversational_fluency_barriers text,
  learning_styles jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  level text,
  native_language text,
  avatar_url text
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  generated_at timestamptz,
  lesson_plans jsonb,
  feedback text,
  gcal_event_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  date timestamptz,
  generated_lessons jsonb,
  materials jsonb,
  notes text,
  status text DEFAULT 'upcoming',
  lesson_template_id uuid,
  interactive_lesson_content jsonb,
  sub_topics jsonb
);

-- Create lesson_templates table
CREATE TABLE IF NOT EXISTS lesson_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  level text NOT NULL,
  template_json jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create google_tokens table
CREATE TABLE IF NOT EXISTS google_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar.readonly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  channel_id text,
  channel_expiration timestamptz,
  UNIQUE(tutor_id)
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  google_event_id text NOT NULL,
  summary text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  attendees jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id, google_event_id)
);

-- Create shared_lessons table
CREATE TABLE IF NOT EXISTS shared_lessons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  share_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create account_deletions table
CREATE TABLE IF NOT EXISTS account_deletions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  recovery_token text UNIQUE NOT NULL,
  deletion_timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tutor_id)
);

-- Create deletion_logs table
CREATE TABLE IF NOT EXISTS deletion_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create calendar_webhook_logs table
CREATE TABLE IF NOT EXISTS calendar_webhook_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id uuid,
  channel_id text,
  event_type text,
  resource_id text,
  resource_uri text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own tutor record" ON tutors
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own students" ON students
  FOR SELECT TO authenticated
  USING (tutor_id = auth.uid());

CREATE POLICY "Users can view own lessons" ON lessons
  FOR SELECT TO authenticated
  USING (tutor_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_tutor_id ON google_tokens(tutor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tutor_id ON calendar_events(tutor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_shared_lessons_lesson_id ON shared_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_shared_lessons_expires_at ON shared_lessons(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tutors_updated_at 
    BEFORE UPDATE ON tutors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at 
    BEFORE UPDATE ON lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_tokens_updated_at 
    BEFORE UPDATE ON google_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_lessons_updated_at 
    BEFORE UPDATE ON shared_lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
