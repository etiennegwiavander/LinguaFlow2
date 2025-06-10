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
  private popupWindow: Window | null = null;

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

      // Use Supabase URL for the redirect URI instead of window.location.origin
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

      console.log('🔗 Popup window opened:', this.popupWindow);

      // Listen for the OAuth callback
      const messageHandler = async (event: MessageEvent) => {
        console.log('📨 Message received from:', event.origin, 'Source:', event.source);
        console.log('📨 Current popup window:', this.popupWindow);
        console.log('📨 Message data:', event.data);

        // Check if the message is from our popup window
        if (event.source !== this.popupWindow) {
          console.log('❌ Ignoring message - not from our popup window');
          return;
        }

        // Get the Supabase URL origin for comparison
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : '';
        
        // Accept messages from either the current origin or Supabase origin
        if (event.origin !== window.location.origin && event.origin !== supabaseOrigin) {
          console.log('❌ Ignoring message from unauthorized origin:', event.origin);
          return;
        }

        if (event.data.type === 'GOOGLE_OAUTH_CALLBACK') {
          console.log('✅ Valid OAuth callback message received');
          window.removeEventListener('message', messageHandler);
          this.popupWindow = null; // Clear the reference
          
          if (event.data.success && event.data.code) {
            try {
              console.log('🔄 Exchanging code for tokens...');
              await this.exchangeCodeForTokens(event.data.code, email);
              console.log('✅ Token exchange successful');
              resolve();
            } catch (error) {
              console.error('❌ Token exchange failed:', error);
              reject(error);
            }
          } else {
            console.error('❌ OAuth callback failed:', event.data.error);
            reject(new Error(event.data.error || 'Authorization failed'));
          }
        }
      };

      window.addEventListener('message', messageHandler);
      console.log('👂 Message listener added');

      // Handle popup closed manually
      const checkClosed = setInterval(() => {
        if (this.popupWindow?.closed) {
          console.log('🚪 Popup window was closed manually');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          this.popupWindow = null;
          reject(new Error('Authorization cancelled'));
        }
      }, 1000);
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, email?: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('DEBUG: Session object retrieved:', session);
    
    if (!session) {
      console.error('DEBUG: Session is null. Cannot proceed with token exchange.');
      throw new Error('Not authenticated. Please log in again.');
    }

    const accessToken = session.access_token;
    console.log('DEBUG: Access Token:', accessToken ? 'Present' : 'Missing', 'Length:', accessToken?.length);
    console.log('DEBUG: Type of Access Token:', typeof accessToken);

    if (!accessToken) {
      console.error('DEBUG: Access token is undefined or null. Cannot make authorized request.');
      throw new Error('Authentication token missing. Please log in again.');
    }

    const authHeaderValue = `Bearer ${accessToken}`;
    console.log('DEBUG: Constructed Authorization Header:', authHeaderValue.substring(0, 50) + '...'); // Log partial to avoid exposing full token

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-oauth`, {
      method: 'POST',
      headers: {
        'Authorization': authHeaderValue,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, email }),
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