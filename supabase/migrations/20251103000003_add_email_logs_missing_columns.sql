-- Add missing columns to email_logs table for full functionality

-- Add scheduled_for column for scheduled emails
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Add is_test column to distinguish test emails
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS is_test boolean DEFAULT false;

-- Add error_code column for better error tracking
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS error_code text;

-- Add index for scheduled emails
CREATE INDEX IF NOT EXISTS idx_email_logs_scheduled_for ON email_logs(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Add index for test emails
CREATE INDEX IF NOT EXISTS idx_email_logs_is_test ON email_logs(is_test);

-- Add comment
COMMENT ON COLUMN email_logs.scheduled_for IS 'When the email is scheduled to be sent (NULL for immediate sending)';
COMMENT ON COLUMN email_logs.is_test IS 'Whether this is a test email';
COMMENT ON COLUMN email_logs.error_code IS 'Error code if email failed to send';
