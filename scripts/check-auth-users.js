const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Need service role key to access auth.users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAuthUsers() {
  console.log('=== CHECKING USER ACCOUNTS ===\n');
  
  // Check tutors table
  console.log('1. Checking tutors table...');
  const { data: tutors, error: tutorsError } = await supabase
    .from('tutors')
    .select('id, email, first_name, last_name, created_at');
  
  if (tutorsError) {
    console.log('❌ Error:', tutorsError.message);
  } else {
    console.log(`Found ${tutors.length} tutors:`);
    tutors.forEach(t => {
      console.log(`  - ${t.email} (${t.first_name} ${t.last_name})`);
    });
  }
  
  // Check if we have service role key to check auth.users
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n2. Checking Supabase Auth users...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error:', authError.message);
    } else {
      console.log(`Found ${users.length} auth users:`);
      users.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u.id})`);
      });
    }
  } else {
    console.log('\n2. Cannot check auth.users (need SUPABASE_SERVICE_ROLE_KEY)');
  }
  
  console.log('\n=== SOLUTION ===');
  if (tutors.length === 0) {
    console.log('Your tutors table is empty!');
    console.log('\nTo test password reset, you need to:');
    console.log('1. Sign up for an account at: http://localhost:3000/auth/signup');
    console.log('2. Or use an existing account email');
    console.log('3. Then try the password reset flow');
  }
}

checkAuthUsers();
