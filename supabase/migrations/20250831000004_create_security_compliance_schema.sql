-- Security and Compliance Schema for Email Management System
-- This migration adds tables for admin authentication, audit logging, GDPR compliance, 
-- unsubscribe management, and data retention policies

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Can be UUID or 'system' or 'anonymized'
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR Consent Records Table
CREATE TABLE IF NOT EXISTS gdpr_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  legal_basis VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR Deletion Requests Table
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}'
);

-- GDPR Retention Policies Table
CREATE TABLE IF NOT EXISTS gdpr_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type VARCHAR(100) NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  auto_delete BOOLEAN DEFAULT false,
  legal_basis TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Email Preferences Table
CREATE TABLE IF NOT EXISTS user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  welcome_emails BOOLEAN DEFAULT true,
  lesson_reminders BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  all_emails BOOLEAN DEFAULT false, -- Global unsubscribe
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  resubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Unsubscribe Tokens Table
CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  email_type VARCHAR(50),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Retention Policies Table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type VARCHAR(100) NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  auto_delete BOOLEAN DEFAULT false,
  legal_basis TEXT NOT NULL,
  description TEXT,
  last_executed TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Retention Executions Log Table
CREATE TABLE IF NOT EXISTS retention_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES data_retention_policies(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  records_processed INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  details JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON admin_audit_logs(resource_id);

CREATE INDEX IF NOT EXISTS idx_gdpr_consent_user_purpose ON gdpr_consent_records(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_granted ON gdpr_consent_records(granted);

CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_user_id ON gdpr_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_token ON gdpr_deletion_requests(verification_token);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_status ON gdpr_deletion_requests(status);

CREATE INDEX IF NOT EXISTS idx_user_email_prefs_user_id ON user_email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_prefs_email ON user_email_preferences(email);

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_user_id ON unsubscribe_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_expires_at ON unsubscribe_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_used ON unsubscribe_tokens(used);

CREATE INDEX IF NOT EXISTS idx_retention_policies_data_type ON data_retention_policies(data_type);
CREATE INDEX IF NOT EXISTS idx_retention_policies_active ON data_retention_policies(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_retention_policies_next_execution ON data_retention_policies(next_execution);

CREATE INDEX IF NOT EXISTS idx_retention_executions_policy_id ON retention_executions(policy_id);
CREATE INDEX IF NOT EXISTS idx_retention_executions_executed_at ON retention_executions(executed_at);

-- Row Level Security (RLS) Policies

-- Admin Sessions: Only accessible by the session owner or system admins
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sessions are viewable by owner" ON admin_sessions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Admin sessions are insertable by owner" ON admin_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin sessions are updatable by owner" ON admin_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin Audit Logs: Only accessible by system admins
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by admins only" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Audit logs are insertable by system" ON admin_audit_logs
  FOR INSERT WITH CHECK (true); -- System can always insert audit logs

-- GDPR Consent Records: Users can view/modify their own records, admins can view all
ALTER TABLE gdpr_consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent records" ON gdpr_consent_records
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Users can insert their own consent records" ON gdpr_consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent records" ON gdpr_consent_records
  FOR UPDATE USING (auth.uid() = user_id);

-- GDPR Deletion Requests: Users can manage their own requests, admins can view all
ALTER TABLE gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests" ON gdpr_deletion_requests
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Users can create their own deletion requests" ON gdpr_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Email Preferences: Users can manage their own preferences, admins can view all
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email preferences" ON user_email_preferences
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Users can manage their own email preferences" ON user_email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Unsubscribe Tokens: Users can view their own tokens, system can create/update
ALTER TABLE unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unsubscribe tokens" ON unsubscribe_tokens
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "System can manage unsubscribe tokens" ON unsubscribe_tokens
  FOR ALL USING (true); -- System needs full access for email processing

-- Retention Policies: Only admins can access
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access retention policies" ON data_retention_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Only admins can access GDPR retention policies" ON gdpr_retention_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

CREATE POLICY "Only admins can access retention executions" ON retention_executions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM email_settings 
      WHERE setting_key = 'admin_users' 
      AND setting_value::jsonb @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
    )
  );

-- Insert default retention policies
INSERT INTO data_retention_policies (data_type, retention_days, auto_delete, legal_basis, description, is_active) VALUES
  ('email_logs', 365, true, 'Legitimate interests for service improvement', 'Production email delivery logs', true),
  ('test_emails', 30, true, 'Legitimate interests for system testing', 'Test email logs for debugging', true),
  ('audit_logs', 2555, false, 'Legal obligation for security monitoring', 'Admin audit logs for compliance (7 years)', true),
  ('unsubscribe_tokens', 90, true, 'Legitimate interests for unsubscribe processing', 'Expired unsubscribe tokens', true),
  ('admin_sessions', 30, true, 'Security requirement for session management', 'Expired admin sessions', true),
  ('template_history', 1095, false, 'Legitimate interests for version control', 'Email template version history (3 years)', true);

-- Insert default GDPR retention policies
INSERT INTO gdpr_retention_policies (data_type, retention_days, auto_delete, legal_basis, description) VALUES
  ('email_logs', 365, true, 'Legitimate interests for service improvement', 'Email delivery logs containing personal data'),
  ('test_emails', 30, true, 'Legitimate interests for system testing', 'Test emails with personal data'),
  ('audit_logs', 2555, false, 'Legal obligation for security compliance', 'Audit logs may contain personal identifiers');

-- Create function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions 
  WHERE expires_at < NOW() OR (is_active = false AND updated_at < NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically clean up expired unsubscribe tokens
CREATE OR REPLACE FUNCTION cleanup_expired_unsubscribe_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM unsubscribe_tokens 
  WHERE expires_at < NOW() OR (used = true AND used_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update retention policy next execution time
CREATE OR REPLACE FUNCTION update_retention_next_execution()
RETURNS TRIGGER AS $$
BEGIN
  -- Set next execution to 24 hours from now for active policies
  IF NEW.is_active = true THEN
    NEW.next_execution = NOW() + INTERVAL '24 hours';
  ELSE
    NEW.next_execution = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for retention policy updates
CREATE TRIGGER trigger_update_retention_next_execution
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_next_execution();

-- Create trigger for new retention policies
CREATE TRIGGER trigger_new_retention_next_execution
  BEFORE INSERT ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_next_execution();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE admin_sessions IS 'Secure session management for admin users';
COMMENT ON TABLE admin_audit_logs IS 'Comprehensive audit trail for all admin actions';
COMMENT ON TABLE gdpr_consent_records IS 'User consent tracking for GDPR compliance';
COMMENT ON TABLE gdpr_deletion_requests IS 'Right to be forgotten request tracking';
COMMENT ON TABLE user_email_preferences IS 'User email subscription preferences and unsubscribe status';
COMMENT ON TABLE unsubscribe_tokens IS 'Secure tokens for email unsubscribe links';
COMMENT ON TABLE data_retention_policies IS 'Automated data retention and purging policies';
COMMENT ON TABLE retention_executions IS 'Log of retention policy execution results';