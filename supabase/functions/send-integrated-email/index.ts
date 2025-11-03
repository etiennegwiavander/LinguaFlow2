import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  smtpConfigId: string;
  templateId: string;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateData: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduledFor?: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      smtpConfigId, 
      templateId, 
      recipientEmail, 
      subject, 
      htmlContent, 
      textContent,
      templateData,
      priority = 'normal',
      scheduledFor,
      userId
    }: EmailRequest = await req.json()

    // Try to get SMTP configuration from database (optional)
    let fromEmail = 'LinguaFlow <noreply@linguaflow.online>' // Default sender with name
    
    try {
      const { data: smtpConfig } = await supabaseClient
        .from('email_smtp_configs')
        .select('username')
        .eq('id', smtpConfigId)
        .eq('is_active', true)
        .single()
      
      if (smtpConfig && smtpConfig.username) {
        // Ensure proper format: "Name <email@domain.com>"
        if (smtpConfig.username.includes('<')) {
          fromEmail = smtpConfig.username
        } else {
          fromEmail = `LinguaFlow <${smtpConfig.username}>`
        }
      }
    } catch (error) {
      console.log('No SMTP config found, using default sender:', fromEmail)
    }

    // Try to create email log entry (optional)
    let emailLogId = null
    try {
      const { data: emailLog } = await supabaseClient
        .from('email_logs')
        .insert({
          template_id: templateId,
          template_type: templateData.templateType || 'unknown',
          recipient_email: recipientEmail,
          subject: subject,
          status: scheduledFor ? 'scheduled' : 'pending',
          sent_at: scheduledFor ? null : new Date().toISOString(),
          scheduled_for: scheduledFor,
          is_test: false,
          metadata: {
            smtp_config_id: smtpConfigId,
            template_data: templateData,
            priority: priority,
            user_id: userId
          }
        })
        .select()
        .single()
      
      if (emailLog) {
        emailLogId = emailLog.id
      }
    } catch (error) {
      console.log('Could not create email log (table may not exist):', error)
    }

    // If scheduled for future, return success without sending
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          logId: emailLogId,
          message: 'Email scheduled successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Send email immediately using Resend API
    try {
      // Initialize Resend with API key from environment
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (!resendApiKey) {
        throw new Error('RESEND_API_KEY environment variable is not set')
      }

      const resend = new Resend(resendApiKey)

      console.log('Sending email via Resend:', {
        from: fromEmail,
        to: recipientEmail,
        subject: subject,
        provider: 'resend'
      })

      // Send email using Resend API
      const { data: resendData, error: resendError } = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      })

      if (resendError) {
        console.error('Resend API error:', resendError)
        throw new Error(`Resend error: ${resendError.message}`)
      }

      console.log('Email sent successfully via Resend:', resendData)
      
      // Update email log with success (if it exists)
      if (emailLogId) {
        try {
          await supabaseClient
            .from('email_logs')
            .update({
              status: 'sent',
              delivered_at: new Date().toISOString(),
              metadata: {
                smtp_config_id: smtpConfigId,
                template_data: templateData,
                priority: priority,
                user_id: userId,
                resend_id: resendData?.id,
                provider: 'resend'
              }
            })
            .eq('id', emailLogId)
        } catch (error) {
          console.log('Could not update email log:', error)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          logId: emailLogId,
          resendId: resendData?.id,
          message: 'Email sent successfully via Resend'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (sendError: any) {
      console.error('Email sending error:', sendError)
      
      // Update email log with failure (if it exists)
      if (emailLogId) {
        try {
          await supabaseClient
            .from('email_logs')
            .update({
              status: 'failed',
              error_message: sendError.message,
              error_code: 'RESEND_ERROR'
            })
            .eq('id', emailLogId)
        } catch (error) {
          console.log('Could not update email log:', error)
        }
      }

      throw new Error(`Failed to send email: ${sendError.message}`)
    }

  } catch (error: any) {
    console.error('Send integrated email error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})