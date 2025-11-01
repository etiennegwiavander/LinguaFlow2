/**
 * Direct Resend Test (No Database Required)
 * Tests Resend API directly without database dependencies
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

console.log('='.repeat(60));
console.log('DIRECT RESEND TEST (No Database)');
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

async function testResendDirect() {
  try {
    console.log('2. Testing Direct Resend API Call...');
    console.log('-'.repeat(60));
    console.log('');

    // Call a simplified version that doesn't need database
    const testPayload = {
      from: 'noreply@linguaflow.online',
      to: 'linguaflowservices@gmail.com',
      subject: 'Direct Test from LinguaFlow',
      html: '<h1>Direct Test</h1><p>This email bypasses the database and tests Resend directly.</p>',
    };

    console.log('Sending test email...');
    console.log(`From: ${testPayload.from}`);
    console.log(`To: ${testPayload.to}`);
    console.log(`Subject: ${testPayload.subject}`);
    console.log('');

    // Create a simple Edge Function call that uses Resend directly
    const { data, error } = await supabase.functions.invoke('send-integrated-email', {
      body: {
        smtpConfigId: 'direct-test',
        templateId: 'direct-test',
        recipientEmail: testPayload.to,
        subject: testPayload.subject,
        htmlContent: testPayload.html,
        textContent: 'Direct Test - This email bypasses the database.',
        templateData: { test: 'direct' },
        priority: 'high',
      }
    });

    if (error) {
      console.error('❌ Edge Function Error:', error);
      console.log('');
      console.log('Common Issues:');
      console.log('');
      console.log('1. RESEND_API_KEY not set in Supabase:');
      console.log('   npx supabase secrets set RESEND_API_KEY=your_key');
      console.log('');
      console.log('2. Edge Function not deployed:');
      console.log('   npx supabase functions deploy send-integrated-email');
      console.log('');
      console.log('3. Check logs:');
      console.log('   npx supabase functions logs send-integrated-email');
      console.log('');
      return;
    }

    console.log('✅ Response received!');
    console.log('');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');

    if (data && data.success) {
      console.log('='.repeat(60));
      console.log('✅ SUCCESS! Email sent via Resend!');
      console.log('='.repeat(60));
      console.log('');
      console.log('Next Steps:');
      console.log('1. Check your inbox: linguaflowservices@gmail.com');
      console.log('2. Check spam folder if not in inbox');
      console.log('3. Check Resend dashboard: https://resend.com/emails');
      console.log('');
      if (data.resendId) {
        console.log(`Resend Message ID: ${data.resendId}`);
        console.log('');
      }
    } else {
      console.log('⚠️  Email may not have been sent');
      console.log('Check the response above for details');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('Error details:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Run: npx supabase secrets list');
    console.log('2. Run: npx supabase functions logs send-integrated-email');
    console.log('3. Check Resend dashboard for errors');
  }
}

// Run the test
testResendDirect();
