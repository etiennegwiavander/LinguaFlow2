// Diagnose why lesson reminders aren't being sent
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseReminderCron() {
  console.log('🔍 Diagnosing Lesson Reminder Cron Job\n');
  
  // Step 1: Check if cron job exists
  console.log('📋 Step 1: Checking cron job configuration...');
  const { data: cronJobs, error: cronError } = await supabase
    .from('pg_cron_jobs')
    .select('*')
    .ilike('jobname', '%lesson%reminder%');
  
  if (cronError) {
    console.log('⚠️  Cannot query pg_cron_jobs (this is normal - requires special permissions)');
    console.log('   The cron job should be configured in the migration file');
  } else if (cronJobs && cronJobs.length > 0) {
    console.log('✅ Found cron job(s):');
    cronJobs.forEach(job => {
      console.log(`   - ${job.jobname}: ${job.schedule}`);
      console.log(`     Active: ${job.active}`);
    });
  }
  
  console.log('');
  
  // Step 2: Check calendar events in the reminder window
  console.log('📅 Step 2: Checking for lessons in reminder window...');
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);
  
  console.log(`   Current time: ${now.toLocaleString()}`);
  console.log(`   Window start: ${thirtyMinutesFromNow.toLocaleString()}`);
  console.log(`   Window end: ${thirtyFiveMinutesFromNow.toLocaleString()}`);
  
  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', thirtyMinutesFromNow.toISOString())
    .lte('start_time', thirtyFiveMinutesFromNow.toISOString());
  
  if (eventsError) {
    console.error('❌ Error fetching calendar events:', eventsError.message);
  } else if (events && events.length > 0) {
    console.log(`✅ Found ${events.length} event(s) in reminder window:`);
    events.forEach((event, index) => {
      console.log(`\n   Event ${index + 1}:`);
      console.log(`   - ID: ${event.id}`);
      console.log(`   - Summary: ${event.summary}`);
      console.log(`   - Start: ${new Date(event.start_time).toLocaleString()}`);
      console.log(`   - Tutor ID: ${event.tutor_id}`);
      console.log(`   - Google Event ID: ${event.google_event_id}`);
    });
  } else {
    console.log('📭 No events found in reminder window');
  }
  
  console.log('');
  
  // Step 3: Get tutor email for events
  if (events && events.length > 0) {
    console.log('👤 Step 3: Checking tutor information...');
    for (const event of events) {
      const { data: tutor, error: tutorError } = await supabase
        .from('tutors')
        .select('email, first_name, last_name')
        .eq('id', event.tutor_id)
        .single();
      
      if (tutorError) {
        console.error(`❌ Error fetching tutor for event ${event.id}:`, tutorError.message);
      } else if (tutor) {
        console.log(`✅ Tutor for "${event.summary}": ${tutor.email}`);
      }
    }
    console.log('');
  }
  
  // Step 4: Check email logs for recent attempts
  console.log('📬 Step 4: Checking recent email attempts...');
  const { data: logs, error: logsError } = await supabase
    .from('email_logs')
    .select('*')
    .eq('template_type', 'lesson_reminder')
    .order('sent_at', { ascending: false })
    .limit(10);
  
  if (logsError) {
    console.error('❌ Error fetching email logs:', logsError.message);
  } else if (logs && logs.length > 0) {
    console.log(`✅ Found ${logs.length} recent reminder email log(s):`);
    logs.forEach((log, index) => {
      console.log(`\n   Log ${index + 1}:`);
      console.log(`   - To: ${log.recipient_email}`);
      console.log(`   - Status: ${log.status}`);
      console.log(`   - Created: ${new Date(log.created_at).toLocaleString()}`);
      if (log.sent_at) {
        console.log(`   - Sent: ${new Date(log.sent_at).toLocaleString()}`);
      }
      if (log.error_message) {
        console.log(`   - Error: ${log.error_message}`);
      }
      if (log.metadata) {
        console.log(`   - Metadata:`, JSON.stringify(log.metadata, null, 2));
      }
    });
  } else {
    console.log('📭 No reminder email logs found');
  }
  
  console.log('');
  
  // Step 5: Check SMTP and template configuration
  console.log('⚙️  Step 5: Checking email system configuration...');
  
  const { data: smtp, error: smtpError } = await supabase
    .from('email_smtp_configs')
    .select('id, name, is_active')
    .eq('is_active', true)
    .maybeSingle();
  
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('id, name, is_active')
    .eq('type', 'lesson_reminder')
    .eq('is_active', true)
    .maybeSingle();
  
  console.log(`   SMTP Config: ${smtp ? '✅ Active' : '❌ Missing'}`);
  console.log(`   Email Template: ${template ? '✅ Active' : '❌ Missing'}`);
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Diagnosis Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (!events || events.length === 0) {
    console.log('⚠️  No lessons found in the 30-35 minute window');
    console.log('   This is why no reminders were sent.');
    console.log('');
    console.log('💡 To test:');
    console.log('   1. Create a Google Calendar event');
    console.log('   2. Set it for exactly 32 minutes from now');
    console.log('   3. Format: "StudentName - Lesson Description"');
    console.log('   4. Wait 2-7 minutes for the cron job to run');
  } else if (!smtp) {
    console.log('❌ SMTP configuration is missing');
    console.log('   Emails cannot be sent without SMTP setup');
  } else if (!template) {
    console.log('❌ Email template is missing');
    console.log('   Reminders cannot be sent without a template');
  } else if (logs && logs.length > 0) {
    console.log('✅ System is configured correctly');
    console.log('   Check the email logs above for send status');
  } else {
    console.log('⚠️  System is configured but no emails have been sent yet');
    console.log('   The cron job may not have run yet (runs every 5 minutes)');
  }
}

diagnoseReminderCron().catch(console.error);
