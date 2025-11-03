// Check if the cron job is executing and what the response is
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCronExecution() {
  console.log('🔍 Checking Cron Execution and Email Logs\n');
  
  // Check recent email logs
  console.log('📬 Step 1: Checking email_logs for any lesson reminders...\n');
  const { data: allLogs, error: allLogsError } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (allLogsError) {
    console.error('❌ Error fetching email logs:', allLogsError.message);
  } else if (allLogs && allLogs.length > 0) {
    console.log(`Found ${allLogs.length} recent email log(s):\n`);
    
    const reminderLogs = allLogs.filter(log => log.template_type === 'lesson_reminder');
    const otherLogs = allLogs.filter(log => log.template_type !== 'lesson_reminder');
    
    if (reminderLogs.length > 0) {
      console.log(`✅ Lesson Reminder Emails (${reminderLogs.length}):`);
      reminderLogs.forEach((log, index) => {
        console.log(`\n  ${index + 1}. To: ${log.recipient_email}`);
        console.log(`     Status: ${log.status}`);
        console.log(`     Created: ${new Date(log.created_at).toLocaleString()}`);
        if (log.sent_at) console.log(`     Sent: ${new Date(log.sent_at).toLocaleString()}`);
        if (log.error_message) console.log(`     Error: ${log.error_message}`);
      });
    } else {
      console.log('❌ NO LESSON REMINDER EMAILS FOUND');
    }
    
    if (otherLogs.length > 0) {
      console.log(`\n📧 Other Emails (${otherLogs.length}):`);
      otherLogs.slice(0, 5).forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.template_type} - ${log.status} - ${new Date(log.created_at).toLocaleString()}`);
      });
    }
  } else {
    console.log('📭 No email logs found at all');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check calendar events
  console.log('📅 Step 2: Checking calendar events...\n');
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', yesterday.toISOString())
    .lte('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });
  
  if (eventsError) {
    console.error('❌ Error fetching calendar events:', eventsError.message);
  } else if (events && events.length > 0) {
    console.log(`Found ${events.length} calendar event(s):\n`);
    events.forEach((event, index) => {
      const startTime = new Date(event.start_time);
      const minutesUntil = Math.round((startTime - now) / (60 * 1000));
      const minutesAgo = -minutesUntil;
      
      console.log(`Event ${index + 1}: ${event.summary}`);
      console.log(`  Start: ${startTime.toLocaleString()}`);
      console.log(`  Google Event ID: ${event.google_event_id}`);
      
      if (minutesUntil > 0) {
        console.log(`  ⏰ Starts in ${minutesUntil} minutes`);
        if (minutesUntil >= 30 && minutesUntil <= 35) {
          console.log(`  🔔 IN REMINDER WINDOW NOW!`);
        } else if (minutesUntil < 30) {
          console.log(`  ⚠️  Too close for reminder (${30 - minutesUntil} min past window)`);
        }
      } else {
        console.log(`  ⏰ Started ${minutesAgo} minutes ago`);
        const reminderTime = new Date(startTime.getTime() - 30 * 60 * 1000);
        console.log(`  📧 Reminder should have been sent at: ${reminderTime.toLocaleString()}`);
      }
      console.log('');
    });
  } else {
    console.log('📭 No calendar events found');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test the Edge Function manually
  console.log('🧪 Step 3: Testing Edge Function manually...\n');
  
  try {
    const { data, error } = await supabase.functions.invoke('schedule-lesson-reminders', {
      body: { manual_test: true, timestamp: Date.now() }
    });
    
    if (error) {
      console.error('❌ Edge Function error:', error);
    } else {
      console.log('✅ Edge Function response:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Exception calling Edge Function:', err.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Diagnosis Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const hasReminderLogs = allLogs && allLogs.some(log => log.template_type === 'lesson_reminder');
  const hasEvents = events && events.length > 0;
  
  if (!hasReminderLogs && hasEvents) {
    console.log('⚠️  ISSUE IDENTIFIED:');
    console.log('   - Calendar events exist ✅');
    console.log('   - But NO reminder emails have been sent ❌');
    console.log('');
    console.log('💡 Possible causes:');
    console.log('   1. Cron job on cron-job.org is not actually calling the Edge Function');
    console.log('   2. Edge Function is being called but failing silently');
    console.log('   3. Events are not in the 30-35 minute window when cron runs');
    console.log('   4. Duplicate check is preventing emails (check metadata)');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Check cron-job.org execution history');
    console.log('   2. Check Supabase Edge Function logs');
    console.log('   3. Verify the cron job URL and authorization header');
  } else if (hasReminderLogs) {
    console.log('✅ Reminder system is working!');
    console.log('   Check the logs above for details');
  } else {
    console.log('⚠️  No events and no reminders');
    console.log('   System is idle (this is normal if no lessons scheduled)');
  }
}

checkCronExecution().catch(console.error);
