-- Add age_group field to students table for age-appropriate lesson template selection
-- This will help prevent inappropriate template selection (e.g., "English for Kids" for adults)

-- Add age_group column with constraint
ALTER TABLE students 
ADD COLUMN age_group text CHECK (age_group IN ('kid', 'teenager', 'adult', 'middle_aged_adult', 'senior'));

-- Add comment to explain the age groups
COMMENT ON COLUMN students.age_group IS 'Age group for appropriate lesson template selection: kid (4-8), teenager (13-17), adult (18-39), middle_aged_adult (40-64), senior (65+)';

-- Update existing students with default age group (adult) for now
-- In production, this should be collected during profile creation/editing
UPDATE students 
SET age_group = 'adult' 
WHERE age_group IS NULL;

-- Make age_group NOT NULL after setting defaults
ALTER TABLE students 
ALTER COLUMN age_group SET NOT NULL;