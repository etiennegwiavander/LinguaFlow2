import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPPORT_EMAIL = 'linguaflowservices@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SupportTicketData {
  ticketId: string
  userName: string
  userEmail: string
  subject: string
  message: string
  impact: string
  attachmentCount: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { ticketData } = await req.json() as { ticketData: SupportTicketData }

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #4b5563; }
          .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
          .impact { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .impact-low { background: #d1fae5; color: #065f46; }
          .impact-medium { background: #fef3c7; color: #92400e; }
          .impact-high { background: #fed7aa; color: #9a3412; }
          .impact-critical { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
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
                <span class="impact impact-${ticketData.impact}">${ticketData.impact.toUpperCase()}</span>
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
                <br><small style="color: #6b7280;">View attachments in Supabase Dashboard</small>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This ticket was submitted via LinguaFlow Support System</p>
            <p>View ticket details in your Supabase Dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Supabase's integrated email service
    // Note: You'll need to configure SMTP settings in Supabase
    const { error: emailError } = await supabaseClient.functions.invoke('send-integrated-email', {
      body: {
        to: SUPPORT_EMAIL,
        subject: `[Support Ticket] ${ticketData.subject}`,
        html: emailHtml,
        replyTo: ticketData.userEmail,
      }
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails - ticket is already saved
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Ticket saved but email notification failed',
          error: emailError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Support ticket email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-support-ticket-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
