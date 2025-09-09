-- Fix the welcome email trigger to use correct column names
-- This addresses the user_id column issue

-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS trigger_log_new_tutor ON tutors;
DROP FUNCTION IF EXISTS log_new_tutor();

CREATE OR REPLACE FUNCTION log_new_tutor()
RETURNS TRIGGER AS $$
BEGIN
    -- Just log that a new tutor was created
    -- Welcome emails will be handled by the application layer
    RAISE NOTICE 'New tutor created: % (%)', NEW.email, NEW.id;
    
    -- Insert a record to track that welcome email should be sent
    -- Use the correct column structure for welcome_emails table
    INSERT INTO welcome_emails (email, user_type, subject, content, status, created_at)
    VALUES (
        NEW.email, 
        'tutor', 
        'Welcome to LinguaFlow', 
        'Welcome email pending - will be sent by application', 
        'pending', 
        NOW()
    )
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE NOTICE 'Welcome email logging failed for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_log_new_tutor
    AFTER INSERT ON tutors
    FOR EACH ROW
    EXECUTE FUNCTION log_new_tutor();