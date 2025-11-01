-- Update provider constraint to include all supported providers
ALTER TABLE email_smtp_configs 
DROP CONSTRAINT IF EXISTS email_smtp_configs_provider_check;

ALTER TABLE email_smtp_configs 
ADD CONSTRAINT email_smtp_configs_provider_check 
CHECK (provider IN ('gmail', 'sendgrid', 'aws-ses', 'ses', 'resend', 'mailgun', 'smtp', 'custom'));
