const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseLoginIssue() {
  console.log('=== DIAGNOSING LOGIN ISSUE ===\n');
  
  // Pick a test user
  const testEmail = 'vanshidy@gmail.com';
  const testUserId = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689';
  
  console.log(`Test User: ${testEmail}`);
  console.log(`Test User ID: ${testUserId}\n`);
  
  // 1. Check if user exists in auth.users
  console.log('1. Checking auth.users...');
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(testUserId);
  if (authError) {
    console.log('   ✗ Error:', authError.message);
    return;
  }
  console.log(`   ✓ User exists in auth.users`);
  console.log(`   - Email: ${authUser.user.email}`);
  console.log(`   - Email confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`);
  console.log(`   - Last sign in: ${authUser.user.last_sign_in_at || 'Never'}\n`);
  
  // 2. Check if tutor record exists
  console.log('2. Checking public.tutors...');
  const { data: tutor, error: tutorError } = await supabaseAdmin
    .from('tutors')
    .select('*')
    .eq('id', testUserId)
    .single();
    
  if (tutorError) {
    console.log('   ✗ Error:', tutorError.message);
    if (tutorError.code === 'PGRST116') {
      console.log('   ✗ CRITICAL: Tutor record does not exist!');
      console.log('   This will cause the app to fail after login.\n');
    }
  } else {
    console.log(`   ✓ Tutor record exists`);
    console.log(`   - Name: ${tutor.name || tutor.email}`);
    console.log(`   - Email: ${tutor.email}\n`);
  }
  
  // 3. Check RLS policies
  console.log('3. Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabaseAdmin
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'tutors');
    
  if (!policiesError && policies) {
    console.log(`   ✓ Found ${policies.length} RLS policies on tutors table\n`);
  }
  
  // 4. Check students for this tutor
  console.log('4. Checking students...');
  const { data: students, error: studentsError } = await supabaseAdmin
    .from('students')
    .select('id, name')
    .eq('tutor_id', testUserId);
    
  if (studentsError) {
    console.log('   ✗ Error:', studentsError.message);
  } else {
    console.log(`   ✓ Found ${students.length} students\n`);
  }
  
  // 5. Summary
  console.log('=== DIAGNOSIS SUMMARY ===');
  if (!tutorError && tutor) {
    console.log('✓ User can login - all required data exists');
    console.log('\nIf users report they cannot login, possible causes:');
    console.log('1. They forgot their password (use password reset)');
    console.log('2. Browser cache/cookies issue (clear and retry)');
    console.log('3. Network/CORS issues');
    console.log('4. Supabase service temporarily down');
  } else {
    console.log('✗ LOGIN WILL FAIL - Missing tutor record');
    console.log('\nFix: Run sync script to create tutor records for all auth users');
  }
}

diagnoseLoginIssue().catch(console.error);
