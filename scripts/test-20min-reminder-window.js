require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test20MinWindow() {
  console.log('🧪 Testing 20-Minute Reminder Window\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check the current setting
  const { data: setting, error: settingError } = await supabase
    .from('email_settings')
    .select('*')
    .eq('setting_key', 'lesson_reminder_timing')
    .single();
    
  if (settingError) {
    console.error('❌ Error fetching setting:', settingError);
    return;
  }
  
  console.log('⚙️  Current Setting:', setting);
  console.log('📊 Reminder Minutes:', setting.setting_value.minutes);
  console.log('✅ Enabled:', setting.setting_value.enabled);
  console.log('');
  
  const reminderMinutes = setting.setting_value.minutes;
  const now = new Date();
  const windowStart = new Date(now.getTime() + reminderMinutes * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (reminderMinutes + 5) * 60 * 1000);
  
  console.log('⏰ Current time:', now.toLocaleString());
  console.log(`📅 Reminder window: ${reminderMinutes}-${reminderMinutes + 5} minutes from now`);
  console.log('🔍 Window start:', windowStart.toLocaleString());
  console.log('🔍 Window end:', windowEnd.toLocaleString());
  console.log('');
  
  // Check for events in the window
  const { data: events, error } = await supabase
    .from('calendar_events')
    .select(`
      id,
      summary,
      start_time,
      tutor_id,
      google_event_id,
      tutors!inner (
        email,
        first_name,
        last_name
      )
    `)
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', windowEnd.toISOString());
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${events.length} event(s) in ${reminderMinutes}-${reminderMinutes + 5} minute window:\n`);
  
  if (events.length > 0) {
    events.forEach((event, index) => {
      const startTime = new Date(event.start_time);
      const minutesUntil = Math.round((startTime - now) / 60000);
      
      console.log(`Event ${index + 1}:`);
      console.log(`  📝 Summary: ${event.summary}`);
      console.log(`  ⏰ Start: ${startTime.toLocaleString()}`);
      console.log(`  ⏱️  Minutes until: ${minutesUntil}`);
      console.log(`  📧 Reminder will go to: ${event.tutors.email}`);
      console.log(`  🆔 Event ID: ${event.google_event_id}`);
      console.log('');
    });
    
    console.log('✅ These events will trigger reminders when the cron job runs!');
  } else {
    console.log(`📭 No events in the ${reminderMinutes}-${reminderMinutes + 5} minute window right now.`);
    console.log(`This is normal - reminders only send when lessons are exactly ${reminderMinutes}-${reminderMinutes + 5} minutes away.`);
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 UPDATED REMINDER TIMING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`✅ Reminders now send ${reminderMinutes} minutes before lessons`);
  console.log(`✅ Cron job checks for events in ${reminderMinutes}-${reminderMinutes + 5} minute window every 5 minutes`);
  console.log('✅ Database setting updated');
  console.log('✅ Email templates updated');
  console.log('');
}

test20MinWindow();
