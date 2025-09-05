-- Create password reset tokens table for custom password reset flow
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE UNIQUE,
  welcome_emails BOOLEAN DEFAULT TRUE,
  lesson_reminders BOOLEAN DEFAULT TRUE,
  password_reset_emails BOOLEAN DEFAULT TRUE,
  custom_emails BOOLEAN DEFAULT TRUE,
  reminder_timing_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user preferences
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Enable RLS on both tables
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for password_reset_tokens (admin only)
CREATE POLICY "Admin can manage password reset tokens" ON password_reset_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE tutors.id = auth.uid() 
      AND tutors.is_admin = true
    )
  );

-- RLS policies for user_notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON user_notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences" ON user_notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all notification preferences" ON user_notification_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE tutors.id = auth.uid() 
      AND tutors.is_admin = true
    )
  );

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-password-tokens', '0 2 * * *', 'SELECT cleanup_expired_password_reset_tokens();');