-- Disable the welcome email trigger that requires net extension
-- This fixes the "schema 'net' does not exist" error during user registration

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS trigger_send_welcome_email_tutors ON tutors;
DROP FUNCTION IF EXISTS send_welcome_email_trigger();

-- Create a simple logging function instead
CREATE OR REPLACE FUNCTION log_new_tutor()
RETURNS TRIGGER AS $$
BEGIN
    -- Just log that a new tutor was created
    -- Welcome emails will be handled by the application layer
    RAISE NOTICE 'New tutor created: % (%)', NEW.email, NEW.id;
    
    -- Insert a record to track that welcome email should be sent
    INSERT INTO welcome_emails (email, user_type, subject, content, status, created_at)
    VALUES (NEW.email, 'tutor', 'Welcome to LinguaFlow', 'Welcome email pending', 'pending', NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simple trigger that doesn't use net extension
CREATE TRIGGER trigger_log_new_tutor
    AFTER INSERT ON tutors
    FOR EACH ROW
    EXECUTE FUNCTION log_new_tutor();