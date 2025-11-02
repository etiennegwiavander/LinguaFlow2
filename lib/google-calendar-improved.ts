// Improved Google Calendar service without popups
import { supabase } from "./supabase";

export class ImprovedGoogleCalendarService {
  /**
   * Initiate OAuth with same-tab redirect (no popup)
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

  private async getOAuthUrl(email?: string): Promise<string> {
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
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error("Supabase anon key is not configured");
    }
    // Include the anon key in the redirect URI so Supabase allows the callback
    const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback?apikey=${anonKey}`;
    const scope = "https://www.googleapis.com/auth/calendar.readonly";
    const state = user.id;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    if (email) {
      params.append("login_hint", email);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}
