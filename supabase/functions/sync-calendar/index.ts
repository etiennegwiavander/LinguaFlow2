// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SyncCalendarRequest {
  tutor_id?: string;
  triggered_by_webhook?: boolean;
  channel_id?: string;
  resource_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body - handle empty body gracefully
    let requestData: SyncCalendarRequest = {};
    try {
      const body = await req.text();
      if (body.trim()) {
        requestData = JSON.parse(body);
      }
    } catch (error) {
      console.log('No JSON body provided, using empty object');
      requestData = {};
    }
    
    // Get user ID from auth token or request body
    let tutorId: string;
    
    if (requestData.tutor_id) {
      // If tutor_id is provided in the request (e.g., from webhook or admin)
      tutorId = requestData.tutor_id;
    } else {
      // Otherwise, get it from the auth token
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("Missing Authorization header");
      }
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        throw new Error("Invalid or expired token");
      }
      
      tutorId = user.id;
    }

    // Get Google tokens for the tutor
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_tokens")
      .select("*")
      .eq("tutor_id", tutorId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("No Google Calendar connection found");
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    let accessToken = tokenData.access_token;
    
    if (expiresAt <= now) {
      // Token is expired, refresh it
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        const refreshError = await refreshResponse.json();
        throw new Error(`Failed to refresh token: ${JSON.stringify(refreshError)}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Calculate new expiration time
      const expiresIn = refreshData.expires_in || 3600; // Default to 1 hour
      const newExpiresAt = new Date(now.getTime() + expiresIn * 1000);
      
      // Update token in database
      await supabase
        .from("google_tokens")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("tutor_id", tutorId);
    }

    // Determine if we need to set up or renew a webhook channel
    const shouldSetupWebhook = 
      !tokenData.channel_id || 
      !tokenData.channel_expiration || 
      new Date(tokenData.channel_expiration) <= new Date(now.getTime() + 24 * 60 * 60 * 1000); // Expires within 24 hours

    // Set up webhook if needed
    if (shouldSetupWebhook && !requestData.triggered_by_webhook) {
      await setupWebhookChannel(supabase, supabaseUrl, tutorId, accessToken);
    }

    // Determine time range for calendar sync
    // If triggered by webhook, use a smaller time range for efficiency
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - (requestData.triggered_by_webhook ? 7 : 30)); // 7 days for webhook, 30 days for manual
    
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90); // 90 days into the future
    
    // First, get all calendars the user has access to
    const calendarsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarsResponse.ok) {
      const calendarsError = await calendarsResponse.json();
      throw new Error(`Failed to fetch calendar list: ${JSON.stringify(calendarsError)}`);
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];
    
    console.log(`Found ${calendars.length} calendars for user ${tutorId}`);
    
    // Fetch events from all calendars
    let allEvents: any[] = [];
    
    for (const calendar of calendars) {
      try {
        console.log(`Syncing calendar: ${calendar.summary} (${calendar.id})`);
        
        const calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=2500`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          const events = calendarData.items || [];
          
          // Add calendar info to each event
          const eventsWithCalendar = events.map((event: any) => ({
            ...event,
            calendar_id: calendar.id,
            calendar_name: calendar.summary,
          }));
          
          allEvents = allEvents.concat(eventsWithCalendar);
          console.log(`Added ${events.length} events from ${calendar.summary}`);
        } else {
          console.log(`Failed to fetch events from calendar ${calendar.summary}: ${calendarResponse.status}`);
        }
      } catch (error) {
        console.error(`Error fetching events from calendar ${calendar.summary}:`, error);
        // Continue with other calendars even if one fails
      }
    }
    
    console.log(`Total events fetched: ${allEvents.length}`);
    const events = allEvents;

    // Process events
    const processedEvents = events.map((event: any) => ({
      tutor_id: tutorId,
      google_event_id: event.id,
      summary: event.summary || "Untitled Event",
      description: event.description || null,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      location: event.location || null,
      attendees: event.attendees || null,
      updated_at: now.toISOString(),
    }));

    // Get existing events from database
    const { data: existingEvents, error: existingEventsError } = await supabase
      .from("calendar_events")
      .select("google_event_id")
      .eq("tutor_id", tutorId);

    if (existingEventsError) {
      throw new Error(`Failed to fetch existing events: ${existingEventsError.message}`);
    }

    // Create a map of existing event IDs for quick lookup
    const existingEventIds = new Set(existingEvents.map((e) => e.google_event_id));

    // Split events into new and existing
    const newEvents = processedEvents.filter((e) => !existingEventIds.has(e.google_event_id));
    const updatedEvents = processedEvents.filter((e) => existingEventIds.has(e.google_event_id));

    // Insert new events
    if (newEvents.length > 0) {
      const { error: insertError } = await supabase
        .from("calendar_events")
        .insert(newEvents);

      if (insertError) {
        throw new Error(`Failed to insert new events: ${insertError.message}`);
      }
    }

    // Update existing events
    for (const event of updatedEvents) {
      const { error: updateError } = await supabase
        .from("calendar_events")
        .update({
          summary: event.summary,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          attendees: event.attendees,
          updated_at: event.updated_at,
        })
        .eq("tutor_id", tutorId)
        .eq("google_event_id", event.google_event_id);

      if (updateError) {
        console.error(`Failed to update event ${event.google_event_id}: ${updateError.message}`);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        events_count: processedEvents.length,
        new_events_count: newEvents.length,
        updated_events_count: updatedEvents.length,
        last_sync: now.toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Calendar sync error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Function to set up a webhook channel with Google Calendar
async function setupWebhookChannel(supabase: any, supabaseUrl: string, tutorId: string, accessToken: string) {
  try {
    // Generate a unique channel ID
    const channelId = crypto.randomUUID();
    
    // Set expiration to 7 days from now (maximum allowed by Google)
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + 7);
    
    // Create the webhook channel
    const webhookResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: `${supabaseUrl}/functions/v1/google-webhook-receiver`,
          expiration: expirationTime.getTime().toString(),
        }),
      }
    );

    if (!webhookResponse.ok) {
      const webhookError = await webhookResponse.json();
      throw new Error(`Failed to create webhook: ${JSON.stringify(webhookError)}`);
    }

    const webhookData = await webhookResponse.json();
    
    // Update the google_tokens table with the webhook channel information
    const { error: updateError } = await supabase
      .from("google_tokens")
      .update({
        channel_id: webhookData.id,
        resource_id: webhookData.resourceId,
        channel_expiration: new Date(parseInt(webhookData.expiration)).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("tutor_id", tutorId);

    if (updateError) {
      throw new Error(`Failed to update token with webhook info: ${updateError.message}`);
    }

    console.log(`Webhook channel created for tutor ${tutorId}, expires at ${new Date(parseInt(webhookData.expiration)).toISOString()}`);
    
    return webhookData;
  } catch (error) {
    console.error("Error setting up webhook channel:", error);
    // Don't throw here, just log the error and continue
    // This allows the calendar sync to proceed even if webhook setup fails
    return null;
  }
}