// Check if the cron job is running
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCronStatus() {
  console.log('🔍 Checking Cron Job Status\n');
  
  // Try to query the cron_job_status view
  const { data: cronJobs, error: cronError } = await supabase
    .from('cron_job_status')
    .select('*');
  
  if (cronError) {
    console.log('⚠️  Cannot query cron_job_status view:', cronError.message);
    console.log('   This might be a permissions issue\n');
  } else if (cronJobs && cronJobs.length > 0) {
    console.log('✅ Found cron job(s):\n');
    cronJobs.forEach(job => {
      console.log(`Job: ${job.jobname}`);
      console.log(`  Schedule: ${job.schedule}`);
      console.log(`  Active: ${job.active}`);
      console.log(`  Job ID: ${job.jobid}`);
      console.log('');
    });
  } else {
    console.log('📭 No cron jobs found in the view\n');
  }
  
  // Try to manually trigger the reminder function
  console.log('🧪 Testing manual trigger function...\n');
  
  const { data: triggerResult, error: triggerError } = await supabase
    .rpc('trigger_lesson_reminders');
  
  if (triggerError) {
    console.error('❌ Error triggering reminders:', triggerError.message);
    console.log('\nThis suggests the cron job might not be configured correctly.');
    console.log('The database function exists but cannot execute.\n');
  } else {
    console.log('✅ Manual trigger executed!');
    console.log('Result:', JSON.stringify(triggerResult, null, 2));
    console.log('');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Diagnosis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (cronError && triggerError) {
    console.log('❌ Both cron job view and manual trigger failed');
    console.log('   The cron job system may not be properly set up\n');
    console.log('💡 Solution:');
    console.log('   1. Check if pg_cron extension is enabled');
    console.log('   2. Verify database settings for app.supabase_url and app.service_role_key');
    console.log('   3. Check Supabase dashboard for cron job configuration');
  } else if (cronError) {
    console.log('⚠️  Cron job view not accessible but manual trigger works');
    console.log('   The cron job might be running but we can\'t see its status\n');
  } else if (triggerError) {
    console.log('⚠️  Cron job exists but manual trigger failed');
    console.log('   The cron job configuration might need attention\n');
  } else {
    console.log('✅ Cron job system appears to be working');
    console.log('   If reminders aren\'t being sent, check:');
    console.log('   1. Email logs for any errors');
    console.log('   2. Calendar events are synced correctly');
    console.log('   3. Events are in the 30-35 minute window when cron runs');
  }
}

checkCronStatus().catch(console.error);
