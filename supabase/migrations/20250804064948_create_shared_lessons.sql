-- Create shared_lessons table for lesson sharing functionality
CREATE TABLE IF NOT EXISTS shared_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    lesson_title TEXT NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_lessons_lesson_id ON shared_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_shared_lessons_expires_at ON shared_lessons(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_lessons_is_active ON shared_lessons(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE shared_lessons ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read active, non-expired shared lessons
CREATE POLICY "Anyone can view active shared lessons" ON shared_lessons
    FOR SELECT USING (
        is_active = true 
        AND expires_at > NOW()
    );

-- Create policy to allow tutors to create shared lessons for their own lessons
CREATE POLICY "Tutors can create shared lessons for their lessons" ON shared_lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = lesson_id 
            AND lessons.tutor_id = auth.uid()
        )
    );

-- Create policy to allow tutors to update their own shared lessons
CREATE POLICY "Tutors can update their own shared lessons" ON shared_lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = lesson_id 
            AND lessons.tutor_id = auth.uid()
        )
    );

-- Create policy to allow tutors to delete their own shared lessons
CREATE POLICY "Tutors can delete their own shared lessons" ON shared_lessons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = lesson_id 
            AND lessons.tutor_id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_lessons_updated_at
    BEFORE UPDATE ON shared_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_lessons_updated_at();