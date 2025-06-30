import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get headers from the request
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceId = req.headers.get("x-goog-resource-id");
    const resourceState = req.headers.get("x-goog-resource-state");
    const messageNumber = req.headers.get("x-goog-message-number");

    if (!channelId || !resourceId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required headers" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Find the tutor associated with this channel
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("google_tokens")
      .select("tutor_id")
      .eq("channel_id", channelId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Channel not found" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // Log the webhook event
    const { data: logData, error: logError } = await supabaseClient
      .from("calendar_webhook_logs")
      .insert({
        tutor_id: tokenData.tutor_id,
        channel_id: channelId,
        resource_id: resourceId,
        resource_state: resourceState,
        message_number: messageNumber,
        headers: Object.fromEntries(req.headers.entries())
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
    }

    // If this is a sync message, trigger a calendar sync
    if (resourceState === "sync" || resourceState === "exists") {
      // No need to do anything for sync messages
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Sync notification received" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    // For change notifications, trigger a sync
    if (resourceState === "change") {
      // Call the sync-calendar function
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          tutor_id: tokenData.tutor_id,
          webhook_triggered: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error syncing calendar:", errorData);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processed successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});