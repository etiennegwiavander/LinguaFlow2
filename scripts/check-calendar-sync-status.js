// Check if calendar events are being synced
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCalendarSync() {
  console.log('📅 Checking Calendar Sync Status\n');
  
  // Get all calendar events from the last 24 hours and next 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  console.log(`Checking events from ${yesterday.toLocaleString()} to ${tomorrow.toLocaleString()}\n`);
  
  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', yesterday.toISOString())
    .lte('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching calendar events:', error.message);
    return;
  }
  
  if (!events || events.length === 0) {
    console.log('📭 No calendar events found in the database');
    console.log('');
    console.log('This means either:');
    console.log('1. No events exist in Google Calendar');
    console.log('2. Calendar sync is not working');
    console.log('3. Events haven\'t been synced yet');
    console.log('');
    console.log('💡 To sync calendar:');
    console.log('   1. Go to your dashboard');
    console.log('   2. Click "Sync Calendar" button');
    console.log('   3. Or wait for automatic sync (runs periodically)');
    return;
  }
  
  console.log(`✅ Found ${events.length} calendar event(s):\n`);
  
  events.forEach((event, index) => {
    const startTime = new Date(event.start_time);
    const now = new Date();
    const minutesUntil = Math.round((startTime - now) / (60 * 1000));
    
    console.log(`Event ${index + 1}:`);
    console.log(`  Summary: ${event.summary}`);
    console.log(`  Start: ${startTime.toLocaleString()}`);
    console.log(`  Minutes until start: ${minutesUntil}`);
    console.log(`  Tutor ID: ${event.tutor_id}`);
    console.log(`  Google Event ID: ${event.google_event_id || 'N/A'}`);
    console.log(`  Created: ${new Date(event.created_at).toLocaleString()}`);
    
    // Check if this event is in the reminder window (30-35 minutes)
    if (minutesUntil >= 30 && minutesUntil <= 35) {
      console.log(`  🔔 IN REMINDER WINDOW - Should trigger reminder!`);
    } else if (minutesUntil > 35) {
      console.log(`  ⏰ Too far in future (${minutesUntil - 30} minutes too early)`);
    } else if (minutesUntil < 30 && minutesUntil > 0) {
      console.log(`  ⏱️  Too close (${30 - minutesUntil} minutes too late)`);
    } else if (minutesUntil <= 0) {
      console.log(`  ⏰ Event has passed`);
    }
    
    console.log('');
  });
  
  // Check for events specifically in the 30-35 minute window
  const thirtyMin = new Date(Date.now() + 30 * 60 * 1000);
  const thirtyFiveMin = new Date(Date.now() + 35 * 60 * 1000);
  
  const { data: reminderEvents, error: reminderError } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', thirtyMin.toISOString())
    .lte('start_time', thirtyFiveMin.toISOString());
  
  if (reminderError) {
    console.error('❌ Error checking reminder window:', reminderError.message);
  } else if (reminderEvents && reminderEvents.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔔 ${reminderEvents.length} event(s) in reminder window (30-35 min)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('These should trigger reminders when the cron job runs!');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📭 No events in reminder window (30-35 minutes from now)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

checkCalendarSync().catch(console.error);
