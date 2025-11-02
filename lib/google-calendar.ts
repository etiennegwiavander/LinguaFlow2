import { supabase } from "./supabase";

export interface CalendarEvent {
  id: string;
  tutor_id: string;
  google_event_id: string;
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: any[];
  created_at: string;
  updated_at: string;
}

export interface GoogleTokens {
  id: string;
  tutor_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  email?: string;
  channel_id?: string;
  resource_id?: string;
  channel_expiration?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  email?: string;
}

export interface WebhookStatus {
  active: boolean;
  channel_id?: string;
  expiration?: string;
  hours_until_expiration?: number;
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Store Google OAuth tokens in the database
   */
  public async storeTokens(tokenData: TokenData): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase.from("google_tokens").upsert(
      {
        tutor_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope,
        email: tokenData.email || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "tutor_id",
      }
    );

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`);
    }
  }

  /**
   * Initiate Google OAuth flow with same-tab redirect
   */
  public async initiateOAuth(email?: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Store the current page state before redirect
    sessionStorage.setItem(
      "calendar_return_state",
      JSON.stringify({
        timestamp: Date.now(),
        email: email || "",
        page: "calendar",
      })
    );

    // Redirect to OAuth URL
    const authUrl = await this.getOAuthUrl(email);
    window.location.href = authUrl;
  }

  /**
   * Handle return from OAuth (called on page load)
   */
  public async handleOAuthReturn(): Promise<{
    success: boolean;
    message?: string;
    shouldSync?: boolean;
  }> {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("google_auth_status");

    if (!authStatus) {
      return { success: false };
    }

    // Clean up URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("google_auth_status");
    newUrl.searchParams.delete("message");
    window.history.replaceState({}, "", newUrl.pathname);

    // Clear stored state
    sessionStorage.removeItem("calendar_return_state");

    if (authStatus === "success") {
      return {
        success: true,
        message: "Google Calendar connected successfully!",
        shouldSync: true,
      };
    } else {
      const errorMessage = urlParams.get("message") || "Unknown error occurred";
      return {
        success: false,
        message: `Connection failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get the OAuth URL for navigation
   */
  public async getOAuthUrl(email?: string): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("Google Client ID is not configured");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Use Supabase URL for the redirect URI with anon key for authentication
    // The anon key allows the Edge Function to be called without requiring a JWT token
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error("Supabase anon key is not configured");
    }
    // Include the anon key in the redirect URI so Supabase allows the callback
    const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback?apikey=${anonKey}`;
    const scope = "https://www.googleapis.com/auth/calendar.readonly";
    const state = user.id; // Use user ID as state

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    // Add login hint if email is provided
    if (email) {
      params.append("login_hint", email);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Sync calendar events
   */
  public async syncCalendar(): Promise<{
    success: boolean;
    events_count: number;
    last_sync: string;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-calendar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tutor_id: user.id,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to sync calendar");
    }

    return await response.json();
  }

  /**
   * Check if user has connected Google Calendar
   */
  public async isConnected(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("google_tokens")
      .select("id")
      .eq("tutor_id", user.id)
      .maybeSingle();

    return !error && !!data;
  }

  /**
   * Get stored calendar events
   */
  public async getCalendarEvents(
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
      .from("calendar_events")
      .select("*")
      .eq("tutor_id", user.id)
      .order("start_time", { ascending: true });

    if (startDate) {
      query = query.gte("start_time", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("start_time", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Disconnect Google Calendar
   */
  public async disconnect(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get the channel information to stop the webhook
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_tokens")
      .select("access_token, channel_id, resource_id")
      .eq("tutor_id", user.id)
      .single();

    if (
      !tokenError &&
      tokenData &&
      tokenData.channel_id &&
      tokenData.resource_id
    ) {
      try {
        // Stop the webhook channel
        await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify({
            id: tokenData.channel_id,
            resourceId: tokenData.resource_id,
          }),
        });
      } catch (error) {
        // Just log the error, don't throw, as we still want to delete the tokens
        console.error("Failed to stop webhook channel:", error);
      }
    }

    // Delete tokens and events
    await Promise.all([
      supabase.from("google_tokens").delete().eq("tutor_id", user.id),
      supabase.from("calendar_events").delete().eq("tutor_id", user.id),
    ]);
  }

  /**
   * Get connection status and last sync info
   */
  public async getConnectionStatus(): Promise<{
    connected: boolean;
    email?: string;
    last_sync?: string;
    expires_at?: string;
    webhook_status?: WebhookStatus;
  }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: false };

    // Use maybeSingle() instead of single() to handle cases where no record exists
    const { data: tokenData, error } = await supabase
      .from("google_tokens")
      .select("expires_at, updated_at, email, channel_id, channel_expiration")
      .eq("tutor_id", user.id)
      .maybeSingle();

    // If there's an error or no data, return not connected
    if (error || !tokenData) {
      return { connected: false };
    }

    // Calculate webhook status
    let webhookStatus: WebhookStatus | undefined;

    if (tokenData.channel_id && tokenData.channel_expiration) {
      const now = new Date();
      const expiration = new Date(tokenData.channel_expiration);
      const hoursUntilExpiration =
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60);

      webhookStatus = {
        active: expiration > now,
        channel_id: tokenData.channel_id,
        expiration: tokenData.channel_expiration,
        hours_until_expiration: hoursUntilExpiration,
      };
    }

    return {
      connected: true,
      email: tokenData.email,
      last_sync: tokenData.updated_at,
      expires_at: tokenData.expires_at,
      webhook_status: webhookStatus,
    };
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance();
