-- Fix RLS policy for OAuth callback to allow service role to insert Google tokens
-- This addresses the "Missing authorization header" error during OAuth callback

-- Add policy to allow service role to insert/update google tokens during OAuth callback
CREATE POLICY "Service role can manage google tokens for OAuth"
  ON google_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also ensure the service role can manage calendar events
CREATE POLICY "Service role can manage calendar events"
  ON calendar_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);