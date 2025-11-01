-- Add missing columns to email_smtp_configs table
ALTER TABLE email_smtp_configs 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS from_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS from_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Update provider constraint to include 'resend'
ALTER TABLE email_smtp_configs 
DROP CONSTRAINT IF EXISTS email_smtp_configs_provider_check;

ALTER TABLE email_smtp_configs 
ADD CONSTRAINT email_smtp_configs_provider_check 
CHECK (provider IN ('gmail', 'sendgrid', 'aws-ses', 'ses', 'resend', 'mailgun', 'smtp', 'custom'));

-- Add missing columns to email_templates table
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for from_email lookups
CREATE INDEX IF NOT EXISTS idx_email_smtp_configs_from_email ON email_smtp_configs(from_email);

-- Create index for default configs
CREATE INDEX IF NOT EXISTS idx_email_smtp_configs_default ON email_smtp_configs(is_default) WHERE is_default = true;

-- Create index for default templates
CREATE INDEX IF NOT EXISTS idx_email_templates_default ON email_templates(is_default) WHERE is_default = true;
