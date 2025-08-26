-- Add total_sessions field to vocabulary_progress table
ALTER TABLE vocabulary_progress 
ADD COLUMN IF NOT EXISTS total_sessions INTEGER NOT NULL DEFAULT 0;

-- Update existing records to have correct session counts
UPDATE vocabulary_progress 
SET total_sessions = (
    SELECT COUNT(*) 
    FROM vocabulary_sessions 
    WHERE vocabulary_sessions.student_id = vocabulary_progress.student_id
)
WHERE total_sessions = 0;