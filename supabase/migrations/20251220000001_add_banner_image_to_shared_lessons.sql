-- Add banner_image_url to shared_lessons table for Open Graph previews
-- This allows shared lesson links to display the actual lesson banner image

ALTER TABLE shared_lessons 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Add lesson_category and lesson_level for better metadata
ALTER TABLE shared_lessons 
ADD COLUMN IF NOT EXISTS lesson_category TEXT,
ADD COLUMN IF NOT EXISTS lesson_level TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_lessons_banner_image ON shared_lessons(banner_image_url);

-- Add comment
COMMENT ON COLUMN shared_lessons.banner_image_url IS 'URL of the lesson banner image for Open Graph previews';
COMMENT ON COLUMN shared_lessons.lesson_category IS 'Lesson category (e.g., Grammar, Conversation) for metadata';
COMMENT ON COLUMN shared_lessons.lesson_level IS 'Lesson level (e.g., A1, B2) for metadata';
