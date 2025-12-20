const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('Testing login functionality...\n');
  
  // Test with a known email (you'll need to provide a password)
  const testEmail = 'vanshidy@gmail.com';
  
  console.log(`Attempting to sign in with: ${testEmail}`);
  console.log('Note: This will fail without the actual password\n');
  
  // Try to sign in (will fail without password, but shows the flow)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'test-password-placeholder'
  });
  
  if (error) {
    console.log('Login error:', error.message);
    
    if (error.message.includes('Invalid login credentials')) {
      console.log('\n✓ Auth system is working (wrong password expected)');
      console.log('✓ User account exists in auth.users');
      console.log('\nThe issue might be:');
      console.log('1. Users forgot their passwords');
      console.log('2. RLS policies blocking access after login');
      console.log('3. Missing tutor records causing app errors');
    } else {
      console.log('\n✗ Unexpected error - auth system may have issues');
    }
  } else {
    console.log('Login successful!', data);
  }
  
  // Check RLS policies
  console.log('\n=== Checking RLS Policies ===');
  const { data: tutors, error: tutorsError } = await supabase
    .from('tutors')
    .select('*')
    .limit(1);
    
  if (tutorsError) {
    console.log('RLS Error accessing tutors:', tutorsError.message);
  } else {
    console.log(`✓ Can access tutors table (${tutors.length} records)`);
  }
}

testLogin().catch(console.error);
