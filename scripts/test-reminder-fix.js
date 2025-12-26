require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReminderFix() {
  console.log('🧪 TESTING REMINDER FIX\n');
  console.log('='.repeat(80));

  try {
    console.log('\n📞 Invoking schedule-lesson-reminders function...');
    
    const { data, error } = await supabase.functions.invoke('schedule-lesson-reminders', {
      body: {}
    });

    if (error) {
      console.log('❌ Function invocation failed:', error.message);
      console.log('   Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('\n✅ Function invoked successfully!');
    console.log('   Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`\n📊 Results:`);
      console.log(`   Scheduled: ${data.scheduled} reminder(s)`);
      console.log(`   Message: ${data.message}`);
      
      if (data.errors && data.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered:`);
        data.errors.forEach((err, idx) => {
          console.log(`   ${idx + 1}. ${err}`);
        });
      }

      if (data.scheduled === 0) {
        console.log('\n💡 No reminders scheduled because:');
        console.log('   - No calendar events in the reminder window (20-25 min from now)');
        console.log('   - Or reminders already sent for upcoming events');
        console.log('\n   To test with actual events:');
        console.log('   1. Create a calendar event 20-25 minutes from now');
        console.log('   2. Wait for the cron job to run (every 5 minutes)');
        console.log('   3. Check email_logs table for the reminder');
      } else {
        console.log('\n🎉 Reminders scheduled successfully!');
        console.log('   Check your email and the email_logs table');
      }
    } else {
      console.log('\n❌ Function returned failure');
      console.log('   Error:', data.error);
    }

    // Check if SMTP config issue is resolved
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Verifying Fix');
    console.log('='.repeat(80));

    const { data: smtpConfigs } = await supabase
      .from('email_smtp_configs')
      .select('*')
      .eq('is_active', true);

    if (!smtpConfigs || smtpConfigs.length === 0) {
      console.log('\n✅ SMTP config is still missing (as expected)');
      console.log('   But the function should work now because:');
      console.log('   1. It uses "default" as smtpConfigId');
      console.log('   2. send-integrated-email uses Resend API directly');
      console.log('   3. SMTP config is optional when using Resend');
    } else {
      console.log('\n✅ SMTP config found (even better!)');
      console.log(`   Active configs: ${smtpConfigs.length}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  }
}

testReminderFix().catch(console.error);
