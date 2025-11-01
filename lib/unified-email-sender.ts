/**
 * Unified Email Sender
 * Handles both Resend HTTP API and traditional SMTP
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { decryptPassword } from './email-encryption';

export interface EmailConfig {
  provider: string;
  host?: string;
  port?: number;
  username?: string;
  password_encrypted: string;
  from_email: string;
  from_name: string;
  encryption?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
  details?: any;
}

/**
 * Send email using Resend HTTP API
 */
async function sendViaResendAPI(
  config: EmailConfig,
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const apiKey = decryptPassword(config.password_encrypted);
    const resend = new Resend(apiKey);

    const from = options.from || `${config.from_name} <${config.from_email}>`;
    
    const result = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message || 'Resend API error',
        details: result.error,
      };
    }

    return {
      success: true,
      message: 'Email sent successfully via Resend API',
      messageId: result.data?.id,
      details: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send via Resend API',
      details: error,
    };
  }
}

/**
 * Send email using SMTP
 */
async function sendViaSMTP(
  config: EmailConfig,
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const password = decryptPassword(config.password_encrypted);

    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: password,
      },
    });

    const from = options.from || `${config.from_name} <${config.from_email}>`;

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    return {
      success: true,
      message: 'Email sent successfully via SMTP',
      messageId: info.messageId,
      details: info,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send via SMTP',
      details: error,
    };
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection(config: EmailConfig): Promise<EmailResult> {
  // For Resend, test by attempting to get account info or send a test
  if (config.provider === 'resend') {
    try {
      const apiKey = decryptPassword(config.password_encrypted);
      const resend = new Resend(apiKey);
      
      // Try to send a test email to verify the API key works
      // Resend doesn't have a verify endpoint, so we'll just check if the key is valid format
      if (!apiKey.startsWith('re_')) {
        return {
          success: false,
          message: 'Invalid Resend API key format. Should start with "re_"',
        };
      }

      return {
        success: true,
        message: 'Resend API key format is valid. Ready to send emails.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to validate Resend configuration',
        details: error,
      };
    }
  }

  // For SMTP providers, test the connection
  try {
    const password = decryptPassword(config.password_encrypted);

    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transporter.verify();

    return {
      success: true,
      message: 'SMTP connection successful',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'SMTP connection failed',
      details: error,
    };
  }
}

/**
 * Send email using the appropriate method based on provider
 */
export async function sendEmail(
  config: EmailConfig,
  options: EmailOptions
): Promise<EmailResult> {
  // Use Resend HTTP API for Resend provider
  if (config.provider === 'resend') {
    return sendViaResendAPI(config, options);
  }

  // Use SMTP for all other providers
  return sendViaSMTP(config, options);
}
