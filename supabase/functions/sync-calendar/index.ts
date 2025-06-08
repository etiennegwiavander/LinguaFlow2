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

async function fetchCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
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
    const errorData = await response.text()
    throw new Error(`Failed to fetch calendar events: ${errorData}`)
  }

  const data = await response.json()
  return data.items || []
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
      } catch (refreshError) {
        throw new Error('Failed to refresh access token. Please reconnect your Google Calendar.')
      }
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
      attendees: event.attendees ? JSON.stringify(event.attendees) : null,
    }))

    // Upsert events to avoid duplicates
    if (processedEvents.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from('calendar_events')
        .upsert(processedEvents, {
          onConflict: 'tutor_id,google_event_id'
        })

      if (upsertError) {
        throw new Error(`Failed to store calendar events: ${upsertError.message}`)
      }
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

  } catch (error) {
    console.error('Calendar sync error:', error)
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