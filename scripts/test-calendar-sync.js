// Test calendar sync functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCalendarSync() {
  console.log('Testing calendar sync...\n');
  
  // First, check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ Not authenticated. Please log in first.');
    return;
  }
  
  console.log('✅ User authenticated:', user.email);
  console.log('User ID:', user.id);
  
  // Check if Google tokens exist
  const { data: tokens, error: tokensError } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('tutor_id', user.id)
    .maybeSingle();
  
  if (tokensError) {
    console.error('❌ Error fetching tokens:', tokensError.message);
    return;
  }
  
  if (!tokens) {
    console.log('❌ No Google Calendar connection found');
    return;
  }
  
  console.log('✅ Google tokens found');
  console.log('Email:', tokens.email);
  console.log('Token expires:', tokens.expires_at);
  
  // Get session for auth token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('❌ No active session');
    return;
  }
  
  console.log('\n📡 Calling sync-calendar Edge Function...\n');
  
  // Call the sync-calendar function
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-calendar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          tutor_id: user.id,
        }),
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\nResponse body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Sync successful!');
      console.log('Events synced:', data.events_count);
      console.log('New events:', data.new_events_count);
      console.log('Updated events:', data.updated_events_count);
    } else {
      console.log('\n❌ Sync failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error:', errorData.error || errorData);
      } catch (e) {
        console.log('Raw error:', responseText);
      }
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testCalendarSync().catch(console.error);
