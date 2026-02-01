import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // TODO: Send confirmation email to user
    // TODO: Notify admin/support team

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

    // TODO: Send thank you email to user

  } catch (error) {
    console.error('Error handling feedback email:', error);
    throw error;
  }
}
