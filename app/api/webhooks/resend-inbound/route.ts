import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend client for forwarding
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    console.log('📧 Received inbound email from Resend');

    // Parse the incoming email data from Resend
    const emailData = await req.json();

    console.log('Email data:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
    });

    // Extract email details
    const {
      from,
      to,
      subject,
      html,
      text,
      reply_to,
      headers,
    } = emailData;

    // Determine which type of email this is based on the "to" address
    const toAddress = to.toLowerCase();

    if (toAddress.includes('support@')) {
      // Handle support ticket
      await handleSupportEmail({
        from,
        subject,
        html,
        text,
        reply_to,
      });
    } else if (toAddress.includes('feedback@')) {
      // Handle feedback
      await handleFeedbackEmail({
        from,
        subject,
        html,
        text,
      });
    } else {
      console.log('⚠️ Unknown recipient:', to);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email processed successfully' 
    });

  } catch (error) {
    console.error('❌ Error processing inbound email:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}

async function handleSupportEmail(data: {
  from: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
}) {
  console.log('🎫 Processing support ticket from:', data.from);

  try {
    // Store in support_tickets table
    const { error } = await supabase
      .from('support_tickets')
      .insert({
        email: data.from,
        subject: data.subject,
        message: data.text || data.html || '',
        status: 'open',
        source: 'email_reply',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing support ticket:', error);
      throw error;
    }

    console.log('✅ Support ticket created successfully');

    // Forward email notification to admin
    try {
      await resend.emails.send({
        from: 'LinguaFlow Support <support@linguaflow.online>',
        to: 'linguaflowservices@gmail.com',
        subject: `[SUPPORT TICKET] ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">🎫 New Support Ticket</h2>
            </div>
            <div style="background-color: #f3f4f6; padding: 20px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${data.from}</p>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${data.subject}</p>
              <p style="margin: 0 0 10px 0;"><strong>Received at:</strong> support@linguaflow.online</p>
              <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h3 style="margin-top: 0;">Message:</h3>
              <div style="white-space: pre-wrap; background-color: #f9fafb; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626;">
                ${data.text || data.html || 'No message content'}
              </div>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #6b7280;">
              <p style="margin: 0;">This email was sent to <strong>support@linguaflow.online</strong></p>
              <p style="margin: 5px 0 0 0;">View in admin portal: <a href="https://linguaflow.online/support">Support Dashboard</a></p>
            </div>
          </div>
        `,
      });
      console.log('✅ Support notification forwarded to linguaflowservices@gmail.com');
    } catch (forwardError) {
      console.error('❌ Failed to forward support notification:', forwardError);
      // Don't fail the main request if forwarding fails
    }

    // TODO: Send confirmation email to user

  } catch (error) {
    console.error('Error handling support email:', error);
    throw error;
  }
}

async function handleFeedbackEmail(data: {
  from: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  console.log('💬 Processing feedback from:', data.from);

  try {
    // Store in feedback table
    const { error } = await supabase
      .from('feedback')
      .insert({
        email: data.from,
        subject: data.subject,
        message: data.text || data.html || '',
        status: 'new',
        source: 'email',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing feedback:', error);
      throw error;
    }

    console.log('✅ Feedback stored successfully');

    // Forward email notification to admin
    try {
      await resend.emails.send({
        from: 'LinguaFlow Feedback <feedback@linguaflow.online>',
        to: 'linguaflowservices@gmail.com',
        subject: `[FEEDBACK] ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">💬 New Feedback</h2>
            </div>
            <div style="background-color: #f3f4f6; padding: 20px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${data.from}</p>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${data.subject}</p>
              <p style="margin: 0 0 10px 0;"><strong>Received at:</strong> feedback@linguaflow.online</p>
              <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h3 style="margin-top: 0;">Message:</h3>
              <div style="white-space: pre-wrap; background-color: #f9fafb; padding: 15px; border-radius: 5px; border-left: 4px solid #059669;">
                ${data.text || data.html || 'No message content'}
              </div>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #6b7280;">
              <p style="margin: 0;">This email was sent to <strong>feedback@linguaflow.online</strong></p>
              <p style="margin: 5px 0 0 0;">View in admin portal: <a href="https://linguaflow.online/feedback">Feedback Dashboard</a></p>
            </div>
          </div>
        `,
      });
      console.log('✅ Feedback notification forwarded to linguaflowservices@gmail.com');
    } catch (forwardError) {
      console.error('❌ Failed to forward feedback notification:', forwardError);
      // Don't fail the main request if forwarding fails
    }

    // TODO: Send thank you email to user

  } catch (error) {
    console.error('Error handling feedback email:', error);
    throw error;
  }
}
