-- Migration: Create lesson history and progress tracking tables
-- Date: 2025-12-19
-- Purpose: Move lesson history from localStorage to database for cross-device sync

-- Create lesson sessions table for comprehensive lesson tracking
CREATE TABLE IF NOT EXISTS lesson_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  lesson_template_id UUID REFERENCES lesson_templates(id) ON DELETE SET NULL,
  
  -- Sub-topic information
  sub_topic_id TEXT NOT NULL,
  sub_topic_data JSONB NOT NULL DEFAULT '{}',
  
  -- Lesson content
  interactive_content JSONB DEFAULT '{}',
  lesson_materials JSONB DEFAULT '{}',
  
  -- Session metadata
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'cancelled')),
  duration_minutes INTEGER DEFAULT NULL,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student progress table for granular progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  
  -- Progress details
  sub_topic_id TEXT NOT NULL,
  sub_topic_title TEXT,
  sub_topic_category TEXT,
  sub_topic_level TEXT,
  
  -- Completion tracking
  completion_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lesson_session_id UUID REFERENCES lesson_sessions(id) ON DELETE SET NULL,
  
  -- Progress metadata
  score INTEGER DEFAULT NULL CHECK (score >= 0 AND score <= 100),
  notes TEXT DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique progress per student per sub-topic
  UNIQUE(student_id, sub_topic_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_student_id ON lesson_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_tutor_id ON lesson_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_completed_at ON lesson_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_sub_topic_id ON lesson_sessions(sub_topic_id);

CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_tutor_id ON student_progress(tutor_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_completion_date ON student_progress(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_progress_sub_topic_id ON student_progress(sub_topic_id);

-- Enable Row Level Security
ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_sessions
CREATE POLICY "Users can view their own lesson sessions" ON lesson_sessions
  FOR SELECT USING (
    auth.uid() = lesson_sessions.tutor_id OR
    lesson_sessions.student_id IN (
      SELECT s.id FROM students s WHERE s.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert lesson sessions for their students" ON lesson_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = lesson_sessions.tutor_id AND
    lesson_sessions.student_id IN (
      SELECT s.id FROM students s WHERE s.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update their lesson sessions" ON lesson_sessions
  FOR UPDATE USING (
    auth.uid() = lesson_sessions.tutor_id
  );

-- RLS Policies for student_progress
CREATE POLICY "Users can view their own progress" ON student_progress
  FOR SELECT USING (
    auth.uid() = student_progress.tutor_id OR
    student_progress.student_id IN (
      SELECT s.id FROM students s WHERE s.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert progress for their students" ON student_progress
  FOR INSERT WITH CHECK (
    auth.uid() = student_progress.tutor_id AND
    student_progress.student_id IN (
      SELECT s.id FROM students s WHERE s.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update progress for their students" ON student_progress
  FOR UPDATE USING (
    auth.uid() = student_progress.tutor_id
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_lesson_sessions_updated_at 
  BEFORE UPDATE ON lesson_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at 
  BEFORE UPDATE ON student_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE lesson_sessions IS 'Comprehensive tracking of completed lesson sessions with full context';
COMMENT ON TABLE student_progress IS 'Granular student progress tracking for individual sub-topics';
COMMENT ON COLUMN lesson_sessions.sub_topic_data IS 'Complete sub-topic information including title, description, category, level';
COMMENT ON COLUMN lesson_sessions.interactive_content IS 'Generated interactive lesson content and materials';
COMMENT ON COLUMN student_progress.sub_topic_id IS 'Unique identifier for the completed sub-topic';