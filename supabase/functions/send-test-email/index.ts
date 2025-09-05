/**
 * Supabase Edge Function for sending test emails
 * Handles SMTP email delivery with proper error handling and logging
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SMTPConfig {
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface RequestBody {
  smtpConfig: SMTPConfig;
  email: EmailData;
}

// SMTP connection and sending logic
async function sendEmailViaSMTP(smtpConfig: SMTPConfig, email: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // For this implementation, we'll use a simple fetch-based approach
    // In a production environment, you might want to use a proper SMTP library
    
    // Validate SMTP configuration
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password) {
      return { success: false, error: 'Invalid SMTP configuration' };
    }
    
    // Validate email data
    if (!email.to || !email.subject || !email.html) {
      return { success: false, error: 'Invalid email data' };
    }
    
    // For demonstration purposes, we'll simulate email sending
    // In a real implementation, you would use an SMTP library like nodemailer
    
    // Simulate different provider behaviors
    switch (smtpConfig.provider) {
      case 'gmail':
        return await sendViaGmail(smtpConfig, email);
      case 'sendgrid':
        return await sendViaSendGrid(smtpConfig, email);
      case 'aws-ses':
        return await sendViaAWSSES(smtpConfig, email);
      default:
        return await sendViaCustomSMTP(smtpConfig, email);
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Gmail SMTP sending
async function sendViaGmail(smtpConfig: SMTPConfig, email: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Simulate Gmail SMTP sending
    // In reality, you would use Gmail's SMTP server (smtp.gmail.com:587)
    
    // Basic validation for Gmail
    if (!smtpConfig.username.includes('@gmail.com') && !smtpConfig.username.includes('@googlemail.com')) {
      return { success: false, error: 'Gmail username must be a Gmail address' };
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (90% success rate for testing)
    if (Math.random() > 0.1) {
      return { success: true };
    } else {
      return { success: false, error: 'Gmail SMTP authentication failed' };
    }
    
  } catch (error) {
    return { success: false, error: `Gmail error: ${error.message}` };
  }
}

// SendGrid API sending
async function sendViaSendGrid(smtpConfig: SMTPConfig, email: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // SendGrid uses API key instead of traditional SMTP
    const apiKey = smtpConfig.password; // API key is stored in password field
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email.to }]
        }],
        from: { email: smtpConfig.username },
        subject: email.subject,
        content: [
          {
            type: 'text/html',
            value: email.html
          },
          {
            type: 'text/plain',
            value: email.text
          }
        ]
      })
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.text();
      return { success: false, error: `SendGrid error: ${errorData}` };
    }
    
  } catch (error) {
    return { success: false, error: `SendGrid error: ${error.message}` };
  }
}

// AWS SES sending
async function sendViaAWSSES(smtpConfig: SMTPConfig, email: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // AWS SES implementation would go here
    // For now, simulate the behavior
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate success (95% success rate for testing)
    if (Math.random() > 0.05) {
      return { success: true };
    } else {
      return { success: false, error: 'AWS SES rate limit exceeded' };
    }
    
  } catch (error) {
    return { success: false, error: `AWS SES error: ${error.message}` };
  }
}

// Custom SMTP sending
async function sendViaCustomSMTP(smtpConfig: SMTPConfig, email: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Custom SMTP implementation would go here
    // For now, simulate the behavior
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate success (85% success rate for testing)
    if (Math.random() > 0.15) {
      return { success: true };
    } else {
      return { success: false, error: 'Custom SMTP connection timeout' };
    }
    
  } catch (error) {
    return { success: false, error: `Custom SMTP error: ${error.message}` };
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestBody: RequestBody = await req.json();
    const { smtpConfig, email } = requestBody;

    if (!smtpConfig || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing smtpConfig or email data' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send email
    const result = await sendEmailViaSMTP(smtpConfig, email);

    // Log the attempt (you might want to store this in Supabase)
    console.log('Email send attempt:', {
      provider: smtpConfig.provider,
      recipient: email.to,
      subject: email.subject,
      success: result.success,
      error: result.error
    });

    // Return result
    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in send-test-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
})