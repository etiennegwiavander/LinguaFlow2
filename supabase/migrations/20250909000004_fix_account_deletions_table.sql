-- Fix account_deletions table by adding missing columns
-- This fixes the "column account_deletions.recovered_at does not exist" error

-- Add missing columns to account_deletions table
ALTER TABLE account_deletions 
ADD COLUMN IF NOT EXISTS recovered_at timestamptz,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Create index for better performance on recovery queries
CREATE INDEX IF NOT EXISTS idx_account_deletions_recovered_at ON account_deletions(recovered_at);
CREATE INDEX IF NOT EXISTS idx_account_deletions_deletion_timestamp ON account_deletions(deletion_timestamp);

-- Update any existing records to have proper structure
-- (This is safe as it only affects existing incomplete records)
UPDATE account_deletions 
SET recovered_at = NULL 
WHERE recovered_at IS NULL;