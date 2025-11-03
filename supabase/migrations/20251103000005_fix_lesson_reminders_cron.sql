/*
  # Fix Lesson Reminders Cron Job

  1. Changes
    - Remove the old cron job that uses net.http_post (requires pg_net extension)
    - Create a new approach using pg_cron with a database function
    - The function will be called by an external scheduler or webhook

  2. Notes
    - Since pg_net extension is not available, we'll use Supabase's webhook approach
    - The cron job will need to be configured in Supabase Dashboard under Database > Cron Jobs
*/

-- Drop the old cron job that uses net.http_post
SELECT cron.unschedule('automated-lesson-reminders');

-- Drop the old manual trigger function
DROP FUNCTION IF EXISTS trigger_lesson_reminders();

-- Create a simpler function that marks lessons needing reminders
-- This can be called by an external webhook or Supabase's built-in cron
CREATE OR REPLACE FUNCTION check_upcoming_lessons()
RETURNS TABLE (
  lesson_id uuid,
  tutor_email text,
  student_name text,
  lesson_time timestamptz,
  minutes_until_lesson integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_minutes integer;
  window_start timestamptz;
  window_end timestamptz;
BEGIN
  -- Get reminder timing from settings
  SELECT (setting_value->>'minutes')::integer INTO reminder_minutes
  FROM email_settings
  WHERE setting_key = 'lesson_reminder_timing';
  
  IF reminder_minutes IS NULL THEN
    reminder_minutes := 30; -- Default to 30 minutes
  END IF;
  
  -- Calculate time window
  window_start := now() + (reminder_minutes || ' minutes')::interval;
  window_end := now() + ((reminder_minutes + 5) || ' minutes')::interval;
  
  -- Return lessons in the reminder window
  RETURN QUERY
  SELECT 
    ce.id as lesson_id,
    t.email as tutor_email,
    split_part(ce.summary, ' - ', 1) as student_name,
    ce.start_time as lesson_time,
    EXTRACT(EPOCH FROM (ce.start_time - now()))::integer / 60 as minutes_until_lesson
  FROM calendar_events ce
  INNER JOIN tutors t ON t.id = ce.tutor_id
  WHERE ce.start_time >= window_start
    AND ce.start_time <= window_end
    AND NOT EXISTS (
      -- Check if reminder already sent
      SELECT 1 FROM email_logs el
      WHERE el.template_type = 'lesson_reminder'
        AND el.recipient_email = t.email
        AND el.metadata->>'google_event_id' = ce.google_event_id
        AND el.status IN ('sent', 'delivered', 'pending', 'scheduled')
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_upcoming_lessons() TO authenticated;
GRANT EXECUTE ON FUNCTION check_upcoming_lessons() TO service_role;

-- Add comment
COMMENT ON FUNCTION check_upcoming_lessons() IS 'Returns lessons that need reminders sent in the next 5 minutes. Used by the lesson reminder system.';

-- Update the cron_job_status view
DROP VIEW IF EXISTS cron_job_status;
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  jobname,
  schedule,
  active,
  jobid,
  command
FROM cron.job 
WHERE jobname IN ('automated-lesson-generation', 'automated-lesson-reminders');

GRANT SELECT ON cron_job_status TO authenticated;

-- Add a note about the webhook approach
COMMENT ON VIEW cron_job_status IS 'View of active cron jobs. Note: lesson reminders now use Supabase Edge Function cron instead of pg_cron due to pg_net unavailability.';
