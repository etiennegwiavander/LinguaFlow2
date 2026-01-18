-- Add interactive_content_snapshot column to shared_lessons table
-- This stores a snapshot of the lesson content at the time of sharing
-- so that shared links always show the correct content even if the parent lesson is updated

ALTER TABLE shared_lessons 
ADD COLUMN IF NOT EXISTS interactive_content_snapshot JSONB;

-- Add comment explaining the purpose
COMMENT ON COLUMN shared_lessons.interactive_content_snapshot IS 
'Snapshot of the interactive lesson content at the time of sharing. This ensures shared links always show the correct content even if the parent lesson is regenerated with different content.';
