/**
 * Test Simple Email Function
 * Tests the simplest possible Resend integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

console.log('='.repeat(60));
console.log('SIMPLE EMAIL TEST');
console.log('='.repeat(60));
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSimpleEmail() {
  try {
    console.log('Calling simple test email function...');
    console.log('');

    const { data, error } = await supabase.functions.invoke('send-test-email-simple');

    if (error) {
      console.error('❌ Error:', error);
      console.log('');
      console.log('This function needs to be deployed first:');
      console.log('npx supabase functions deploy send-test-email-simple');
      return;
    }

    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');

    if (data && data.success) {
      console.log('='.repeat(60));
      console.log('✅ SUCCESS! Email sent!');
      console.log('='.repeat(60));
      console.log('');
      console.log('Check your inbox: linguaflowservices@gmail.com');
      console.log('Check spam folder if not in inbox');
      console.log('');
      if (data.resendId) {
        console.log(`Resend Message ID: ${data.resendId}`);
      }
    } else {
      console.log('❌ Email failed to send');
      console.log('Error:', data?.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleEmail();
