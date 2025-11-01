const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initializeEmailSystem() {
  console.log('=== INITIALIZING EMAIL MANAGEMENT SYSTEM ===\n');

  try {
    // 1. Create Resend SMTP Configuration
    console.log('1. Creating Resend SMTP configuration...');
    const { data: smtpConfig, error: smtpError} = await supabase
      .from('email_smtp_configs')
      .insert({
        name: 'Resend',
        provider: 'resend',
        host: 'smtp.resend.com',
        port: 587,
        username: 'resend',
        password_encrypted: process.env.RESEND_API_KEY, // Note: should be encrypted in production
        from_email: 'noreply@linguaflow.online',
        from_name: 'LinguaFlow',
        is_active: true,
        is_default: true,
        priority: 1,
        encryption: 'tls'
      })
      .select()
      .single();

    if (smtpError) {
      console.error('❌ Error creating SMTP config:', smtpError.message);
    } else {
      console.log('✅ Resend SMTP configuration created');
      console.log('   ID:', smtpConfig.id);
    }

    // 2. Create Password Reset Email Template
    console.log('\n2. Creating password reset email template...');
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .insert({
        name: 'Password Reset',
        type: 'password_reset',
        subject: 'Reset Your LinguaFlow Password',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Reset Your Password</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hi {{user_name}},</p>
    <p>We received a request to reset your password for your LinguaFlow account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">{{reset_url}}</p>
    <p><strong>This link will expire in {{expiry_time}}.</strong></p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      Need help? Contact us at {{support_email}}
    </p>
  </div>
</body>
</html>
        `,
        text_content: `Hi {{user_name}},

We received a request to reset your password for your LinguaFlow account.

Click this link to reset your password:
{{reset_url}}

This link will expire in {{expiry_time}}.

If you didn't request a password reset, you can safely ignore this email.

Need help? Contact us at {{support_email}}`,
        is_active: true,
        is_default: true,
        placeholders: JSON.stringify(['user_name', 'reset_url', 'expiry_time', 'support_email'])
      })
      .select()
      .single();

    if (templateError) {
      console.error('❌ Error creating template:', templateError.message);
    } else {
      console.log('✅ Password reset template created');
      console.log('   ID:', template.id);
    }

    // 3. Create Welcome Email Template
    console.log('\n3. Creating welcome email template...');
    const { error: welcomeError } = await supabase
      .from('email_templates')
      .insert({
        name: 'Welcome Email',
        type: 'welcome',
        subject: 'Welcome to LinguaFlow!',
        html_content: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h1>Welcome to LinguaFlow, {{user_name}}!</h1>
  <p>We're excited to have you on board.</p>
  <p>Get started by logging in: <a href="{{login_url}}">Login Now</a></p>
</body>
</html>
        `,
        text_content: 'Welcome to LinguaFlow, {{user_name}}! Get started: {{login_url}}',
        is_active: true,
        is_default: true,
        placeholders: JSON.stringify(['user_name', 'login_url'])
      });

    if (welcomeError) {
      console.error('❌ Error creating welcome template:', welcomeError.message);
    } else {
      console.log('✅ Welcome email template created');
    }

    console.log('\n=== INITIALIZATION COMPLETE ===');
    console.log('\n✅ Your email system is now configured!');
    console.log('\nNext steps:');
    console.log('1. Go to http://localhost:3000/admin-portal/email');
    console.log('2. You should see real SMTP configs and templates');
    console.log('3. Test sending emails from the admin panel');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

initializeEmailSystem();
