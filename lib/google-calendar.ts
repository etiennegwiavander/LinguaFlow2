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

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  email?: string;
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private popupWindow: Window | null = null;

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

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
  }

  /**
   * Initiate Google OAuth flow
   */
  public async initiateOAuth(email?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        reject(new Error('Google Client ID is not configured'));
        return;
      }

      // Get current user ID for state parameter
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          reject(new Error('User not authenticated'));
          return;
        }

        // Use Supabase URL for the redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth-callback`;
        const scope = 'https://www.googleapis.com/auth/calendar.readonly';
        const state = user.id; // Use user ID as state

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

        console.log('🔗 Opening Google OAuth URL');

        // Open popup window
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        this.popupWindow = window.open(
          authUrl,
          'Google Calendar Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!this.popupWindow) {
          reject(new Error('Failed to open popup window. Please allow popups for this site.'));
          return;
        }

        console.log('🔗 Popup window opened successfully');

        // Simply resolve when popup opens - the callback will handle the rest
        resolve();
      }).catch(reject);
    });
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
      .maybeSingle();

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
      .maybeSingle();

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