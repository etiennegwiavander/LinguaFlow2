require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function deleteAndCheck() {
  console.log('🗑️  Deleting test event and checking tutor info\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Delete the test event
  const { error: deleteError } = await supabase
    .from('calendar_events')
    .delete()
    .eq('google_event_id', 'test_reminder_' + '%')
    .ilike('google_event_id', 'test_reminder_%');
    
  if (deleteError) {
    console.log('Note: Could not delete test event (may not exist)');
  } else {
    console.log('✅ Test event deleted\n');
  }
  
  // Find tutor with vanshidy@gmail.com
  const { data: tutors, error } = await supabase
    .from('tutors')
    .select('*');
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📧 Tutors in database:\n');
  tutors.forEach((tutor, index) => {
    console.log(`Tutor ${index + 1}:`);
    console.log(`  Name: ${tutor.first_name} ${tutor.last_name}`);
    console.log(`  Email: ${tutor.email}`);
    console.log(`  ID: ${tutor.id}`);
    if (tutor.email === 'vanshidy@gmail.com') {
      console.log('  ✅ THIS IS YOUR ACCOUNT');
    }
    console.log('');
  });
  
  // Find the tutor with vanshidy@gmail.com
  const yourTutor = tutors.find(t => t.email === 'vanshidy@gmail.com');
  
  if (yourTutor) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Found your tutor account!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Reminders will be sent to: vanshidy@gmail.com');
    console.log('For calendar events associated with tutor ID:', yourTutor.id);
    console.log('');
    console.log('Your existing calendar events should automatically send');
    console.log('reminders to vanshidy@gmail.com when they are 30 minutes away.');
  } else {
    console.log('⚠️  No tutor found with email vanshidy@gmail.com');
    console.log('Reminders are sent to the tutor email associated with each calendar event.');
  }
}

deleteAndCheck();
