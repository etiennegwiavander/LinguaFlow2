/**
 * Centralized Email Sending Service
 * Uses the active SMTP configuration and unified sender
 */

import { createClient } from '@supabase/supabase-js';
import { sendEmail, EmailOptions, EmailResult } from './unified-email-sender';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Send email using the active SMTP configuration
 */
export async function sendEmailWithActiveConfig(
  options: Omit<EmailOptions, 'from'>
): Promise<EmailResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get active SMTP configuration
    const { data: config, error } = await supabase
      .from('email_smtp_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !config) {
      const errorMsg = 'No active SMTP configuration found. Please configure email settings in the admin portal.';
      
      // Log the failed attempt
      await supabase.from('email_logs').insert({
        template_type: 'system',
        recipient_email: Array.isArray(options.to) ? options.to[0] : options.to,
        subject: options.subject,
        status: 'failed',
        error_message: errorMsg,
        is_test: false,
      });

      return {
        success: false,
        message: errorMsg,
      };
    }

    // Prepare email config for unified sender
    const emailConfig = {
      provider: config.provider,
      host: config.host,
      port: config.port,
      username: config.username,
      password_encrypted: config.password_encrypted,
      from_email: config.from_email,
      from_name: config.from_name,
      encryption: config.encryption,
    };

    // Send email using unified sender
    const result = await sendEmail(emailConfig, options);

    // Log the attempt
    await supabase.from('email_logs').insert({
      template_type: 'system',
      recipient_email: Array.isArray(options.to) ? options.to[0] : options.to,
      subject: options.subject,
      status: result.success ? 'sent' : 'failed',
      error_message: result.success ? null : result.message,
      is_test: false,
      metadata: {
        smtp_config_id: config.id,
        provider: config.provider,
        message_id: result.messageId,
      },
    });

    return result;
  } catch (error: any) {
    const errorMsg = error.message || 'Failed to send email';
    
    // Log the error
    await supabase.from('email_logs').insert({
      template_type: 'system',
      recipient_email: Array.isArray(options.to) ? options.to[0] : options.to,
      subject: options.subject,
      status: 'failed',
      error_message: errorMsg,
      is_test: false,
    });

    return {
      success: false,
      message: errorMsg,
      details: error,
    };
  }
}
