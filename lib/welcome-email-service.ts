import { supabase } from './supabase';

export interface WelcomeEmailData {
  email: string;
  firstName?: string;
  lastName?: string;
}

export class WelcomeEmailService {
  /**
   * Send a welcome email to a new user
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Try API route first (for local testing), fallback to Edge Function
      const response = await fetch('/api/welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error sending welcome email via API:', result);
        return { success: false, error: result.error || 'Failed to send welcome email' };
      }

      console.log('Welcome email sent successfully via API:', result);
      return { success: true };
    } catch (error: any) {
      console.error('API route failed, trying Edge Function:', error);
      
      // Fallback to Edge Function
      try {
        const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
          body: data
        });

        if (error) {
          console.error('Error sending welcome email via Edge Function:', error);
          return { success: false, error: error.message };
        }

        console.log('Welcome email sent successfully via Edge Function:', result);
        return { success: true };
      } catch (edgeFunctionError: any) {
        console.error('Both API route and Edge Function failed:', edgeFunctionError);
        return { success: false, error: edgeFunctionError.message || 'Failed to send welcome email' };
      }
    }
  }

  /**
   * Get welcome email history for a user
   */
  static async getWelcomeEmailHistory(email: string) {
    try {
      const { data, error } = await supabase
        .from('welcome_emails')
        .select('*')
        .eq('email', email)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching welcome email history:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error fetching welcome email history:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Manually trigger a welcome email (for testing or resending)
   */
  static async resendWelcomeEmail(email: string): Promise<{ success: boolean; error?: string }> {
    return this.sendWelcomeEmail({ email });
  }

  /**
   * Check if a welcome email has been sent for a user
   */
  static async hasWelcomeEmailBeenSent(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('welcome_emails')
        .select('id')
        .eq('email', email)
        .eq('status', 'sent')
        .limit(1);

      if (error) {
        console.error('Error checking welcome email status:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Unexpected error checking welcome email status:', error);
      return false;
    }
  }
}

// Export convenience functions
export const sendWelcomeEmail = WelcomeEmailService.sendWelcomeEmail;
export const getWelcomeEmailHistory = WelcomeEmailService.getWelcomeEmailHistory;
export const resendWelcomeEmail = WelcomeEmailService.resendWelcomeEmail;
export const hasWelcomeEmailBeenSent = WelcomeEmailService.hasWelcomeEmailBeenSent;