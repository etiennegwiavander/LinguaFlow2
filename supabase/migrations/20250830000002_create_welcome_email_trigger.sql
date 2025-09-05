-- Create a trigger function to automatically send welcome emails when users sign up
CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_type TEXT;
BEGIN
    -- Get the user's email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = NEW.id;
    
    -- LinguaFlow is for tutors only
    user_type := 'tutor';
    
    -- Call the welcome email function
    PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
        ),
        body := jsonb_build_object(
            'email', user_email,
            'firstName', COALESCE(NEW.first_name, ''),
            'lastName', COALESCE(NEW.last_name, '')
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tutors table
DROP TRIGGER IF EXISTS trigger_send_welcome_email_tutors ON tutors;
CREATE TRIGGER trigger_send_welcome_email_tutors
    AFTER INSERT ON tutors
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_email_trigger();

-- Note: Only tutors get welcome emails since LinguaFlow is for one-on-one language tutors