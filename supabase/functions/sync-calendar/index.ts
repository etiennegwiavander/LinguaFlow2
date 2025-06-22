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
  console.log('Attempting to refresh access token...');
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
    console.error('Failed to refresh access token:', response.status, errorText);
    throw new Error(`Failed to refresh access token: ${errorText}`);
  }

  const data = await response.json();
  console.log('Access token refreshed successfully.');
  return {
    accessToken: data.access_token,
    newExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString() // Use expires_in from response
  };
}

async function fetchCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
  console.log(`Fetching calendar events from ${timeMin} to ${timeMax}...`);
  const params = new URLSearchParams({
    timeMin: timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    timeMax: timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
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

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to fetch calendar events from Google API:', response.status, errorData);
    throw new Error(`Failed to fetch calendar events: ${errorData}`);
  }

  const data = await response.json();
  console.log('Google Calendar API response received. Number of items:', data.items ? data.items.length : 0);
  // Log the actual items received from Google API for debugging
  if (data.items && data.items.length > 0) {
    console.log('First 5 events from Google API:', JSON.stringify(data.items.slice(0, 5), null, 2));
  } else {
    console.log('No events returned from Google Calendar API for the specified range.');
  }
  return data.items || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided.');
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      throw new Error('Invalid token');
    }
    console.log('User authenticated:', user.id);

    // Get stored Google tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_tokens')
      .select('*')
      .eq('tutor_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      console.error('No Google Calendar connection found for user:', user.id, tokenError?.message);
      throw new Error('No Google Calendar connection found. Please connect your calendar first.');
    }
    console.log('Google tokens retrieved. Expires at:', tokenData.expires_at);

    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)

    // Check if token needs refresh
    if (expiresAt <= new Date()) {
      console.log('Access token expired, attempting to refresh...');
      try {
        const { accessToken: newAccessToken, newExpiresAt } = await refreshAccessToken(tokenData.refresh_token);
        accessToken = newAccessToken;
        
        // Update the access token in database
        const { error: updateTokenError } = await supabaseClient
          .from('google_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('tutor_id', user.id)
        
        if (updateTokenError) {
          console.error('Failed to update access token in DB:', updateTokenError.message);
          throw new Error('Failed to update access token in database.');
        }
        console.log('Access token updated in database.');
      } catch (refreshError: any) {
        console.error('Failed to refresh access token:', refreshError.message);
        throw new Error(`Failed to refresh access token. Please reconnect your Google Calendar: ${refreshError.message}`);
      }
    } else {
      console.log('Access token is still valid.');
    }

    // Fetch calendar events
    const events = await fetchCalendarEvents(accessToken)

    // Process and store events
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

    // Upsert events to avoid duplicates
    if (processedEvents.length > 0) {
      console.log(`Attempting to upsert ${processedEvents.length} events into database...`);
      const { error: upsertError } = await supabaseClient
        .from('calendar_events')
        .upsert(processedEvents, {
          onConflict: 'tutor_id,google_event_id'
        })

      if (upsertError) {
        console.error('Failed to store calendar events in DB:', upsertError.message);
        throw new Error(`Failed to store calendar events: ${upsertError.message}`);
      }
      console.log(`Successfully upserted ${processedEvents.length} events.`);
    } else {
      console.log('No events to upsert.');
    }

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
    console.error('Calendar sync error:', error.message);
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
