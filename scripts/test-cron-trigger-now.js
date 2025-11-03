require('dotenv').config({ path: '.env.local' });

async function testCronTrigger() {
  console.log('🔔 Testing Cron Trigger for Lesson Reminders\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/schedule-lesson-reminders`;
  
  console.log('📍 Edge Function URL:', edgeFunctionUrl);
  console.log('🔑 Using anon key:', supabaseAnonKey.substring(0, 20) + '...\n');
  
  console.log('⏰ Current time:', new Date().toLocaleString());
  console.log('📅 Looking for events 30-35 minutes from now\n');
  
  try {
    console.log('🚀 Calling Edge Function...\n');
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📬 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Edge Function executed successfully');
      console.log(`📧 Scheduled: ${data.scheduled} reminders`);
      if (data.errors && data.errors.length > 0) {
        console.log('⚠️ Errors:', data.errors);
      }
    } else {
      console.log('\n❌ Edge Function failed');
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to call Edge Function:', error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CRON-JOB.ORG SETUP CHECKLIST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1. Go to: https://cron-job.org');
  console.log('2. Create a new cron job with:');
  console.log(`   URL: ${edgeFunctionUrl}`);
  console.log('   Method: POST');
  console.log('   Schedule: Every 5 minutes (*/5 * * * *)');
  console.log('   Headers:');
  console.log(`     Authorization: Bearer ${supabaseAnonKey}`);
  console.log('     Content-Type: application/json');
  console.log('');
  console.log('3. Enable the cron job');
  console.log('4. Check execution history on cron-job.org dashboard');
  console.log('');
}

testCronTrigger();
