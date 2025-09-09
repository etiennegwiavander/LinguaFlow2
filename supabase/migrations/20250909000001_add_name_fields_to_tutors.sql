-- Add first_name and last_name fields to tutors table
-- This fixes the "record 'new' has no field 'first_name'" error

ALTER TABLE tutors 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Update existing records to split the name field if it exists
UPDATE tutors 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 
    THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 
    THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE name IS NOT NULL;

-- Create index for better performance on name searches
CREATE INDEX IF NOT EXISTS idx_tutors_first_name ON tutors(first_name);
CREATE INDEX IF NOT EXISTS idx_tutors_last_name ON tutors(last_name);