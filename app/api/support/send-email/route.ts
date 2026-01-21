import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPPORT_EMAIL = 'linguaflowservices@gmail.com';

export async function POST(request: Request) {
  try {
    const { ticketData } = await request.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #4b5563; margin-bottom: 5px; }
          .value { padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
          .impact { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .impact-low { background: #d1fae5; color: #065f46; }
          .impact-medium { background: #fef3c7; color: #92400e; }
          .impact-high { background: #fed7aa; color: #9a3412; }
          .impact-critical { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">🎫 New Support Ticket</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">LinguaFlow Support System</p>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="label">Ticket ID:</div>
            <div class="value"><code>${ticketData.ticketId}</code></div>
          </div>

          <div class="field">
            <div class="label">From:</div>
            <div class="value">
              <strong>${ticketData.userName}</strong><br>
              <a href="mailto:${ticketData.userEmail}">${ticketData.userEmail}</a>
            </div>
          </div>

          <div class="field">
            <div class="label">Subject:</div>
            <div class="value">${ticketData.subject}</div>
          </div>

          <div class="field">
            <div class="label">Impact Level:</div>
            <div class="value">
              <span class="impact impact-${ticketData.impact}">${ticketData.impact}</span>
            </div>
          </div>

          <div class="field">
            <div class="label">Message:</div>
            <div class="value" style="white-space: pre-wrap;">${ticketData.message}</div>
          </div>

          ${ticketData.attachmentCount > 0 ? `
          <div class="field">
            <div class="label">Attachments:</div>
            <div class="value">
              📎 ${ticketData.attachmentCount} file(s) attached
              <br><small style="color: #6b7280;">View attachments in Supabase Dashboard → Storage → support-attachments</small>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p><strong>Reply to this email to respond to the user directly</strong></p>
          <p>Ticket submitted: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Try to send via Supabase Edge Function first
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      const { data, error } = await supabase.functions.invoke('send-integrated-email', {
        body: {
          to: SUPPORT_EMAIL,
          subject: `[LinguaFlow Support] ${ticketData.subject}`,
          html: emailHtml,
          replyTo: ticketData.userEmail,
        }
      });

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully' 
      });
    } catch (supabaseError) {
      console.error('Supabase email error:', supabaseError);
      
      // Fallback: Try using fetch to send via a simple email service
      // You can configure this with Resend, SendGrid, or any other service
      
      // For now, return success since the ticket is saved in the database
      // The admin can check the database directly
      return NextResponse.json({ 
        success: true, 
        warning: 'Ticket saved but email notification may have failed. Please check Supabase dashboard.',
        ticketId: ticketData.ticketId
      });
    }

  } catch (error: any) {
    console.error('Error sending support email:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification', details: error.message },
      { status: 500 }
    );
  }
}
