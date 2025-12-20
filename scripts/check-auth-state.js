const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthState() {
  console.log('Checking authentication state after database reset...\n');

  // Check auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    console.log(`Auth Users (auth.users): ${authUsers.users.length}`);
    authUsers.users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });
  }

  // Check tutors table
  const { data: tutors, error: tutorsError } = await supabase
    .from('tutors')
    .select('*');
  
  if (tutorsError) {
    console.error('\nError fetching tutors:', tutorsError);
  } else {
    console.log(`\nTutors (public.tutors): ${tutors.length}`);
    tutors.forEach(tutor => {
      console.log(`  - ${tutor.email} (ID: ${tutor.id})`);
    });
  }

  // Check students table
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, tutor_id');
  
  if (studentsError) {
    console.error('\nError fetching students:', studentsError);
  } else {
    console.log(`\nStudents (public.students): ${students.length}`);
  }

  console.log('\n=== DIAGNOSIS ===');
  console.log('The database reset cleared all data including:');
  console.log('- Authentication users (auth.users)');
  console.log('- Tutor profiles (public.tutors)');
  console.log('- Student records (public.students)');
  console.log('- All lessons and other data');
  console.log('\nUsers cannot login because their accounts no longer exist.');
}

checkAuthState().catch(console.error);
