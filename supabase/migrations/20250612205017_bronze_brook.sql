/*
  # Create lesson_templates table

  1. New Tables
    - `lesson_templates`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `category` (text, not null)
      - `level` (text, not null)
      - `template_json` (jsonb, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `lesson_templates` table
    - Add policy for authenticated users to read templates

  3. Triggers
    - Add trigger to update `updated_at` timestamp
*/

CREATE TABLE IF NOT EXISTS lesson_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  level text NOT NULL,
  template_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE lesson_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read lesson templates
CREATE POLICY "Authenticated users can read lesson templates"
  ON lesson_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_templates_category ON lesson_templates(category);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_level ON lesson_templates(level);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_is_active ON lesson_templates(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_lesson_templates_updated_at
    BEFORE UPDATE ON lesson_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();