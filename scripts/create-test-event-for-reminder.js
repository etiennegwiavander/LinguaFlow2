require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTestEvent() {
  console.log('🧪 Creating Test Calendar Event for Reminder Testing\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get your tutor ID
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('id, email, first_name, last_name')
    .limit(1)
    .single();
    
  if (tutorError || !tutor) {
    console.error('❌ Failed to get tutor:', tutorError);
    return;
  }
  
  console.log('👤 Tutor:', tutor.email);
  
  // Create event 32 minutes from now (in the 30-35 minute window)
  const now = new Date();
  const eventStart = new Date(now.getTime() + 32 * 60 * 1000);
  const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1 hour lesson
  
  console.log('⏰ Current time:', now.toLocaleString());
  console.log('📅 Event start time:', eventStart.toLocaleString());
  console.log('⏱️ Minutes until event:', Math.round((eventStart - now) / 60000));
  console.log('');
  
  const testEvent = {
    tutor_id: tutor.id,
    google_event_id: `test_reminder_${Date.now()}`,
    summary: 'TEST REMINDER - John Doe',
    description: 'This is a test event to verify lesson reminders',
    start_time: eventStart.toISOString(),
    end_time: eventEnd.toISOString(),
    location: 'Zoom',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .insert(testEvent)
    .select()
    .single();
    
  if (eventError) {
    console.error('❌ Failed to create test event:', eventError);
    return;
  }
  
  console.log('✅ Test event created successfully!');
  console.log('📋 Event ID:', event.id);
  console.log('📧 Reminder should be sent to:', tutor.email);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 NEXT STEPS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. Wait 2-3 minutes for the cron job to run');
  console.log('2. Check your email:', tutor.email);
  console.log('3. Run: node scripts/check-cron-execution-logs.js');
  console.log('4. Check Resend dashboard for email delivery');
  console.log('');
  console.log('If no email arrives:');
  console.log('- Verify cron-job.org is configured and enabled');
  console.log('- Check cron-job.org execution history');
  console.log('- Run: node scripts/test-cron-trigger-now.js');
  console.log('');
  console.log('To delete this test event:');
  console.log(`DELETE FROM calendar_events WHERE id = '${event.id}';`);
  console.log('');
}

createTestEvent();
