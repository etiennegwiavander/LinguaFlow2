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

      // Use Supabase URL for the redirect URI
      const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback`;
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

      console.log('🔗 Opening Google OAuth URL:', authUrl);

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

      if (!popup) {
        reject(new Error('Failed to open popup window. Please allow popups for this site.'));
        return;
      }

      console.log('🔗 Popup window opened successfully');

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            console.log('🚪 Popup window was closed manually');
            clearInterval(checkClosed);
            reject(new Error('Authorization cancelled'));
          }
        } catch (error) {
          // Handle Cross-Origin-Opener-Policy errors gracefully
          console.log('⚠️ Cannot check popup window status due to COOP policy');
          // Continue checking - the redirect will handle success/failure
        }
      }, 1000);

      // The popup will redirect to the callback function, which will then redirect back to /calendar
      // with query parameters indicating success or failure. We'll resolve this promise
      // when the calendar page detects the successful OAuth flow.
      
      // For now, we'll resolve immediately and let the calendar page handle the rest
      setTimeout(() => {
        clearInterval(checkClosed);
        resolve();
      }, 1000);
    });
  }

  /**
   * Store Google tokens after successful OAuth
   */
  public async storeTokens(tokenData: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    scope: string;
    email?: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('google_tokens')
      .upsert({
        tutor_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope,
        email: tokenData.email || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tutor_id'
      });

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`);
    }

    console.log('✅ Tokens stored successfully');
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