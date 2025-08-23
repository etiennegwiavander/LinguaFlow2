-- Create discussion_questions table for storing questions related to discussion topics
CREATE TABLE IF NOT EXISTS discussion_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES discussion_topics(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_order integer NOT NULL,
  difficulty_level text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discussion_questions_topic_id ON discussion_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_discussion_questions_order ON discussion_questions(topic_id, question_order);
CREATE INDEX IF NOT EXISTS idx_discussion_questions_difficulty ON discussion_questions(difficulty_level);

-- Create unique constraint to prevent duplicate question orders within a topic
CREATE UNIQUE INDEX IF NOT EXISTS idx_discussion_questions_topic_order_unique 
  ON discussion_questions(topic_id, question_order);

-- Enable Row Level Security
ALTER TABLE discussion_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discussion_questions
-- Questions inherit access control from their parent topic
CREATE POLICY "Tutors can view questions for their discussion topics" ON discussion_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discussion_topics dt 
      WHERE dt.id = discussion_questions.topic_id 
      AND dt.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert questions for their discussion topics" ON discussion_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discussion_topics dt 
      WHERE dt.id = discussion_questions.topic_id 
      AND dt.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update questions for their discussion topics" ON discussion_questions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discussion_topics dt 
      WHERE dt.id = discussion_questions.topic_id 
      AND dt.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discussion_topics dt 
      WHERE dt.id = discussion_questions.topic_id 
      AND dt.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can delete questions for their discussion topics" ON discussion_questions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discussion_topics dt 
      WHERE dt.id = discussion_questions.topic_id 
      AND dt.tutor_id = auth.uid()
    )
  );