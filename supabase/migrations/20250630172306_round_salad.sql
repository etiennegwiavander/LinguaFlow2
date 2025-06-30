/*
  # Create Webhook Renewal Cron Job

  1. Setup
    - Create a cron job to renew Google Calendar webhook channels before they expire
    - The job will run daily and check for channels expiring within the next 24 hours
    - For each expiring channel, it will call the sync-calendar function to renew it

  2. Security
    - Uses service role key for authentication
    - Scheduled task runs with appropriate permissions
*/

-- Create a cron job to renew webhook channels daily
SELECT cron.schedule(
  'renew-google-calendar-webhooks',
  '0 0 * * *', -- Run at midnight every day
  $$
  -- Find tokens with channels expiring within 24 hours
  WITH expiring_channels AS (
    SELECT tutor_id
    FROM google_tokens
    WHERE channel_expiration IS NOT NULL
      AND channel_expiration <= (now() + interval '24 hours')
  )
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/sync-calendar',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'tutor_id', tutor_id,
        'renew_webhook', true
      )
    )
  FROM expiring_channels;
  $$
);

-- Create a function to manually trigger webhook renewal (for testing)
CREATE OR REPLACE FUNCTION trigger_webhook_renewal()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Find tokens with channels expiring within 24 hours
  WITH expiring_channels AS (
    SELECT tutor_id
    FROM google_tokens
    WHERE channel_expiration IS NOT NULL
      AND channel_expiration <= (now() + interval '24 hours')
  )
  SELECT
    jsonb_agg(
      net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/sync-calendar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := jsonb_build_object(
          'tutor_id', tutor_id,
          'renew_webhook', true
        )
      )
    ) INTO result
  FROM expiring_channels;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permission on the function to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION trigger_webhook_renewal() TO authenticated;

-- Create a view to monitor webhook channel status
CREATE OR REPLACE VIEW webhook_channel_status AS
SELECT 
  t.id as tutor_id,
  t.email,
  gt.channel_id,
  gt.resource_id,
  gt.channel_expiration,
  CASE 
    WHEN gt.channel_id IS NULL THEN 'Not configured'
    WHEN gt.channel_expiration < now() THEN 'Expired'
    WHEN gt.channel_expiration <= (now() + interval '24 hours') THEN 'Expiring soon'
    ELSE 'Active'
  END as status,
  CASE
    WHEN gt.channel_expiration IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (gt.channel_expiration - now())) / 3600
    ELSE NULL
  END as hours_until_expiration
FROM 
  tutors t
LEFT JOIN 
  google_tokens gt ON t.id = gt.tutor_id
WHERE 
  gt.id IS NOT NULL;

-- Grant select permission on the view to authenticated users
GRANT SELECT ON webhook_channel_status TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_webhook_renewal() IS 'Manually trigger the renewal of expiring Google Calendar webhook channels';
COMMENT ON VIEW webhook_channel_status IS 'Monitor the status of Google Calendar webhook channels for all tutors';