/**
 * Email Integration Service
 * Integrates the email management system with existing application features
 */

import { supabase } from './supabase';
import { decryptPassword } from './email-encryption';
import { unsubscribeService } from './unsubscribe-service';
import { gdprService } from './gdpr-compliance-service';
import { auditLogger, AUDIT_ACTIONS, AUDIT_RESOURCES } from './audit-logging-service';

export interface EmailIntegrationConfig {
  maxRetryAttempts: number;
  retryDelayMinutes: number;
  exponentialBackoff: boolean;
  fallbackSMTPConfigId?: string;
}

export interface EmailContext {
  userId?: string;
  userEmail: string;
  templateType: 'welcome' | 'lesson_reminder' | 'password_reset' | 'custom';
  templateData: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
}

export interface UserNotificationPreferences {
  userId: string;
  welcomeEmails: boolean;
  lessonReminders: boolean;
  passwordResetEmails: boolean;
  customEmails: boolean;
  reminderTimingMinutes: number;
}

export class EmailIntegrationService {
  private static readonly DEFAULT_CONFIG: EmailIntegrationConfig = {
    maxRetryAttempts: 3,
    retryDelayMinutes: 5,
    exponentialBackoff: true,
    fallbackSMTPConfigId: undefined
  };

  /**
   * Send an email using the configured email management system
   */
  static async sendEmail(context: EmailContext): Promise<{ success: boolean; error?: string; logId?: string }> {
    try {
      // Check user notification preferences first
      if (context.userId) {
        const preferences = await this.getUserNotificationPreferences(context.userId);
        if (!this.shouldSendEmail(context.templateType, preferences)) {
          return { success: false, error: 'User has disabled this email type' };
        }

        // Check unsubscribe preferences
        const shouldReceive = await unsubscribeService.shouldReceiveEmail(context.userId, context.templateType);
        if (!shouldReceive) {
          return { success: false, error: 'User has unsubscribed from this email type' };
        }

        // Check GDPR consent if required
        const hasConsent = await gdprService.hasConsent(context.userId, `email_${context.templateType}`);
        if (!hasConsent && this.requiresConsent(context.templateType)) {
          return { success: false, error: 'User consent required for this email type' };
        }
      }

      // Get active SMTP configuration
      const smtpConfig = await this.getActiveSMTPConfig();
      if (!smtpConfig) {
        return { success: false, error: 'No active SMTP configuration found' };
      }

      // Get email template
      const template = await this.getEmailTemplate(context.templateType);
      if (!template) {
        return { success: false, error: `No active template found for type: ${context.templateType}` };
      }

      // Validate template for GDPR compliance
      const complianceCheck = await gdprService.validateTemplateCompliance(template.html_content, context.templateType);
      if (!complianceCheck.compliant) {
        console.warn('Template compliance issues:', complianceCheck.issues);
        // Log compliance warning but continue (non-blocking)
        await auditLogger.logEvent({
          userId: context.userId || 'system',
          action: 'template_compliance_warning',
          resource: AUDIT_RESOURCES.EMAIL_TEMPLATE,
          resourceId: template.id,
          details: { issues: complianceCheck.issues, warnings: complianceCheck.warnings }
        });
      }

      // Render template with data
      const renderedEmail = await this.renderTemplate(template, context.templateData);

      // Add unsubscribe link if applicable
      let finalHtmlContent = renderedEmail.htmlContent;
      if (context.userId && this.shouldIncludeUnsubscribeLink(context.templateType)) {
        const unsubscribeLink = await unsubscribeService.generateUnsubscribeLink(
          context.userId,
          context.userEmail,
          context.templateType
        );
        finalHtmlContent = unsubscribeService.addUnsubscribeLinkToEmail(
          renderedEmail.htmlContent,
          unsubscribeLink.url,
          context.templateType
        );
      }

      // Send email via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-integrated-email', {
        body: {
          smtpConfigId: smtpConfig.id,
          templateId: template.id,
          recipientEmail: context.userEmail,
          subject: renderedEmail.subject,
          htmlContent: finalHtmlContent,
          textContent: renderedEmail.textContent,
          templateData: context.templateData,
          priority: context.priority || 'normal',
          scheduledFor: context.scheduledFor,
          userId: context.userId
        }
      });

      if (error) {
        // Log email failure
        await auditLogger.logEvent({
          userId: context.userId || 'system',
          action: AUDIT_ACTIONS.TEST_EMAIL_FAILED,
          resource: AUDIT_RESOURCES.EMAIL_LOG,
          details: {
            template_type: context.templateType,
            recipient_email: context.userEmail,
            error: error.message
          }
        });

        // Implement retry logic
        return await this.handleEmailFailure(context, error.message);
      }

      // Log successful email send
      await auditLogger.logEvent({
        userId: context.userId || 'system',
        action: 'email_sent_successfully',
        resource: AUDIT_RESOURCES.EMAIL_LOG,
        resourceId: data?.logId,
        details: {
          template_type: context.templateType,
          recipient_email: context.userEmail,
          priority: context.priority
        }
      });

