/*
  # Schedule Automated Lesson Reminders

  1. Setup
    - Add cron job to schedule lesson reminders every 5 minutes
    - The job will call the schedule-lesson-reminders Edge Function

  2. Security
    - Uses service role key for authentication
    - Scheduled task runs with appropriate permissions
*/

-- Schedule the lesson reminder task to run every 5 minutes
-- This will check for lessons that need reminders and send them
SELECT cron.schedule(
  'automated-lesson-reminders',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/schedule-lesson-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'timestamp', extract(epoch from now())
      )
    );
  $$
);

-- Create a function to manually trigger lesson reminder scheduling (for testing)
CREATE OR REPLACE FUNCTION trigger_lesson_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/schedule-lesson-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'timestamp', extract(epoch from now()),
        'manual_trigger', true
      )
    ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the function to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION trigger_lesson_reminders() TO authenticated;

-- Update the cron job status view to include lesson reminders
DROP VIEW IF EXISTS cron_job_status;
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname IN ('automated-lesson-generation', 'automated-lesson-reminders');

-- Grant select permission on the view to authenticated users
GRANT SELECT ON cron_job_status TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_lesson_reminders() IS 'Manually trigger the automated lesson reminder scheduling process for testing purposes';

-- Insert default email settings for lesson reminders if not exists
INSERT INTO email_settings (setting_key, setting_value, updated_by)
SELECT 
  'lesson_reminder_timing',
  jsonb_build_object('minutes', 15, 'enabled', true),
  (SELECT id FROM tutors WHERE is_admin = true LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM email_settings WHERE setting_key = 'lesson_reminder_timing'
);

-- Insert default lesson reminder email template if not exists
INSERT INTO email_templates (type, name, subject, html_content, text_content, is_active, created_by)
SELECT 
  'lesson_reminder',
  'Default Lesson Reminder',
  'Reminder: {{lesson_title}} with {{tutor_name}}',
  '<html><body><h2>Lesson Reminder</h2><p>Hi {{user_name}},</p><p>This is a reminder that your lesson "{{lesson_title}}" with {{tutor_name}} is scheduled for:</p><ul><li><strong>Date:</strong> {{lesson_date}}</li><li><strong>Time:</strong> {{lesson_time}}</li></ul><p><a href="{{lesson_url}}">Go to Dashboard</a> | <a href="{{calendar_url}}">View Calendar</a></p><p>See you soon!</p></body></html>',
  'Hi {{user_name}}, This is a reminder that your lesson "{{lesson_title}}" with {{tutor_name}} is scheduled for {{lesson_date}} at {{lesson_time}}. Go to your dashboard: {{lesson_url}}',
  true,
  (SELECT id FROM tutors WHERE is_admin = true LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE type = 'lesson_reminder' AND is_active = true
);

-- Insert default password reset email template if not exists
INSERT INTO email_templates (type, name, subject, html_content, text_content, is_active, created_by)
SELECT 
  'password_reset',
  'Default Password Reset',
  'Reset Your Password - LinguaFlow',
  '<html><body><h2>Password Reset Request</h2><p>Hi {{user_name}},</p><p>We received a request to reset your password. Click the link below to reset it:</p><p><a href="{{reset_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p><p>This link will expire in {{expiry_time}}.</p><p>If you didn''t request this, please ignore this email or contact support at {{support_email}}.</p></body></html>',
  'Hi {{user_name}}, We received a request to reset your password. Visit this link to reset it: {{reset_url}} This link will expire in {{expiry_time}}. If you didn''t request this, please contact support at {{support_email}}.',
  true,
  (SELECT id FROM tutors WHERE is_admin = true LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE type = 'password_reset' AND is_active = true
);