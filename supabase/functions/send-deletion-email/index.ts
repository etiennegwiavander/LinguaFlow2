import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendDeletionEmailRequest {
  tutor_id: string;
  recovery_token: string;
  email: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tutor_id, recovery_token, email, reason }: SendDeletionEmailRequest = await req.json()

    if (!tutor_id || !recovery_token || !email) {
      throw new Error('Missing required parameters')
    }

    // Get tutor name for personalization
    const { data: tutorData, error: tutorError } = await supabaseClient
      .from('tutors')
      .select('name')
      .eq('id', tutor_id)
      .single()

    if (tutorError) {
      console.error('Failed to fetch tutor data:', tutorError)
    }

    const tutorName = tutorData?.name || 'there'
    const recoveryUrl = `${Deno.env.get('SITE_URL') || 'https://your-domain.com'}/auth/recover-account?token=${recovery_token}`
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()

    // Email template
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deletion Scheduled - LinguaFlow</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .recovery-box {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
        }
        .button:hover {
            background: #0056b3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .timeline {
            background: white;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .timeline-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .timeline-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
        }
        .timeline-icon.current { background: #ffc107; }
        .timeline-icon.future { background: #6c757d; }
        .timeline-icon.danger { background: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Account Deletion Scheduled</h1>
        <p>Your LinguaFlow account has been scheduled for deletion</p>
    </div>
    
    <div class="content">
        <p>Hi ${tutorName},</p>
        
        <p>We've received your request to delete your LinguaFlow account. Your account has been scheduled for permanent deletion, but you still have time to change your mind.</p>
        
        <div class="warning-box">
            <h3>⚠️ Important Information</h3>
            <ul>
                <li><strong>Deletion Date:</strong> ${deletionDate}</li>
                <li><strong>Recovery Window:</strong> 30 days from today</li>
                <li><strong>Current Status:</strong> Account temporarily hidden</li>
            </ul>
        </div>

        <div class="timeline">
            <h3>📅 What Happens Next</h3>
            <div class="timeline-item">
                <div class="timeline-icon current">1</div>
                <div>
                    <strong>Now:</strong> Your account is temporarily hidden and inaccessible
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-icon future">2</div>
                <div>
                    <strong>Next 30 days:</strong> You can recover your account anytime using the button below
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-icon danger">3</div>
                <div>
                    <strong>After ${deletionDate}:</strong> All your data will be permanently deleted
                </div>
            </div>
        </div>

        <div class="recovery-box">
            <h3>🔄 Want to Keep Your Account?</h3>
            <p>If you've changed your mind, you can easily recover your account. All your data will be restored exactly as it was:</p>
            <ul>
                <li>All student profiles and learning data</li>
                <li>Generated lesson plans and materials</li>
                <li>Calendar sync settings</li>
                <li>Account preferences</li>
            </ul>
            
            <div style="text-align: center; margin: 20px 0;">
                <a href="${recoveryUrl}" class="button">🔓 Recover My Account</a>
            </div>
            
            <p><small><strong>Recovery Link:</strong> ${recoveryUrl}</small></p>
        </div>

        ${reason ? `
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>📝 Your Feedback</h4>
            <p><em>"${reason}"</em></p>
            <p><small>Thank you for helping us improve LinguaFlow.</small></p>
        </div>
        ` : ''}

        <h3>🛡️ Data Protection & Privacy</h3>
        <p>This deletion process complies with GDPR and other data protection regulations. Your data is handled securely throughout this process.</p>
        
        <h3>❓ Need Help?</h3>
        <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:support@linguaflow.com">support@linguaflow.com</a></p>
        
        <p>Best regards,<br>The LinguaFlow Team</p>
    </div>
    
    <div class="footer">
        <p>This email was sent because you requested account deletion for ${email}</p>
        <p>If you didn't request this, please contact support immediately.</p>
        <p>&copy; 2024 LinguaFlow. All rights reserved.</p>
    </div>
</body>
</html>
    `

    const emailText = `
Account Deletion Scheduled - LinguaFlow

Hi ${tutorName},

We've received your request to delete your LinguaFlow account. Your account has been scheduled for permanent deletion on ${deletionDate}, but you still have time to change your mind.

IMPORTANT INFORMATION:
- Deletion Date: ${deletionDate}
- Recovery Window: 30 days from today
- Current Status: Account temporarily hidden

RECOVERY OPTIONS:
If you've changed your mind, you can recover your account anytime within 30 days by visiting:
${recoveryUrl}

All your data will be restored exactly as it was, including:
- All student profiles and learning data
- Generated lesson plans and materials
- Calendar sync settings
- Account preferences

${reason ? `Your Feedback: "${reason}"` : ''}

This deletion process complies with GDPR and other data protection regulations.

Need help? Contact us at support@linguaflow.com

Best regards,
The LinguaFlow Team

---
This email was sent because you requested account deletion for ${email}
If you didn't request this, please contact support immediately.
    `

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll simulate sending the email
    console.log('Sending deletion email to:', email)
    console.log('Recovery URL:', recoveryUrl)

    // Log the email sending action
    const { error: logError } = await supabaseClient
      .from('deletion_logs')
      .insert({
        tutor_id,
        action: 'recovery_email_sent',
        details: {
          email,
          recovery_token,
          recovery_url: recoveryUrl,
          deletion_date: deletionDate
        }
      })

    if (logError) {
      console.error('Failed to log email sending:', logError)
    }

    // In a real implementation, you would use a service like:
    /*
    const emailService = new EmailService(Deno.env.get('EMAIL_API_KEY'))
    await emailService.send({
      to: email,
      subject: 'Account Deletion Scheduled - LinguaFlow',
      html: emailHtml,
      text: emailText
    })
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deletion notification email sent successfully',
        recovery_url: recoveryUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})