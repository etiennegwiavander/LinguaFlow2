-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create discussion_topics table for storing discussion topics
CREATE TABLE IF NOT EXISTS discussion_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom',
  level text NOT NULL,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discussion_topics_student_id ON discussion_topics(student_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_tutor_id ON discussion_topics(tutor_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_level ON discussion_topics(level);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_category ON discussion_topics(category);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_is_custom ON discussion_topics(is_custom);

-- Enable Row Level Security
ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discussion_topics
CREATE POLICY "Tutors can view their students' discussion topics" ON discussion_topics
  FOR SELECT TO authenticated
  USING (tutor_id = auth.uid());

CREATE POLICY "Tutors can insert discussion topics for their students" ON discussion_topics
  FOR INSERT TO authenticated
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can update their students' discussion topics" ON discussion_topics
  FOR UPDATE TO authenticated
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can delete their students' discussion topics" ON discussion_topics
  FOR DELETE TO authenticated
  USING (tutor_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_discussion_topics_updated_at 
    BEFORE UPDATE ON discussion_topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();