-- Email Management System Schema
-- This migration creates all necessary tables for the admin email management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- SMTP Configuration Table
-- Stores encrypted SMTP settings for different email providers
CREATE TABLE email_smtp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('gmail', 'sendgrid', 'aws-ses', 'custom')),
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL CHECK (port > 0 AND port <= 65535),
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL, -- Encrypted using pgcrypto
  encryption VARCHAR(10) NOT NULL DEFAULT 'tls' CHECK (encryption IN ('tls', 'ssl', 'none')),
  is_active BOOLEAN DEFAULT false,
  last_tested TIMESTAMP WITH TIME ZONE,
  test_status VARCHAR(20) CHECK (test_status IN ('success', 'failed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active configuration at a time
  CONSTRAINT unique_active_config EXCLUDE (is_active WITH =) WHERE (is_active = true)
);

-- Email Templates Table
-- Stores email templates with version control
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('welcome', 'lesson_reminder', 'password_reset', 'custom')),
  name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique active template per type
  CONSTRAINT unique_active_template_per_type EXCLUDE (type WITH =) WHERE (is_active = true)
);

-- Email Template History Table
-- Maintains version history for rollback capability
CREATE TABLE email_template_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  placeholders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique version per template
  CONSTRAINT unique_template_version UNIQUE (template_id, version)
);

-- Email Logs Table
-- Comprehensive tracking of all email activity
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id),
  template_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_code VARCHAR(50),
  error_message TEXT,
  is_test BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Index for performance on common queries
  CONSTRAINT valid_delivery_time CHECK (delivered_at IS NULL OR delivered_at >= sent_at)
);

-- Email Settings Table
-- System-wide email configuration settings
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_email_smtp_configs_active ON email_smtp_configs(is_active) WHERE is_active = true;
CREATE INDEX idx_email_templates_type_active ON email_templates(type, is_active);
CREATE INDEX idx_email_template_history_template_id ON email_template_history(template_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_template_type ON email_logs(template_type);
CREATE INDEX idx_email_logs_is_test ON email_logs(is_test);
CREATE INDEX idx_email_settings_key ON email_settings(setting_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_email_smtp_configs_updated_at 
    BEFORE UPDATE ON email_smtp_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create template versioning trigger
CREATE OR REPLACE FUNCTION create_template_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into history when template is updated
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO email_template_history (
            template_id, 
            version, 
            subject, 
            html_content, 
            text_content, 
            placeholders,
            created_by
        ) VALUES (
            OLD.id,
            OLD.version,
            OLD.subject,
            OLD.html_content,
            OLD.text_content,
            OLD.placeholders,
            OLD.created_by
        );
        
        -- Increment version for new record
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_email_template_history 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION create_template_history();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE email_smtp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user has admin role
    -- This assumes admin users are identified by a role or specific user IDs
    -- Adjust this logic based on your admin identification system
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' = 'admin' 
            OR email IN (
                SELECT setting_value::text 
                FROM email_settings 
                WHERE setting_key = 'admin_emails'
            )
        )
    );
END;
$$ SECURITY DEFINER language 'plpgsql';

-- SMTP Configs - Admin only access
CREATE POLICY "Admin can view SMTP configs" ON email_smtp_configs
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admin can insert SMTP configs" ON email_smtp_configs
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update SMTP configs" ON email_smtp_configs
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admin can delete SMTP configs" ON email_smtp_configs
    FOR DELETE USING (is_admin_user());

-- Email Templates - Admin only access
CREATE POLICY "Admin can view email templates" ON email_templates
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admin can insert email templates" ON email_templates
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update email templates" ON email_templates
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admin can delete email templates" ON email_templates
    FOR DELETE USING (is_admin_user());

-- Email Template History - Admin only access
CREATE POLICY "Admin can view template history" ON email_template_history
    FOR SELECT USING (is_admin_user());

-- Email Logs - Admin can view all, system can insert
CREATE POLICY "Admin can view email logs" ON email_logs
    FOR SELECT USING (is_admin_user());

CREATE POLICY "System can insert email logs" ON email_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log emails

CREATE POLICY "Admin can update email logs" ON email_logs
    FOR UPDATE USING (is_admin_user());

-- Email Settings - Admin only access
CREATE POLICY "Admin can view email settings" ON email_settings
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admin can insert email settings" ON email_settings
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update email settings" ON email_settings
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admin can delete email settings" ON email_settings
    FOR DELETE USING (is_admin_user());

-- Insert default email settings
INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('max_retry_attempts', '3', 'Maximum number of retry attempts for failed emails'),
('retry_delay_minutes', '5', 'Delay in minutes between retry attempts'),
('bounce_rate_threshold', '0.05', 'Bounce rate threshold for alerts (5%)'),
('daily_email_limit', '1000', 'Maximum emails per day'),
('admin_emails', '["admin@example.com"]', 'List of admin email addresses'),
('email_retention_days', '90', 'Number of days to retain email logs'),
('enable_email_notifications', 'true', 'Enable/disable email notifications system-wide');

-- Create default welcome email template
INSERT INTO email_templates (
    type, 
    name, 
    subject, 
    html_content, 
    text_content, 
    placeholders,
    created_by
) VALUES (
    'welcome',
    'Default Welcome Email',
    'Welcome to {{app_name}}!',
    '<html><body><h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{app_name}}. We''re excited to have you on board!</p><p>Best regards,<br>The {{app_name}} Team</p></body></html>',
    'Welcome {{user_name}}! Thank you for joining {{app_name}}. We''re excited to have you on board! Best regards, The {{app_name}} Team',
    '["user_name", "app_name", "user_email"]'::jsonb,
    (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
);

-- Add comments for documentation
COMMENT ON TABLE email_smtp_configs IS 'Stores SMTP configuration settings for different email providers';
COMMENT ON TABLE email_templates IS 'Email templates with version control and placeholder support';
COMMENT ON TABLE email_template_history IS 'Version history for email templates to enable rollback';
COMMENT ON TABLE email_logs IS 'Comprehensive logging of all email activity and delivery status';
COMMENT ON TABLE email_settings IS 'System-wide email configuration settings';

COMMENT ON COLUMN email_smtp_configs.password_encrypted IS 'SMTP password encrypted using pgcrypto functions';
COMMENT ON COLUMN email_templates.placeholders IS 'JSON array of placeholder names used in the template';
COMMENT ON COLUMN email_logs.metadata IS 'Additional metadata about the email (headers, tracking info, etc.)';