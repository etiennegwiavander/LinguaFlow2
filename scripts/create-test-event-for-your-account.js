require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTestEvent() {
  console.log('🧪 Creating Test Event for vanshidy@gmail.com\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get your tutor account
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('*')
    .eq('email', 'vanshidy@gmail.com')
    .single();
    
  if (tutorError || !tutor) {
    console.error('❌ Could not find tutor with vanshidy@gmail.com');
    return;
  }
  
  console.log('✅ Found tutor:', tutor.email);
  console.log('');
  
  // Create event 32 minutes from now (in the 30-35 minute window)
  const now = new Date();
  const eventStart = new Date(now.getTime() + 32 * 60 * 1000);
  const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
  
  console.log('⏰ Current time:', now.toLocaleString());
  console.log('📅 Event start time:', eventStart.toLocaleString());
  console.log('⏱️ Minutes until event:', Math.round((eventStart - now) / 60000));
  console.log('');
  
  const testEvent = {
    tutor_id: tutor.id,
    google_event_id: `test_fix_${Date.now()}`,
    summary: 'TEST FIX - John Doe',
    description: 'Test event to verify reminder fix',
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
  console.log('📧 Reminder will be sent to: vanshidy@gmail.com');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏰ NEXT STEPS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. Wait 2-3 minutes for the cron job to run');
  console.log('2. Check your email: vanshidy@gmail.com');
  console.log('3. Check Resend dashboard - should see "Delivered" status');
  console.log('4. Run: node scripts/check-email-error-logs.js');
  console.log('');
  console.log('To delete this test event:');
  console.log(`DELETE FROM calendar_events WHERE id = '${event.id}';`);
  console.log('');
}

createTestEvent();
