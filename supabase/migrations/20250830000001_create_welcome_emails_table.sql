-- Create welcome_emails table to track sent welcome emails
CREATE TABLE IF NOT EXISTS welcome_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'tutor' CHECK (user_type = 'tutor'),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_welcome_emails_email ON welcome_emails(email);
CREATE INDEX IF NOT EXISTS idx_welcome_emails_user_type ON welcome_emails(user_type);
CREATE INDEX IF NOT EXISTS idx_welcome_emails_sent_at ON welcome_emails(sent_at);

-- Add RLS (Row Level Security)
ALTER TABLE welcome_emails ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (for the function)
CREATE POLICY "Service role can manage welcome emails" ON welcome_emails
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to view their own welcome emails
CREATE POLICY "Users can view their own welcome emails" ON welcome_emails
    FOR SELECT USING (auth.email() = email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_welcome_emails_updated_at 
    BEFORE UPDATE ON welcome_emails 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();