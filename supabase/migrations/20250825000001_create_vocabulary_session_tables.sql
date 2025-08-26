-- Create vocabulary_sessions table
CREATE TABLE IF NOT EXISTS vocabulary_sessions (
    id TEXT PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_position INTEGER NOT NULL DEFAULT 0,
    words JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vocabulary_progress table
CREATE TABLE IF NOT EXISTS vocabulary_progress (
    student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    last_session_id TEXT,
    last_position INTEGER NOT NULL DEFAULT 0,
    last_access_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_words_studied INTEGER NOT NULL DEFAULT 0,
    session_duration INTEGER NOT NULL DEFAULT 0, -- in milliseconds
    seen_words JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_student_id ON vocabulary_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sessions_is_active ON vocabulary_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_last_access_time ON vocabulary_progress(last_access_time);

-- Add RLS policies
ALTER TABLE vocabulary_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_progress ENABLE ROW LEVEL SECURITY;

-- Policy for vocabulary_sessions: users can only access sessions for their students
CREATE POLICY "Users can access vocabulary sessions for their students" ON vocabulary_sessions
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE tutor_id = auth.uid()
        )
    );

-- Policy for vocabulary_progress: users can only access progress for their students
CREATE POLICY "Users can access vocabulary progress for their students" ON vocabulary_progress
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE tutor_id = auth.uid()
        )
    );

-- Add updated_at trigger for vocabulary_sessions
CREATE OR REPLACE FUNCTION update_vocabulary_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocabulary_sessions_updated_at
    BEFORE UPDATE ON vocabulary_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_vocabulary_sessions_updated_at();

-- Add updated_at trigger for vocabulary_progress
CREATE OR REPLACE FUNCTION update_vocabulary_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocabulary_progress_updated_at
    BEFORE UPDATE ON vocabulary_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_vocabulary_progress_updated_at();