      return { success: true, logId: data?.logId };
    } catch (error: any) {
      console.error('Email integration service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email for new user registration
   */
  static async sendWelcomeEmail(userEmail: string, userData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    const context: EmailContext = {
      userEmail,
      templateType: 'welcome',
      templateData: {
        user_name: userData.firstName || userData.first_name || 'User',
        user_email: userEmail,
        login_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        getting_started_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        support_email: process.env.SUPPORT_EMAIL || 'support@linguaflow.com',
        ...userData
      },
      priority: 'high'
    };

    return await this.sendEmail(context);
  }

  /**
   * Send lesson reminder email
   */
  static async sendLessonReminder(
    userEmail: string, 
    lessonData: Record<string, any>, 
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const context: EmailContext = {
      userId,
      userEmail,
      templateType: 'lesson_reminder',
      templateData: {
        user_name: lessonData.studentName || 'Student',
        lesson_title: lessonData.title || 'Upcoming Lesson',
        lesson_date: lessonData.date || new Date().toISOString(),
        lesson_time: lessonData.time || 'TBD',
        tutor_name: lessonData.tutorName || 'Your Tutor',
        lesson_url: lessonData.url || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        calendar_url: lessonData.calendarUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/calendar`,
        ...lessonData
      },
      priority: 'normal'
    };

    return await this.sendEmail(context);
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    userEmail: string, 
    resetData: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const context: EmailContext = {
      userEmail,
      templateType: 'password_reset',
      templateData: {
        user_name: resetData.userName || 'User',
        reset_url: resetData.resetUrl,
        expiry_time: resetData.expiryTime || '1 hour',
        support_email: process.env.SUPPORT_EMAIL || 'support@linguaflow.com',
        ...resetData
      },
      priority: 'high'
    };

    return await this.sendEmail(context);
  }

  /**
   * Schedule lesson reminder emails based on calendar events
   */
  static async scheduleLessonReminders(): Promise<{ scheduled: number; errors: string[] }> {
    try {
      // Get upcoming lessons from calendar_events table
      const { data: upcomingLessons, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          tutors!inner(email, first_name, last_name),
          students!inner(email, first_name, last_name)
        `)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) // Next 24 hours
        .eq('status', 'confirmed');

      if (error) {
        throw error;
      }

      const scheduled = [];
      const errors = [];

      for (const lesson of upcomingLessons || []) {
        try {
          // Check if reminder already scheduled
          const { data: existingReminder } = await supabase
            .from('email_logs')
            .select('id')
            .eq('template_type', 'lesson_reminder')
            .eq('recipient_email', lesson.students.email)
            .eq('metadata->lesson_id', lesson.id)
            .eq('status', 'pending')
            .maybeSingle();

          if (existingReminder) {
            continue; // Already scheduled
          }

          // Get reminder timing from settings
          const reminderMinutes = await this.getLessonReminderTiming();
          const reminderTime = new Date(new Date(lesson.start_time).getTime() - reminderMinutes * 60 * 1000);

          // Only schedule if reminder time is in the future
          if (reminderTime > new Date()) {
            const result = await this.sendLessonReminder(
              lesson.students.email,
              {
                title: lesson.title || 'Lesson',
                date: new Date(lesson.start_time).toLocaleDateString(),
                time: new Date(lesson.start_time).toLocaleTimeString(),
                tutorName: `${lesson.tutors.first_name} ${lesson.tutors.last_name}`.trim(),
                studentName: `${lesson.students.first_name} ${lesson.students.last_name}`.trim(),
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
                calendarUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/calendar`,
                lessonId: lesson.id
              },
              lesson.student_id
            );

            if (result.success) {
              scheduled.push(lesson.id);
            } else {
              errors.push(`Failed to schedule reminder for lesson ${lesson.id}: ${result.error}`);
            }
          }
        } catch (lessonError: any) {
          errors.push(`Error processing lesson ${lesson.id}: ${lessonError.message}`);
        }
      }

      return { scheduled: scheduled.length, errors };
    } catch (error: any) {
      console.error('Error scheduling lesson reminders:', error);
      return { scheduled: 0, errors: [error.message] };
    }
  }

  /**
   * Get user notification preferences
   */
  private static async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      // Return default preferences if none found
      return {
        userId,
        welcomeEmails: true,
        lessonReminders: true,
        passwordResetEmails: true,
        customEmails: true,
        reminderTimingMinutes: 15
      };
    }

    return {
      userId: data.user_id,
      welcomeEmails: data.welcome_emails ?? true,
      lessonReminders: data.lesson_reminders ?? true,
      passwordResetEmails: data.password_reset_emails ?? true,
      customEmails: data.custom_emails ?? true,
      reminderTimingMinutes: data.reminder_timing_minutes ?? 15
    };
  }

  /**
   * Check if email should be sent based on user preferences
   */
  private static shouldSendEmail(templateType: string, preferences: UserNotificationPreferences): boolean {
    switch (templateType) {
      case 'welcome':
        return preferences.welcomeEmails;
      case 'lesson_reminder':
        return preferences.lessonReminders;
      case 'password_reset':
        return preferences.passwordResetEmails;
      case 'custom':
        return preferences.customEmails;
      default:
        return true;
    }
  }

  /**
   * Get active SMTP configuration
   */
  private static async getActiveSMTPConfig() {
    const { data, error } = await supabase
      .from('email_smtp_configs')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching SMTP config:', error);
      return null;
    }

    return data;
  }

  /**
   * Get email template by type
   */
  private static async getEmailTemplate(templateType: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', templateType)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email template:', error);
      return null;
    }

    return data;
  }

  /**
   * Render template with data
   */
  private static async renderTemplate(template: any, templateData: Record<string, any>) {
    const replacePlaceholders = (text: string, data: Record<string, any>): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    return {
      subject: replacePlaceholders(template.subject, templateData),
      htmlContent: replacePlaceholders(template.html_content, templateData),
      textContent: replacePlaceholders(template.text_content || '', templateData)
    };
  }

  /**
   * Handle email failure with retry logic
   */
  private static async handleEmailFailure(context: EmailContext, error: string): Promise<{ success: boolean; error: string }> {
    // For now, just return the error. In a full implementation, this would:
    // 1. Check retry count
    // 2. Schedule retry with exponential backoff
    // 3. Try fallback SMTP config if available
    // 4. Log failure for monitoring
    
    console.error('Email delivery failed:', error);
    return { success: false, error };
  }

  /**
   * Get lesson reminder timing from settings
   */
  private static async getLessonReminderTiming(): Promise<number> {
    const { data, error } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'lesson_reminder_timing')
      .maybeSingle();

    if (error || !data) {
      return 15; // Default 15 minutes
    }

    return data.setting_value?.minutes || 15;
  }

  /**
   * Check if email type requires explicit consent
   */
  private static requiresConsent(templateType: string): boolean {
    // Marketing emails typically require explicit consent under GDPR
    const consentRequiredTypes = ['marketing', 'newsletter', 'promotional'];
    return consentRequiredTypes.includes(templateType);
  }

  /**
   * Check if unsubscribe link should be included
   */
  private static shouldIncludeUnsubscribeLink(templateType: string): boolean {
    // All non-transactional emails should include unsubscribe links
    const transactionalTypes = ['password_reset', 'account_verification', 'security_alert'];
    return !transactionalTypes.includes(templateType);
  }

  /**
   * Record user consent for email communications
   */
  static async recordEmailConsent(
    userId: string,
    emailType: string,
    granted: boolean,
    legalBasis: 'consent' | 'contract' | 'legitimate_interests' = 'consent'
  ): Promise<void> {
    try {
      await gdprService.recordConsent({
        userId,
        purpose: `email_${emailType}`,
        granted,
        grantedAt: granted ? new Date() : undefined,
        revokedAt: !granted ? new Date() : undefined,
        legalBasis
      });

      // Log consent action
      await auditLogger.logEvent({
        userId,
        action: granted ? 'consent_granted' : 'consent_revoked',
        resource: 'gdpr_consent',
        details: {
          email_type: emailType,
          legal_basis: legalBasis
        }
      });
    } catch (error) {
      console.error('Error recording email consent:', error);
      throw error;
    }
  }

  /**
   * Anonymize user data in email logs (for GDPR compliance)
   */
  static async anonymizeUserEmailData(userId: string): Promise<number> {
    try {
      const anonymizedCount = await gdprService.anonymizeEmailLogs(userId);

      // Log anonymization
      await auditLogger.logEvent({
        userId: 'system',
        action: AUDIT_ACTIONS.DATA_PURGED,
        resource: AUDIT_RESOURCES.EMAIL_LOG,
        details: {
          anonymized_user: userId,
          records_anonymized: anonymizedCount
        }
      });

      return anonymizedCount;
    } catch (error) {
      console.error('Error anonymizing user email data:', error);
      throw error;
    }
  }

  /**
   * Export user's email data (for GDPR data portability)
   */
  static async exportUserEmailData(userId: string): Promise<any> {
    try {
      const exportData = await gdprService.exportUserData(userId);

      // Log data export
      await auditLogger.logEvent({
        userId,
        action: AUDIT_ACTIONS.DATA_EXPORTED,
        resource: 'user_data',
        details: {
          export_type: 'email_data',
          records_exported: Object.values(exportData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
        }
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting user email data:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences with audit logging
   */
  static async updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<boolean> {
    try {
      const { data: currentPrefs } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          welcome_emails: preferences.welcomeEmails,
          lesson_reminders: preferences.lessonReminders,
          password_reset_emails: preferences.passwordResetEmails,
          custom_emails: preferences.customEmails,
          reminder_timing_minutes: preferences.reminderTimingMinutes,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Log preference change
      await auditLogger.logEvent({
        userId,
        action: 'notification_preferences_updated',
        resource: 'user_preferences',
        oldValues: currentPrefs,
        newValues: preferences,
        details: {
          changed_fields: Object.keys(preferences)
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
}