/**
 * Unsubscribe Mechanism Service
 * Handles email unsubscribe functionality and preference management
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Environment variables with fallbacks - safe defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if environment variables are available
const isConfigured = !!(supabaseUrl && supabaseServiceKey);

// Only log warning in development
if (!isConfigured && process.env.NODE_ENV === 'development') {
  console.warn('Unsubscribe service not configured - missing environment variables');
}

export interface UnsubscribePreferences {
  userId: string;
  email: string;
  welcomeEmails: boolean;
  lessonReminders: boolean;
  marketingEmails: boolean;
  systemNotifications: boolean;
  allEmails: boolean;
  unsubscribedAt?: Date;
  resubscribedAt?: Date;
}

export interface UnsubscribeToken {
  token: string;
  userId: string;
  email: string;
  emailType?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface UnsubscribeLink {
  url: string;
  token: string;
  emailType?: string;
}

class UnsubscribeService {
  private supabase: any = null;
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  constructor() {
    // Only create Supabase client if properly configured
    if (isConfigured) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        this.supabase = null;
      }
    }
  }
  
  private checkConfiguration(): boolean {
    if (!isConfigured || !this.supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unsubscribe service not configured - operation skipped');
      }
      return false;
    }
    return true;
  }

  /**
   * Generate unsubscribe token for user and email type
   */
  async generateUnsubscribeToken(
    userId: string, 
    email: string, 
    emailType?: string
  ): Promise<UnsubscribeToken> {
    if (!this.checkConfiguration() || !this.supabase) {
      throw new Error('Unsubscribe service not configured');
    }
    
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

      // Store token in database
      const { data, error } = await this.supabase
        .from('unsubscribe_tokens')
        .insert({
          token,
          user_id: userId,
          email,
          email_type: emailType,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error generating unsubscribe token:', error);
        throw new Error('Failed to generate unsubscribe token');
      }

      return {
        token,
        userId,
        email,
        emailType,
        expiresAt,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error in generateUnsubscribeToken:', error);
      throw new Error('Failed to generate unsubscribe token');
    }
  }

  /**
   * Generate unsubscribe link for email
   */
  async generateUnsubscribeLink(
    userId: string, 
    email: string, 
    emailType?: string
  ): Promise<UnsubscribeLink> {
    const tokenData = await this.generateUnsubscribeToken(userId, email, emailType);
    
    const params = new URLSearchParams({
      token: tokenData.token,
      email: email
    });

    if (emailType) {
      params.append('type', emailType);
    }

    const url = `${this.baseUrl}/unsubscribe?${params.toString()}`;

    return {
      url,
      token: tokenData.token,
      emailType
    };
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(
    token: string, 
    emailType?: string
  ): Promise<{
    success: boolean;
    message: string;
    preferences?: UnsubscribePreferences;
  }> {
    if (!this.checkConfiguration() || !this.supabase) {
      return {
        success: false,
        message: 'Unsubscribe service not configured'
      };
    }
    
    try {
      // Validate token
      const { data: tokenData, error: tokenError } = await this.supabase
        .from('unsubscribe_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        return {
          success: false,
          message: 'Invalid or expired unsubscribe link'
        };
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return {
          success: false,
          message: 'Unsubscribe link has expired'
        };
      }

      // Get current preferences
      let { data: preferences, error: prefError } = await this.supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', tokenData.user_id)
        .single();

      if (prefError && prefError.code !== 'PGRST116') { // Not found error
        console.error('Error fetching preferences:', prefError);
        return {
          success: false,
          message: 'Failed to process unsubscribe request'
        };
      }

      // Create default preferences if none exist
      if (!preferences) {
        preferences = {
          user_id: tokenData.user_id,
          email: tokenData.email,
          welcome_emails: true,
          lesson_reminders: true,
          marketing_emails: true,
          system_notifications: true,
          all_emails: false
        };
      }

      // Update preferences based on email type
      const updatedPreferences = { ...preferences };
      
      if (emailType) {
        switch (emailType) {
          case 'welcome':
            updatedPreferences.welcome_emails = false;
            break;
          case 'lesson_reminder':
            updatedPreferences.lesson_reminders = false;
            break;
          case 'marketing':
            updatedPreferences.marketing_emails = false;
            break;
          case 'system':
            updatedPreferences.system_notifications = false;
            break;
          default:
            updatedPreferences.all_emails = true;
        }
      } else {
        // Unsubscribe from all emails
        updatedPreferences.welcome_emails = false;
        updatedPreferences.lesson_reminders = false;
        updatedPreferences.marketing_emails = false;
        updatedPreferences.all_emails = true;
      }

      updatedPreferences.unsubscribed_at = new Date().toISOString();

      // Save updated preferences
      const { error: updateError } = await this.supabase
        .from('user_email_preferences')
        .upsert(updatedPreferences);

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return {
          success: false,
          message: 'Failed to update email preferences'
        };
      }

      // Mark token as used
      await this.supabase
        .from('unsubscribe_tokens')
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('token', token);

      // Log unsubscribe event
      await this.logUnsubscribeEvent(tokenData.user_id, emailType, tokenData.email);

      return {
        success: true,
        message: emailType 
          ? `Successfully unsubscribed from ${emailType} emails`
          : 'Successfully unsubscribed from all emails',
        preferences: {
          userId: updatedPreferences.user_id,
          email: updatedPreferences.email,
          welcomeEmails: updatedPreferences.welcome_emails,
          lessonReminders: updatedPreferences.lesson_reminders,
          marketingEmails: updatedPreferences.marketing_emails,
          systemNotifications: updatedPreferences.system_notifications,
          allEmails: updatedPreferences.all_emails,
          unsubscribedAt: new Date(updatedPreferences.unsubscribed_at)
        }
      };
    } catch (error) {
      console.error('Error in processUnsubscribe:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request'
      };
    }
  }

  /**
   * Get user email preferences
   */
  async getUserPreferences(userId: string): Promise<UnsubscribePreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        userId: data.user_id,
        email: data.email,
        welcomeEmails: data.welcome_emails,
        lessonReminders: data.lesson_reminders,
        marketingEmails: data.marketing_emails,
        systemNotifications: data.system_notifications,
        allEmails: data.all_emails,
        unsubscribedAt: data.unsubscribed_at ? new Date(data.unsubscribed_at) : undefined,
        resubscribedAt: data.resubscribed_at ? new Date(data.resubscribed_at) : undefined
      };
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  /**
   * Update user email preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UnsubscribePreferences>
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (preferences.welcomeEmails !== undefined) {
        updateData.welcome_emails = preferences.welcomeEmails;
      }
      if (preferences.lessonReminders !== undefined) {
        updateData.lesson_reminders = preferences.lessonReminders;
      }
      if (preferences.marketingEmails !== undefined) {
        updateData.marketing_emails = preferences.marketingEmails;
      }
      if (preferences.systemNotifications !== undefined) {
        updateData.system_notifications = preferences.systemNotifications;
      }
      if (preferences.allEmails !== undefined) {
        updateData.all_emails = preferences.allEmails;
      }

      // If re-subscribing to any emails, clear unsubscribe date
      const isResubscribing = Object.values(updateData).some(value => value === true);
      if (isResubscribing) {
        updateData.resubscribed_at = new Date().toISOString();
        updateData.unsubscribed_at = null;
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await this.supabase
        .from('user_email_preferences')
        .upsert({
          user_id: userId,
          email: preferences.email,
          ...updateData
        });

      if (error) {
        console.error('Error updating user preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      return false;
    }
  }

  /**
   * Check if user should receive specific email type
   */
  async shouldReceiveEmail(userId: string, emailType: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        // Default to true if no preferences set
        return true;
      }

      // If unsubscribed from all emails
      if (preferences.allEmails) {
        return false;
      }

      // Check specific email type preferences
      switch (emailType) {
        case 'welcome':
          return preferences.welcomeEmails;
        case 'lesson_reminder':
          return preferences.lessonReminders;
        case 'marketing':
          return preferences.marketingEmails;
        case 'system':
          return preferences.systemNotifications;
        default:
          return !preferences.allEmails;
      }
    } catch (error) {
      console.error('Error checking email preferences:', error);
      // Default to true on error to avoid blocking important emails
      return true;
    }
  }

  /**
   * Add unsubscribe link to email content
   */
  addUnsubscribeLinkToEmail(
    htmlContent: string, 
    unsubscribeUrl: string,
    emailType?: string
  ): string {
    const unsubscribeText = emailType 
      ? `Unsubscribe from ${emailType} emails`
      : 'Unsubscribe from all emails';

    const unsubscribeHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>
          If you no longer wish to receive these emails, you can 
          <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">
            ${unsubscribeText}
          </a>
        </p>
        <p style="margin-top: 10px;">
          You can also <a href="${this.baseUrl}/settings/notifications" style="color: #666; text-decoration: underline;">
            manage your email preferences
          </a> at any time.
        </p>
      </div>
    `;

    // Try to insert before closing body tag, otherwise append
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${unsubscribeHtml}</body>`);
    } else {
      return htmlContent + unsubscribeHtml;
    }
  }

  /**
   * Clean up expired unsubscribe tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('unsubscribe_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up expired tokens:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredTokens:', error);
      return 0;
    }
  }

  /**
   * Get unsubscribe statistics
   */
  async getUnsubscribeStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    totalUnsubscribes: number;
    unsubscribesByType: Record<string, number>;
    resubscribes: number;
    activePreferences: number;
  }> {
    try {
      let query = this.supabase
        .from('user_email_preferences')
        .select('*');

      if (dateFrom) {
        query = query.gte('unsubscribed_at', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('unsubscribed_at', dateTo.toISOString());
      }

      const { data: preferences, error } = await query;

      if (error) {
        console.error('Error fetching unsubscribe statistics:', error);
        return {
          totalUnsubscribes: 0,
          unsubscribesByType: {},
          resubscribes: 0,
          activePreferences: 0
        };
      }

      const stats = {
        totalUnsubscribes: 0,
        unsubscribesByType: {} as Record<string, number>,
        resubscribes: 0,
        activePreferences: preferences?.length || 0
      };

      preferences?.forEach(pref => {
        if (pref.unsubscribed_at) {
          stats.totalUnsubscribes++;
        }

        if (pref.resubscribed_at) {
          stats.resubscribes++;
        }

        // Count unsubscribes by type
        if (!pref.welcome_emails) {
          stats.unsubscribesByType.welcome = (stats.unsubscribesByType.welcome || 0) + 1;
        }
        if (!pref.lesson_reminders) {
          stats.unsubscribesByType.lesson_reminder = (stats.unsubscribesByType.lesson_reminder || 0) + 1;
        }
        if (!pref.marketing_emails) {
          stats.unsubscribesByType.marketing = (stats.unsubscribesByType.marketing || 0) + 1;
        }
        if (!pref.system_notifications) {
          stats.unsubscribesByType.system = (stats.unsubscribesByType.system || 0) + 1;
        }
        if (pref.all_emails) {
          stats.unsubscribesByType.all = (stats.unsubscribesByType.all || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getUnsubscribeStatistics:', error);
      return {
        totalUnsubscribes: 0,
        unsubscribesByType: {},
        resubscribes: 0,
        activePreferences: 0
      };
    }
  }

  /**
   * Log unsubscribe event for analytics
   */
  private async logUnsubscribeEvent(
    userId: string, 
    emailType: string | undefined, 
    email: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('email_logs')
        .insert({
          template_type: 'unsubscribe',
          recipient_email: email,
          subject: 'Unsubscribe Event',
          status: 'delivered',
          metadata: {
            event_type: 'unsubscribe',
            email_type: emailType || 'all',
            user_id: userId,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Error logging unsubscribe event:', error);
      // Don't throw error to avoid breaking unsubscribe process
    }
  }
}

// Export singleton instance
export const unsubscribeService = new UnsubscribeService();