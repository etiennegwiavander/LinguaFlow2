/*
  # Add status column to lessons table

  1. Changes
    - Add status column to lessons table for tracking lesson status
    - Set default value to 'upcoming' for new lessons
    - Add check constraint to ensure valid status values

  2. Security
    - No changes to RLS policies needed
*/

-- Add status column to lessons table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'status'
  ) THEN
    ALTER TABLE lessons ADD COLUMN status text DEFAULT 'upcoming';
    
    -- Add check constraint for valid status values
    ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
    CHECK (status IN ('upcoming', 'completed', 'cancelled'));
  END IF;
END $$;

-- Update any existing lessons to have 'upcoming' status if they don't have one
UPDATE lessons SET status = 'upcoming' WHERE status IS NULL;