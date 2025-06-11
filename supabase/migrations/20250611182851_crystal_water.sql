/*
  # Schedule Automated Lesson Generation

  1. Setup
    - Enable pg_cron extension for scheduled tasks
    - Create a cron job to run lesson generation every 15 minutes
    - The job will call the schedule-lesson-generation Edge Function

  2. Security
    - Uses service role key for authentication
    - Scheduled task runs with appropriate permissions
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the lesson generation task to run every 15 minutes
-- This will check for lessons starting in the next hour and generate AI lesson plans
SELECT cron.schedule(
  'automated-lesson-generation',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/schedule-lesson-generation',
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

-- Create a function to manually trigger lesson generation (for testing)
CREATE OR REPLACE FUNCTION trigger_lesson_generation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/schedule-lesson-generation',
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
GRANT EXECUTE ON FUNCTION trigger_lesson_generation() TO authenticated;

-- Create a view to monitor cron job status
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'automated-lesson-generation';

-- Grant select permission on the view to authenticated users
GRANT SELECT ON cron_job_status TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_lesson_generation() IS 'Manually trigger the automated lesson generation process for testing purposes';
COMMENT ON VIEW cron_job_status IS 'Monitor the status of the automated lesson generation cron job';