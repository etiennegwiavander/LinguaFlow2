-- Create vocabulary_history table for comprehensive tracking
CREATE TABLE IF NOT EXISTS vocabulary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    times_seen INTEGER NOT NULL DEFAULT 1,
    difficulty_level TEXT NOT NULL,
    mastery_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
    semantic_category TEXT,
    word_family TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, word)
);

-- Create vocabulary_semantic_relationships table for word families and concepts
CREATE TABLE IF NOT EXISTS vocabulary_semantic_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    related_word TEXT NOT NULL,
    relationship_type TEXT NOT NULL, -- 'synonym', 'antonym', 'family', 'concept', 'theme'
    strength DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- relationship strength 0.0 to 1.0
    difficulty_level TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(word, related_word, relationship_type)
);

-- Create vocabulary_generation_patterns table for adaptive difficulty
CREATE TABLE IF NOT EXISTS vocabulary_generation_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    difficulty_level TEXT NOT NULL,
    semantic_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    word_families JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_velocity DECIMAL(5,2) DEFAULT 1.0, -- words per session
    success_rate DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    preferred_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
    avoided_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, difficulty_level)
);

-- Create vocabulary_expansion_queue table for intelligent progression
CREATE TABLE IF NOT EXISTS vocabulary_expansion_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    base_word TEXT NOT NULL,
    expansion_words JSONB NOT NULL DEFAULT '[]'::jsonb,
    expansion_type TEXT NOT NULL, -- 'semantic', 'thematic', 'difficulty', 'family'
    priority_score DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_history_student_id ON vocabulary_history(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_history_word ON vocabulary_history(word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_history_difficulty ON vocabulary_history(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_history_mastery ON vocabulary_history(mastery_score);
CREATE INDEX IF NOT EXISTS idx_vocabulary_history_last_seen ON vocabulary_history(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_vocabulary_semantic_word ON vocabulary_semantic_relationships(word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_semantic_related ON vocabulary_semantic_relationships(related_word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_semantic_type ON vocabulary_semantic_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_vocabulary_semantic_difficulty ON vocabulary_semantic_relationships(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_vocabulary_patterns_student ON vocabulary_generation_patterns(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_patterns_difficulty ON vocabulary_generation_patterns(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_vocabulary_expansion_student ON vocabulary_expansion_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_expansion_active ON vocabulary_expansion_queue(is_active);
CREATE INDEX IF NOT EXISTS idx_vocabulary_expansion_priority ON vocabulary_expansion_queue(priority_score);

-- Enable RLS
ALTER TABLE vocabulary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_semantic_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_generation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_expansion_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access vocabulary history for their students" ON vocabulary_history
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can read semantic relationships" ON vocabulary_semantic_relationships
    FOR SELECT USING (true);

CREATE POLICY "Users can access generation patterns for their students" ON vocabulary_generation_patterns
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE tutor_id = auth.uid()
        )
    );

CREATE POLICY "Users can access expansion queue for their students" ON vocabulary_expansion_queue
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE tutor_id = auth.uid()
        )
    );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_vocabulary_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocabulary_history_updated_at
    BEFORE UPDATE ON vocabulary_history
    FOR EACH ROW
    EXECUTE FUNCTION update_vocabulary_history_updated_at();

CREATE OR REPLACE FUNCTION update_vocabulary_generation_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocabulary_generation_patterns_updated_at
    BEFORE UPDATE ON vocabulary_generation_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_vocabulary_generation_patterns_updated_at();

CREATE OR REPLACE FUNCTION update_vocabulary_expansion_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vocabulary_expansion_queue_updated_at
    BEFORE UPDATE ON vocabulary_expansion_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_vocabulary_expansion_queue_updated_at();

-- Insert initial semantic relationships data
INSERT INTO vocabulary_semantic_relationships (word, related_word, relationship_type, strength, difficulty_level) VALUES
-- A1 Level Family Relationships
('family', 'mother', 'family', 1.0, 'A1'),
('family', 'father', 'family', 1.0, 'A1'),
('family', 'sister', 'family', 1.0, 'A1'),
('family', 'brother', 'family', 1.0, 'A1'),
('mother', 'father', 'family', 0.9, 'A1'),
('sister', 'brother', 'family', 0.9, 'A1'),

-- A1 Level Basic Actions
('eat', 'drink', 'concept', 0.8, 'A1'),
('eat', 'food', 'concept', 1.0, 'A1'),
('drink', 'water', 'concept', 1.0, 'A1'),
('go', 'come', 'antonym', 1.0, 'A1'),
('big', 'small', 'antonym', 1.0, 'A1'),
('good', 'bad', 'antonym', 1.0, 'A1'),
('happy', 'sad', 'antonym', 1.0, 'A1'),

-- A2 Level Technology
('computer', 'internet', 'concept', 0.9, 'A2'),
('computer', 'email', 'concept', 0.8, 'A2'),
('phone', 'email', 'concept', 0.7, 'A2'),
('website', 'internet', 'concept', 1.0, 'A2'),

-- A2 Level Travel
('travel', 'hotel', 'concept', 0.9, 'A2'),
('travel', 'airport', 'concept', 0.9, 'A2'),
('hotel', 'vacation', 'concept', 0.8, 'A2'),
('ticket', 'airport', 'concept', 0.9, 'A2'),
('passport', 'travel', 'concept', 1.0, 'A2'),

-- B1 Level Abstract Concepts
('environment', 'pollution', 'concept', 1.0, 'B1'),
('technology', 'innovation', 'concept', 0.9, 'B1'),
('education', 'knowledge', 'concept', 1.0, 'B1'),
('opportunity', 'challenge', 'concept', 0.8, 'B1'),
('achieve', 'succeed', 'synonym', 0.9, 'B1'),
('improve', 'develop', 'synonym', 0.8, 'B1'),

-- B2 Level Complex Concepts
('sustainability', 'environment', 'concept', 1.0, 'B2'),
('globalization', 'economy', 'concept', 0.9, 'B2'),
('democracy', 'government', 'concept', 1.0, 'B2'),
('sophisticated', 'complex', 'synonym', 0.9, 'B2'),
('comprehensive', 'complete', 'synonym', 0.8, 'B2'),
('establish', 'create', 'synonym', 0.8, 'B2'),
('implement', 'execute', 'synonym', 0.9, 'B2'),

-- C1 Level Advanced Concepts
('paradigm', 'framework', 'synonym', 0.9, 'C1'),
('ubiquitous', 'everywhere', 'synonym', 1.0, 'C1'),
('meticulous', 'careful', 'synonym', 0.8, 'C1'),
('perpetuate', 'continue', 'synonym', 0.8, 'C1'),
('mitigate', 'reduce', 'synonym', 0.9, 'C1'),

-- C2 Level Sophisticated Concepts
('epistemology', 'knowledge', 'concept', 1.0, 'C2'),
('perspicacious', 'insightful', 'synonym', 0.9, 'C2'),
('quintessential', 'perfect', 'synonym', 0.8, 'C2'),
('extrapolate', 'extend', 'synonym', 0.9, 'C2')

ON CONFLICT (word, related_word, relationship_type) DO NOTHING;