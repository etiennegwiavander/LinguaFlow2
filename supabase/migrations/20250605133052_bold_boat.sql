/*
  # Initial Schema Setup

  1. New Tables
    - `tutors`
      - `id` (uuid, primary key) - matches Supabase auth.users id
      - `created_at` (timestamp)
      - `email` (text, unique)
      - `name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `is_admin` (boolean)
    
    - `students`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `name` (text)
      - `avatar_url` (text, nullable)
      - `target_language` (text)
      - `level` (text)
      - `tutor_id` (uuid, references tutors)
      - `end_goals` (text, nullable)
      - `grammar_weaknesses` (text, nullable)
      - `vocabulary_gaps` (text, nullable)
      - `pronunciation_challenges` (text, nullable)
      - `conversational_fluency_barriers` (text, nullable)
      - `learning_styles` (text[], nullable)
      - `notes` (text, nullable)
    
    - `lessons`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `student_id` (uuid, references students)
      - `tutor_id` (uuid, references tutors)
      - `date` (timestamp)
      - `status` (text)
      - `materials` (text[])
      - `notes` (text, nullable)
      - `previous_challenges` (text[], nullable)
      - `generated_lessons` (text[], nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  is_admin boolean DEFAULT false
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

-- Tutors can read and update their own data
CREATE POLICY "Tutors can read own data"
  ON tutors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Tutors can update own data"
  ON tutors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  avatar_url text,
  target_language text NOT NULL,
  level text NOT NULL,
  tutor_id uuid REFERENCES tutors(id) NOT NULL,
  end_goals text,
  grammar_weaknesses text,
  vocabulary_gaps text,
  pronunciation_challenges text,
  conversational_fluency_barriers text,
  learning_styles text[],
  notes text
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Tutors can CRUD their own students
CREATE POLICY "Tutors can CRUD own students"
  ON students
  FOR ALL
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  student_id uuid REFERENCES students(id) NOT NULL,
  tutor_id uuid REFERENCES tutors(id) NOT NULL,
  date timestamptz NOT NULL,
  status text NOT NULL,
  materials text[] NOT NULL DEFAULT '{}',
  notes text,
  previous_challenges text[],
  generated_lessons text[]
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Tutors can CRUD their own lessons
CREATE POLICY "Tutors can CRUD own lessons"
  ON lessons
  FOR ALL
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);