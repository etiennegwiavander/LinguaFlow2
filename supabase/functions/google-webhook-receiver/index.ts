// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-resource-id, x-goog-resource-state, x-goog-message-number, x-goog-resource-uri",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract Google Calendar webhook headers
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceId = req.headers.get("x-goog-resource-id");
    const resourceState = req.headers.get("x-goog-resource-state");
    const messageNumber = req.headers.get("x-goog-message-number");
    
    console.log(`Received webhook: channelId=${channelId}, resourceState=${resourceState}, messageNumber=${messageNumber}`);
    
    if (!channelId || !resourceId) {
      throw new Error("Missing required Google webhook headers");
    }

    // Find the tutor associated with this channel
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_tokens")
      .select("tutor_id")
      .eq("channel_id", channelId)
      .single();

    if (tokenError || !tokenData) {
      console.error("Error finding token data:", tokenError);
      throw new Error(`No token found for channel ID: ${channelId}`);
    }

    const tutorId = tokenData.tutor_id;
    
    // Log the webhook event
    await supabase.from("calendar_webhook_logs").insert({
      tutor_id: tutorId,
      channel_id: channelId,
      resource_id: resourceId,
      resource_state: resourceState,
      message_number: messageNumber,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Only trigger sync for 'sync' or 'exists' resource states
    // 'sync' is sent when the channel is created, 'exists' when a change occurs
    if (resourceState === "sync" || resourceState === "exists") {
      // Call the sync-calendar function to update the calendar events
      const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          tutor_id: tutorId,
          triggered_by_webhook: true,
          channel_id: channelId,
          resource_id: resourceId,
        }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        console.error("Error syncing calendar:", errorData);
        throw new Error(`Failed to sync calendar: ${JSON.stringify(errorData)}`);
      }
    }

    // Respond to Google with 200 OK to acknowledge receipt
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    
    // Always return 200 OK to Google to prevent retries
    // Log the error internally but don't expose details to the caller
    return new Response(
      JSON.stringify({
        success: false,
        message: "Webhook processed with errors",
      }),
      {
        status: 200, // Always return 200 to Google
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});