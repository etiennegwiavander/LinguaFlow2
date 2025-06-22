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

interface CalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
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

async function fetchCalendarList(accessToken: string): Promise<CalendarListItem[]> {
  console.log(`[${new Date().toISOString()}] Fetching calendar list...`);
  
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to fetch calendar list: Status ${response.status}, Error: ${errorData}`);
    throw new Error(`Failed to fetch calendar list: ${errorData}`);
  }

  const data = await response.json();
  console.log(`[${new Date().toISOString()}] Found ${data.items?.length || 0} calendars`);
  
  return data.items || [];
}

async function fetchCalendarEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  console.log(`[${new Date().toISOString()}] Fetching events from calendar "${calendarId}" from ${timeMin} to ${timeMax}...`);
  
  const params = new URLSearchParams({
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log(`[${new Date().toISOString()}] Google Calendar API response status for "${calendarId}": ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to fetch calendar events from "${calendarId}": Status ${response.status}, Error: ${errorData}`);
    throw new Error(`Failed to fetch calendar events from "${calendarId}": ${errorData}`);
  }

  const data = await response.json();
  console.log(`[${new Date().toISOString()}] Calendar "${calendarId}" returned ${data.items?.length || 0} events`);
  
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

    // Calculate dynamic date range: current time to 2 weeks in the future
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days in milliseconds
    
    const minTime = now.toISOString();
    const maxTime = twoWeeksFromNow.toISOString();
    
    console.log(`[${new Date().toISOString()}] Using dynamic date range: ${minTime} to ${maxTime} (current time + 2 weeks)`);

    // Fetch calendar list to get all calendars
    const calendarList = await fetchCalendarList(accessToken);
    
    // Filter calendars to include primary and any calendar that might contain lessons
    const relevantCalendars = calendarList.filter(calendar => 
      calendar.accessRole === 'owner' || 
      calendar.accessRole === 'writer' || 
      calendar.primary ||
      calendar.summary.toLowerCase().includes('preply') ||
      calendar.summary.toLowerCase().includes('schedule') ||
      calendar.summary.toLowerCase().includes('lesson') ||
      calendar.summary.toLowerCase().includes('teaching')
    );

    console.log(`[${new Date().toISOString()}] Found ${relevantCalendars.length} relevant calendars out of ${calendarList.length} total calendars`);
    
    // Log calendar names for debugging
    relevantCalendars.forEach(calendar => {
      console.log(`[${new Date().toISOString()}] Will sync calendar: "${calendar.summary}" (ID: ${calendar.id}, Primary: ${calendar.primary || false})`);
    });

    let allEvents: CalendarEvent[] = [];

    // Fetch events from all relevant calendars
    for (const calendar of relevantCalendars) {
      try {
        const events = await fetchCalendarEvents(accessToken, calendar.id, minTime, maxTime);
        console.log(`[${new Date().toISOString()}] Retrieved ${events.length} events from calendar "${calendar.summary}"`);
        allEvents = allEvents.concat(events);
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Failed to fetch events from calendar "${calendar.summary}": ${error.message}`);
        // Continue with other calendars even if one fails
      }
    }

    console.log(`[${new Date().toISOString()}] Total events retrieved from all calendars: ${allEvents.length}`);

    // Process and store events
    console.log(`[${new Date().toISOString()}] Processing events for database upsert.`);
    const processedEvents = allEvents.map(event => ({
      tutor_id: user.id,
      google_event_id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description || null,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      location: event.location || null,
      // Ensure attendees is stored as JSON string if it exists
      attendees: event.attendees ? JSON.stringify(event.attendees) : null,
    }));

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
        message: `Successfully synced ${processedEvents.length} upcoming calendar events (next 2 weeks)`,
        events_count: processedEvents.length,
        last_sync: new Date().toISOString(),
        date_range: {
          from: minTime,
          to: maxTime,
          description: "Current time to 2 weeks in the future"
        }
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