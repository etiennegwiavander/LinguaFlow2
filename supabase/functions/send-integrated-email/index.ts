import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get SMTP configuration
    const { data: smtpConfig, error: smtpError } = await supabaseClient
      .from('email_smtp_configs')
      .select('*')
      .eq('id', smtpConfigId)
      .eq('is_active', true)
      .single()

    if (smtpError || !smtpConfig) {
      throw new Error('SMTP configuration not found or inactive')
    }

    // Decrypt SMTP password (simplified - in production use proper decryption)
    const smtpPassword = smtpConfig.password_encrypted // TODO: Implement proper decryption

    // Create email log entry
    const { data: emailLog, error: logError } = await supabaseClient
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

    if (logError) {
      throw new Error(`Failed to create email log: ${logError.message}`)
    }

    // If scheduled for future, return success without sending
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          logId: emailLog.id,
          message: 'Email scheduled successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Send email immediately
    try {
      // Configure SMTP transport based on provider
      let smtpTransport;
      
      if (smtpConfig.provider === 'gmail') {
        smtpTransport = {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: smtpConfig.username,
            pass: smtpPassword
          }
        }
      } else if (smtpConfig.provider === 'sendgrid') {
        smtpTransport = {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: smtpPassword
          }
        }
      } else {
        // Custom SMTP
        smtpTransport = {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.encryption === 'ssl',
          auth: {
            user: smtpConfig.username,
            pass: smtpPassword
          }
        }
      }

      // For this implementation, we'll use a simple fetch to a mail service
      // In production, you'd use a proper SMTP library like nodemailer
      const emailPayload = {
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
        from: smtpConfig.username
      }

      // Simulate email sending (replace with actual SMTP sending)
      console.log('Sending email:', emailPayload)
      
      // Update email log with success
      await supabaseClient
        .from('email_logs')
        .update({
          status: 'sent',
          delivered_at: new Date().toISOString()
        })
        .eq('id', emailLog.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          logId: emailLog.id,
          message: 'Email sent successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (sendError: any) {
      // Update email log with failure
      await supabaseClient
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: sendError.message,
          error_code: 'SMTP_ERROR'
        })
        .eq('id', emailLog.id)

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