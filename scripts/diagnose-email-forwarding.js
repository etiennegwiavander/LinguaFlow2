const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseEmailForwarding() {
  console.log('🔍 Diagnosing Email Forwarding System\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  // 2. Check recent feedback emails
  console.log('2️⃣ Checking Recent Feedback Emails:');
  const { data: feedbackData, error: feedbackError } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (feedbackError) {
    console.log('   ❌ Error fetching feedback:', feedbackError.message);
  } else if (feedbackData && feedbackData.length > 0) {
    console.log(`   ✅ Found ${feedbackData.length} recent feedback messages:`);
    feedbackData.forEach((msg, index) => {
      console.log(`   ${index + 1}. From: ${msg.email}`);
      console.log(`      Subject: ${msg.subject}`);
      console.log(`      Source: ${msg.source}`);
      console.log(`      Created: ${new Date(msg.created_at).toLocaleString()}`);
      console.log('');
    });
  } else {
    console.log('   ⚠️  No feedback messages found in database');
  }

  // 3. Check recent support tickets
  console.log('3️⃣ Checking Recent Support Tickets:');
  const { data: supportData, error: supportError } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (supportError) {
    console.log('   ❌ Error fetching support tickets:', supportError.message);
  } else if (supportData && supportData.length > 0) {
    console.log(`   ✅ Found ${supportData.length} recent support tickets:`);
    supportData.forEach((ticket, index) => {
      console.log(`   ${index + 1}. From: ${ticket.email}`);
      console.log(`      Subject: ${ticket.subject}`);
      console.log(`      Source: ${ticket.source}`);
      console.log(`      Created: ${new Date(ticket.created_at).toLocaleString()}`);
      console.log('');
    });
  } else {
    console.log('   ⚠️  No support tickets found in database');
  }

  // 4. Check if webhook is configured
  console.log('4️⃣ Webhook Configuration:');
  console.log('   The webhook should be configured in Resend dashboard at:');
  console.log('   https://resend.com/webhooks');
  console.log('   Webhook URL should be: https://linguaflow.online/api/webhooks/resend-inbound');
  console.log('   Event type: email.received');
  console.log('');

  // 5. Test Resend API connection
  console.log('5️⃣ Testing Resend API Connection:');
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
      });
      
      if (response.ok) {
        console.log('   ✅ Resend API connection successful');
      } else {
        console.log('   ❌ Resend API connection failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('   ❌ Error connecting to Resend API:', error.message);
    }
  } else {
    console.log('   ❌ Cannot test - RESEND_API_KEY not set');
  }
  console.log('');

  // 6. Deployment status
  console.log('6️⃣ Deployment Checklist:');
  console.log('   ⚠️  Make sure you have:');
  console.log('   1. Deployed the updated webhook code to production');
  console.log('   2. Set RESEND_API_KEY in production environment (Netlify)');
  console.log('   3. Configured inbound email routing in Resend dashboard');
  console.log('   4. Set up webhook in Resend to point to your API endpoint');
  console.log('');

  console.log('📋 Summary:');
  console.log('   If you sent an email to feedback@linguaflow.online and:');
  console.log('   - It appears in the database above → Webhook is working, forwarding might be failing');
  console.log('   - It does NOT appear in database → Webhook is not receiving emails from Resend');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Check Resend dashboard logs: https://resend.com/logs');
  console.log('   2. Check Netlify function logs for webhook errors');
  console.log('   3. Verify inbound email routing is enabled in Resend');
  console.log('   4. Check spam folder in linguaflowservices@gmail.com');
}

diagnoseEmailForwarding().catch(console.error);
