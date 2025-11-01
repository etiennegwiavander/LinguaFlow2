/**
 * Test Resend Integration
 * Tests if your custom email system can send emails via Resend
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

console.log('='.repeat(60));
console.log('RESEND INTEGRATION TEST');
console.log('='.repeat(60));
console.log('');

// Check environment variables
console.log('1. Checking Environment Variables...');
console.log('-'.repeat(60));
console.log(`✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ RESEND_API_KEY: ${resendApiKey ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
  console.error('❌ CRITICAL: Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testResendIntegration() {
  try {
    console.log('2. Testing Resend Integration...');
    console.log('-'.repeat(60));

    // Test email details
    const testEmail = {
      recipientEmail: 'linguaflowservices@gmail.com', // Your email - change if needed
      subject: 'Test Email from LinguaFlow Custom System',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #2563eb;">🎉 Success!</h1>
            <p>This is a test email from your <strong>custom email system</strong> using Resend!</p>
            <p>If you're reading this, it means:</p>
            <ul>
              <li>✅ Your Edge Function is deployed</li>
              <li>✅ Resend API key is configured</li>
              <li>✅ Email sending is working</li>
            </ul>
            <p>Your custom email system is now fully operational!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Sent from LinguaFlow Custom Email System<br>
              Powered by Resend
            </p>
          </body>
        </html>
      `,
      textContent: 'Success! This is a test email from your custom email system using Resend. Your email system is now fully operational!',
    };

    console.log(`Sending test email to: ${testEmail.recipientEmail}`);
    console.log('');

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('send-integrated-email', {
      body: {
        smtpConfigId: 'test-config-id',
        templateId: 'test-template-id',
        recipientEmail: testEmail.recipientEmail,
        subject: testEmail.subject,
        htmlContent: testEmail.htmlContent,
        textContent: testEmail.textContent,
        templateData: { test: true },
        priority: 'high',
        userId: 'test-user-id'
      }
    });

    if (error) {
      console.error('❌ Edge Function Error:', error);
      console.log('');
      console.log('Troubleshooting:');
      console.log('1. Make sure you deployed the Edge Function:');
      console.log('   npx supabase functions deploy send-integrated-email');
      console.log('');
      console.log('2. Make sure RESEND_API_KEY is set in Supabase secrets:');
      console.log('   npx supabase secrets set RESEND_API_KEY=your_key_here');
      console.log('');
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('='.repeat(60));
    console.log('SUCCESS! Your custom email system is now working with Resend!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next Steps:');
    console.log('1. Check your inbox for the test email');
    console.log('2. Configure Resend in your admin portal');
    console.log('3. Test with welcome emails, lesson reminders, etc.');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('Error details:', error.message);
  }
}

// Run the test
testResendIntegration();
