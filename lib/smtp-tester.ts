/**
 * SMTP Connection Testing
 * Tests SMTP configurations to verify connectivity and authentication
 */

import nodemailer from 'nodemailer';
import { SMTPConfig } from './smtp-validation';

export interface SMTPTestResult {
  success: boolean;
  message: string;
  details?: {
    connectionTime?: number;
    authenticationTime?: number;
    error?: string;
    errorCode?: string;
  };
}

/**
 * Tests SMTP configuration by attempting to connect and authenticate
 */
export async function testSMTPConnection(config: SMTPConfig): Promise<SMTPTestResult> {
  const startTime = Date.now();
  
  try {
    // Create transporter with the provided configuration
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl', // true for 465, false for other ports
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        // Don't fail on invalid certs for testing
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 10000, // 10 seconds
    });

    // Verify the connection
    const connectionStart = Date.now();
    await transporter.verify();
    const connectionTime = Date.now() - connectionStart;

    // Test authentication by sending a test email to a non-existent address
    // This will fail at the recipient validation stage, but confirms auth works
    const authStart = Date.now();
    try {
      await transporter.sendMail({
        from: config.username,
        to: 'test-connection@nonexistent-domain-for-testing.com',
        subject: 'SMTP Connection Test',
        text: 'This is a connection test email.',
      });
    } catch (error: any) {
      // Expected to fail due to invalid recipient, but should not be auth error
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        throw error; // Authentication failed
      }
      // Other errors are expected (invalid recipient, etc.)
    }
    const authenticationTime = Date.now() - authStart;

    const totalTime = Date.now() - startTime;

    return {
      success: true,
      message: `SMTP connection successful (${totalTime}ms)`,
      details: {
        connectionTime,
        authenticationTime,
      },
    };

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    
    return {
      success: false,
      message: getErrorMessage(error),
      details: {
        connectionTime: totalTime,
        error: error.message,
        errorCode: error.code || error.responseCode,
      },
    };
  }
}

/**
 * Sends a test email to verify end-to-end functionality
 */
export async function sendTestEmail(
  config: SMTPConfig,
  testEmail: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }
): Promise<SMTPTestResult> {
  const startTime = Date.now();

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: config.username,
      to: testEmail.to,
      subject: testEmail.subject,
      html: testEmail.html,
      text: testEmail.text || 'Test email from SMTP configuration',
    });

    const totalTime = Date.now() - startTime;

    return {
      success: true,
      message: `Test email sent successfully (${totalTime}ms)`,
      details: {
        connectionTime: totalTime,
      },
    };

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    return {
      success: false,
      message: getErrorMessage(error),
      details: {
        connectionTime: totalTime,
        error: error.message,
        errorCode: error.code || error.responseCode,
      },
    };
  }
}

/**
 * Converts error objects to user-friendly messages
 */
function getErrorMessage(error: any): string {
  const code = error.code || error.responseCode;
  const message = error.message || 'Unknown error';

  switch (code) {
    case 'EAUTH':
    case 535:
      return 'Authentication failed. Please check your username and password.';
    case 'ECONNECTION':
    case 'ECONNREFUSED':
      return 'Connection refused. Please check the host and port settings.';
    case 'ETIMEDOUT':
    case 'ECONNECTIONTIMEOUT':
      return 'Connection timed out. Please check your network connection and firewall settings.';
    case 'ENOTFOUND':
      return 'Host not found. Please check the SMTP server address.';
    case 'ESOCKET':
      return 'Socket error. Please check your network connection.';
    case 550:
      return 'Mailbox unavailable. The recipient address may be invalid.';
    case 551:
      return 'User not local. The recipient is not on this server.';
    case 552:
      return 'Exceeded storage allocation. The mailbox is full.';
    case 553:
      return 'Mailbox name not allowed. The recipient address is invalid.';
    case 554:
      return 'Transaction failed. The email was rejected by the server.';
    case 'EMESSAGE':
      return 'Message error. Please check the email content.';
    default:
      // Try to extract meaningful information from the message
      if (message.includes('authentication')) {
        return 'Authentication failed. Please verify your credentials.';
      }
      if (message.includes('connection')) {
        return 'Connection failed. Please check your network settings.';
      }
      if (message.includes('timeout')) {
        return 'Connection timed out. Please try again or check your settings.';
      }
      if (message.includes('certificate') || message.includes('SSL') || message.includes('TLS')) {
        return 'SSL/TLS error. Please check your encryption settings.';
      }
      
      return `SMTP Error: ${message}`;
  }
}

/**
 * Validates email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}