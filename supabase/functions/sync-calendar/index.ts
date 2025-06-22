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

async function refreshAccessToken(refreshToken: string): Promise<string> {
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
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

async function fetchCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Go back 7 days
  const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // Go forward 90 days

  const params = new URLSearchParams({
    timeMin: sevenDaysAgo.toISOString(),
    timeMax: ninetyDaysFromNow.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250', // Increased from 100 to capture more events
  })

  console.log(`📅 Fetching calendar events from ${sevenDaysAgo.toISOString()} to ${ninetyDaysFromNow.toISOString()}`);

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
    const errorData = await response.text()
    console.error('❌ Google Calendar API error:', errorData);
    throw new Error(`Failed to fetch calendar events: ${errorData}`)
  }

  const data = await response.json()
  console.log(`📊 Google Calendar API returned ${data.items?.length || 0} events`);
  
  return data.items || []
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
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    console.log(`🔍 Syncing calendar for user: ${user.id}`);

    // Get stored Google tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_tokens')
      .select('*')
      .eq('tutor_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('No Google Calendar connection found. Please connect your calendar first.')
    }

    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)

    // Check if token needs refresh
    if (expiresAt <= new Date()) {
      console.log('🔄 Access token expired, refreshing...');
      try {
        accessToken = await refreshAccessToken(tokenData.refresh_token)
        
        // Update the access token in database
        const newExpiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour from now
        await supabaseClient
          .from('google_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('tutor_id', user.id)
        
        console.log('✅ Access token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError);
        throw new Error('Failed to refresh access token. Please reconnect your Google Calendar.')
      }
    }

    // Fetch calendar events
    const events = await fetchCalendarEvents(accessToken)

    // Process and store events
    const processedEvents = events.map(event => {
      // Handle both dateTime and date formats
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      
      // If it's a date-only event, convert to ISO string with time
      const processedStartTime = startTime.includes('T') ? startTime : `${startTime}T00:00:00Z`;
      const processedEndTime = endTime.includes('T') ? endTime : `${endTime}T23:59:59Z`;
      
      return {
        tutor_id: user.id,
        google_event_id: event.id,
        summary: event.summary || 'Untitled Event',
        description: event.description || null,
        start_time: processedStartTime,
        end_time: processedEndTime,
        location: event.location || null,
        attendees: event.attendees ? JSON.stringify(event.attendees) : null,
      };
    });

    console.log(`📝 Processing ${processedEvents.length} events for storage`);

    // Upsert events to avoid duplicates
    if (processedEvents.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from('calendar_events')
        .upsert(processedEvents, {
          onConflict: 'tutor_id,google_event_id'
        })

      if (upsertError) {
        console.error('❌ Failed to store events:', upsertError);
        throw new Error(`Failed to store calendar events: ${upsertError.message}`)
      }
      
      console.log(`✅ Successfully stored ${processedEvents.length} events`);
    }

    // Update the last sync timestamp
    await supabaseClient
      .from('google_tokens')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('tutor_id', user.id)

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

  } catch (error) {
    console.error('❌ Calendar sync error:', error)
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