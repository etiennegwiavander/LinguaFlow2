import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string, newExpiresAt: string }> {
  console.log(`[${new Date().toISOString()}] Attempting to refresh access token...`);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to refresh access token: Status ${response.status}, Error: ${errorText}`);
    throw new Error(`Failed to refresh access token: ${errorText}`);
  }

  const data = await response.json();
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  console.log(`[${new Date().toISOString()}] Access token refreshed successfully. New expiry: ${newExpiresAt}`);
  return {
    accessToken: data.access_token,
    newExpiresAt: newExpiresAt
  };
}

async function fetchCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
  const minTime = timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
  const maxTime = timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days from now
  console.log(`[${new Date().toISOString()}] Fetching calendar events from ${minTime} to ${maxTime}...`);
  const params = new URLSearchParams({
    timeMin: minTime,
    timeMax: maxTime,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250', // Increased limit
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  console.log(`[${new Date().toISOString()}] Google Calendar API response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to fetch calendar events from Google API: Status ${response.status}, Error: ${errorData}`);
    throw new Error(`Failed to fetch calendar events: ${errorData}`);
  }

  console.log(`[${new Date().toISOString()}] Attempting to parse Google Calendar API response as JSON.`);
  const data = await response.json();
  console.log(`[${new Date().toISOString()}] Google Calendar API response received. Number of items: ${data.items ? data.items.length : 0}`);
  // Log the actual items received from Google API for debugging
  if (data.items && data.items.length > 0) {
    console.log(`[${new Date().toISOString()}] First 5 events from Google API:`, JSON.stringify(data.items.slice(0, 5), null, 2));
  } else {
    console.log(`[${new Date().toISOString()}] No events returned from Google Calendar API for the specified range.`);
  }
  return data.items || [];
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Sync-calendar function started for URL: ${req.url}`);
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Handling OPTIONS request.`);
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )
    console.log(`[${new Date().toISOString()}] Supabase client created.`);

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error(`[${new Date().toISOString()}] No authorization header provided.`);
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '')
    console.log(`[${new Date().toISOString()}] Attempting to authenticate user with token.`);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error(`[${new Date().toISOString()}] Authentication failed: ${authError?.message || 'User not found'}`);
      throw new Error('Invalid token');
    }
    console.log(`[${new Date().toISOString()}] User authenticated: ${user.id}`);

    // Get stored Google tokens
    console.log(`[${new Date().toISOString()}] Fetching Google tokens for user: ${user.id}`);
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_tokens')
      .select('*')
      .eq('tutor_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      console.error(`[${new Date().toISOString()}] No Google Calendar connection found for user: ${user.id}, Error: ${tokenError?.message || 'No data'}`);
      throw new Error('No Google Calendar connection found. Please connect your calendar first.');
    }
    console.log(`[${new Date().toISOString()}] Google tokens retrieved. Expires at: ${tokenData.expires_at}`);

    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)

    // Check if token needs refresh
    if (expiresAt <= new Date()) {
      console.log(`[${new Date().toISOString()}] Access token expired (${expiresAt.toISOString()}), attempting to refresh...`);
      try {
        const { accessToken: newAccessToken, newExpiresAt } = await refreshAccessToken(tokenData.refresh_token);
        accessToken = newAccessToken;
        
        // Update the access token in database
        console.log(`[${new Date().toISOString()}] Updating access token in database for user: ${user.id}`);
        const { error: updateTokenError } = await supabaseClient
          .from('google_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('tutor_id', user.id)
        
        if (updateTokenError) {
          console.error(`[${new Date().toISOString()}] Failed to update access token in DB: ${updateTokenError.message}`);
          throw new Error('Failed to update access token in database.');
        }
        console.log(`[${new Date().toISOString()}] Access token updated in database.`);
      } catch (refreshError: any) {
        console.error(`[${new Date().toISOString()}] Failed to refresh access token: ${refreshError.message}`);
        throw new Error(`Failed to refresh access token. Please reconnect your Google Calendar: ${refreshError.message}`);
      }
    } else {
      console.log(`[${new Date().toISOString()}] Access token is still valid. Expires: ${expiresAt.toISOString()}`);
    }

    // Fetch calendar events
    console.log(`[${new Date().toISOString()}] Calling fetchCalendarEvents with current access token.`);
    const events = await fetchCalendarEvents(accessToken)
    console.log(`[${new Date().toISOString()}] Received ${events.length} events from Google Calendar.`);

    // Process and store events
    console.log(`[${new Date().toISOString()}] Processing events for database upsert.`);
    const processedEvents = events.map(event => ({
      tutor_id: user.id,
      google_event_id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description || null,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      location: event.location || null,
      // Ensure attendees is stored as JSON string if it exists
      attendees: event.attendees ? JSON.stringify(event.attendees) : null,
    }))
    console.log(`[${new Date().toISOString()}] Finished processing ${processedEvents.length} events.`);

    // Upsert events to avoid duplicates
    if (processedEvents.length > 0) {
      console.log(`[${new Date().toISOString()}] Attempting to upsert ${processedEvents.length} events into database...`);
      const { error: upsertError } = await supabaseClient
        .from('calendar_events')
        .upsert(processedEvents, {
          onConflict: 'tutor_id,google_event_id'
        })

      if (upsertError) {
        console.error(`[${new Date().toISOString()}] Failed to store calendar events in DB: ${upsertError.message}`);
        throw new Error(`Failed to store calendar events: ${upsertError.message}`);
      }
      console.log(`[${new Date().toISOString()}] Successfully upserted ${processedEvents.length} events.`);
    } else {
      console.log(`[${new Date().toISOString()}] No events to upsert.`);
    }

    console.log(`[${new Date().toISOString()}] Calendar sync completed successfully.`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${processedEvents.length} calendar events`,
        events_count: processedEvents.length,
        last_sync: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Calendar sync error caught in main block: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
