-- Add missing timestamp columns to email_logs table

-- Add created_at column
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add updated_at column
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add sender_email column (was in original design but missing)
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS sender_email text;

-- Add smtp_config_id column (was in original design but missing)
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS smtp_config_id uuid REFERENCES email_smtp_configs(id) ON DELETE SET NULL;

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;

CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_updated_at ON email_logs(updated_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_smtp_config_id ON email_logs(smtp_config_id);

-- Add comments
COMMENT ON COLUMN email_logs.created_at IS 'When the email log record was created';
COMMENT ON COLUMN email_logs.updated_at IS 'When the email log record was last updated';
COMMENT ON COLUMN email_logs.sender_email IS 'Email address of the sender';
COMMENT ON COLUMN email_logs.smtp_config_id IS 'Reference to the SMTP configuration used';
