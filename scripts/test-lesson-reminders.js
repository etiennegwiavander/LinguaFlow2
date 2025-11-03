// Test the lesson reminder system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLessonReminders() {
  console.log('🔔 Testing Lesson Reminder System\n');
  
  // Step 1: Check reminder timing setting
  console.log('📊 Step 1: Checking reminder timing setting...');
  const { data: settings, error: settingsError } = await supabase
    .from('email_settings')
    .select('setting_value')
    .eq('setting_key', 'lesson_reminder_timing')
    .maybeSingle();
  
  if (settingsError) {
    console.error('❌ Error fetching settings:', settingsError.message);
  } else if (settings) {
    console.log('✅ Reminder timing:', JSON.stringify(settings.setting_value));
  } else {
    console.log('⚠️  No reminder timing setting found');
  }
  
  console.log('');
  
  // Step 2: Check email template
  console.log('📧 Step 2: Checking lesson reminder email template...');
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('id, name, subject, is_active')
    .eq('type', 'lesson_reminder')
    .eq('is_active', true)
    .maybeSingle();
  
  if (templateError) {
    console.error('❌ Error fetching template:', templateError.message);
  } else if (template) {
    console.log('✅ Template found:');
    console.log('   Name:', template.name);
    console.log('   Subject:', template.subject);
    console.log('   Active:', template.is_active);
  } else {
    console.log('⚠️  No active lesson reminder template found');
  }
  
  console.log('');
  
  // Step 3: Check for upcoming lessons
  console.log('📅 Step 3: Checking for upcoming lessons (next 35 minutes)...');
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);
  
  const { data: upcomingLessons, error: lessonsError } = await supabase
    .from('calendar_events')
    .select('id, summary, start_time, tutor_id')
    .gte('start_time', thirtyMinutesFromNow.toISOString())
    .lte('start_time', thirtyFiveMinutesFromNow.toISOString())
    .limit(10);
  
  if (lessonsError) {
    console.error('❌ Error fetching lessons:', lessonsError.message);
  } else if (upcomingLessons && upcomingLessons.length > 0) {
    console.log(`✅ Found ${upcomingLessons.length} lesson(s) in reminder window:`);
    upcomingLessons.forEach((lesson, index) => {
      const studentName = lesson.summary.split(' - ')[0];
      const lessonTime = new Date(lesson.start_time).toLocaleTimeString();
      console.log(`   ${index + 1}. ${studentName} at ${lessonTime}`);
    });
  } else {
    console.log('📭 No lessons found in the 30-35 minute window');
    console.log('   (This is normal if you don\'t have any lessons scheduled)');
  }
  
  console.log('');
  
  // Step 4: Check SMTP configuration
  console.log('📮 Step 4: Checking SMTP configuration...');
  const { data: smtp, error: smtpError } = await supabase
    .from('email_smtp_configs')
    .select('id, name, is_active')
    .eq('is_active', true)
    .maybeSingle();
  
  if (smtpError) {
    console.error('❌ Error fetching SMTP config:', smtpError.message);
  } else if (smtp) {
    console.log('✅ Active SMTP configuration found:', smtp.name);
  } else {
    console.log('⚠️  No active SMTP configuration found');
    console.log('   Reminders won\'t be sent without SMTP setup');
  }
  
  console.log('');
  
  // Step 5: Check recent email logs
  console.log('📬 Step 5: Checking recent lesson reminder emails...');
  const { data: logs, error: logsError } = await supabase
    .from('email_logs')
    .select('id, recipient_email, status, sent_at')
    .eq('template_type', 'lesson_reminder')
    .order('sent_at', { ascending: false })
    .limit(5);
  
  if (logsError) {
    console.error('❌ Error fetching email logs:', logsError.message);
  } else if (logs && logs.length > 0) {
    console.log(`✅ Found ${logs.length} recent reminder email(s):`);
    logs.forEach((log, index) => {
      const time = new Date(log.sent_at).toLocaleString();
      console.log(`   ${index + 1}. To: ${log.recipient_email} | Status: ${log.status} | ${time}`);
    });
  } else {
    console.log('📭 No lesson reminder emails sent yet');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ System Check Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📝 Summary:');
  console.log('   - Reminder timing: ' + (settings ? '✅ Configured' : '❌ Not configured'));
  console.log('   - Email template: ' + (template ? '✅ Active' : '❌ Missing'));
  console.log('   - SMTP config: ' + (smtp ? '✅ Active' : '❌ Missing'));
  console.log('   - Upcoming lessons: ' + (upcomingLessons?.length || 0));
  console.log('');
  console.log('🔄 The cron job runs every 5 minutes automatically');
  console.log('📧 Reminders will be sent 30 minutes before each lesson');
  console.log('');
  console.log('🧪 To test:');
  console.log('   1. Add a lesson to Google Calendar');
  console.log('   2. Format: "StudentName - Lesson Description"');
  console.log('   3. Set time to 32 minutes from now');
  console.log('   4. Wait 2-7 minutes for the cron job');
  console.log('   5. Check your email inbox');
}

testLessonReminders().catch(console.error);
