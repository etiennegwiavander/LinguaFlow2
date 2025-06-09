import { supabase } from './supabase';

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
  created_at: string;
  updated_at: string;
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
   * Initiate Google OAuth flow
   */
  public initiateOAuth(email?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        reject(new Error('Google Client ID is not configured'));
        return;
      }

      const redirectUri = `${window.location.origin}/supabase/functions/v1/google-oauth-callback`;
      const scope = 'https://www.googleapis.com/auth/calendar.readonly';
      const state = Math.random().toString(36).substring(2, 15);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        access_type: 'offline',
        prompt: 'consent',
        state,
      });

      // Add login hint if email is provided
      if (email) {
        params.append('login_hint', email);
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // Open popup window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Google Calendar Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Set a timeout for the OAuth process
      const OAUTH_TIMEOUT_MS = 60000; // 60 seconds
      const timeoutId = setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        // If the popup is still open, try to close it (though it might be blocked by COOP)
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch (e) {
            // Log error if closing fails due to COOP or other reasons
            console.error('Failed to close OAuth popup:', e);
          }
        }
        reject(new Error('Google OAuth authorization timed out.'));
      }, OAUTH_TIMEOUT_MS);


      // Listen for the OAuth callback
      const messageHandler = async (event: MessageEvent) => {
        // Ensure the message comes from the same origin to prevent XSS
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_OAUTH_CALLBACK') {
          // Clear the timeout as we received a response
          clearTimeout(timeoutId);
          window.removeEventListener('message', messageHandler);
          
          // Close the popup after receiving the message
          if (popup) {
            try {
              popup.close();
            } catch (e) {
              console.error('Failed to close OAuth popup after message:', e);
            }
          }

          if (event.data.success && event.data.code) {
            try {
              await this.exchangeCodeForTokens(event.data.code, email);
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(event.data.error || 'Authorization failed'));
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Note: We remove the setInterval for checking popup.closed due to COOP restrictions.
      // The timeout mechanism now handles cases where the user doesn't complete the flow.
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, email?: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange authorization code');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Token exchange failed');
    }
  }

  /**
   * Sync calendar events
   */
  public async syncCalendar(): Promise<{ success: boolean; events_count: number; last_sync: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-calendar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync calendar');
    }

    return await response.json();
  }

  /**
   * Check if user has connected Google Calendar
   */
  public async isConnected(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('google_tokens')
      .select('id')
      .eq('tutor_id', user.id)
      .single();

    return !error && !!data;
  }

  /**
   * Get stored calendar events
   */
  public async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('tutor_id', user.id)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete tokens and events
    await Promise.all([
      supabase.from('google_tokens').delete().eq('tutor_id', user.id),
      supabase.from('calendar_events').delete().eq('tutor_id', user.id),
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
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { connected: false };

    const { data: tokenData } = await supabase
      .from('google_tokens')
      .select('expires_at, updated_at, email')
      .eq('tutor_id', user.id)
      .single();

    if (!tokenData) {
      return { connected: false };
    }

    return {
      connected: true,
      email: tokenData.email,
      last_sync: tokenData.updated_at,
      expires_at: tokenData.expires_at,
    };
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance();
