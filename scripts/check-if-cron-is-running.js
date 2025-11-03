require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkCronStatus() {
  console.log('🔍 Checking if Cron Job is Running\n');
  console.log('Current time:', new Date().toLocaleString());
  console.log('');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CRON JOB STATUS CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check email logs for recent activity
  const { data: recentLogs, error: logsError } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (logsError) {
    console.error('❌ Error fetching email logs:', logsError.message);
  } else {
    console.log(`📧 Recent Email Activity (last 10 entries):`);
    if (recentLogs && recentLogs.length > 0) {
      const now = new Date();
      recentLogs.forEach((log, index) => {
        const createdAt = new Date(log.created_at);
        const minutesAgo = Math.round((now - createdAt) / 60000);
        console.log(`  ${index + 1}. ${log.template_type} - ${log.status} (${minutesAgo} min ago)`);
      });
      
      const latestLog = recentLogs[0];
      const latestTime = new Date(latestLog.created_at);
      const minutesSinceLastLog = Math.round((now - latestTime) / 60000);
      
      console.log('');
      console.log(`⏰ Last activity: ${minutesSinceLastLog} minutes ago`);
      
      if (minutesSinceLastLog < 10) {
        console.log('✅ Recent activity detected - cron might be running');
      } else {
        console.log('⚠️ No recent activity - cron might not be running');
      }
    } else {
      console.log('  No email logs found');
      console.log('⚠️ No activity detected - cron is likely NOT running');
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 HOW TO VERIFY CRON JOB ON CRON-JOB.ORG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1. Go to: https://cron-job.org');
  console.log('2. Log in to your account');
  console.log('3. Look for "LinguaFlow Lesson Reminders" in your cron jobs list');
  console.log('4. Check the status:');
  console.log('   ✅ ENABLED = Cron is running');
  console.log('   ⏸️ DISABLED/PAUSED = Cron is NOT running');
  console.log('');
  console.log('5. Click on the cron job to see:');
  console.log('   - Execution History (should show runs every 5 minutes)');
  console.log('   - Last execution time');
  console.log('   - Response codes (should be 200)');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 IF CRON IS NOT SET UP YET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Create a new cron job with these settings:');
  console.log('');
  console.log('Title: LinguaFlow Lesson Reminders');
  console.log(`URL: ${supabaseUrl}/functions/v1/schedule-lesson-reminders`);
  console.log('Method: POST');
  console.log('Schedule: */5 * * * * (every 5 minutes)');
  console.log('');
  console.log('Headers:');
  console.log(`  Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
  console.log('  Content-Type: application/json');
  console.log('');
  console.log('Status: ENABLED ✅');
  console.log('');
  
  // Check upcoming lessons
  const now = new Date();
  const windowStart = new Date(now.getTime() + 30 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);
  
  const { data: upcomingLessons } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', windowEnd.toISOString());
    
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📅 LESSONS IN REMINDER WINDOW (30-35 min from now)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (upcomingLessons && upcomingLessons.length > 0) {
    console.log(`✅ Found ${upcomingLessons.length} lesson(s) that should trigger reminders:`);
    upcomingLessons.forEach((lesson, index) => {
      const startTime = new Date(lesson.start_time);
      console.log(`  ${index + 1}. ${lesson.summary} at ${startTime.toLocaleTimeString()}`);
    });
    console.log('');
    console.log('⚠️ If cron is running, reminders should be sent within 5 minutes!');
  } else {
    console.log('📭 No lessons in the reminder window right now');
    console.log('This is normal - reminders only send when lessons are 30-35 min away');
  }
  
  console.log('');
}

checkCronStatus();
