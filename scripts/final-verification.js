const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalVerification() {
  console.log('=== FINAL VERIFICATION OF CURRENT DATABASE STATE ===\n');
  
  // Check auth.users
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log(`AUTH.USERS: ${authUsers.users.length} total users\n`);
  console.log('All emails in auth.users:');
  authUsers.users.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.email}`);
  });
  
  // Check tutors
  const { data: tutors } = await supabaseAdmin
    .from('tutors')
    .select('id, email, name');
  
  console.log(`\nPUBLIC.TUTORS: ${tutors.length} total tutors\n`);
  console.log('All emails in public.tutors:');
  tutors.forEach((tutor, i) => {
    console.log(`  ${i + 1}. ${tutor.email} ${tutor.name ? `(${tutor.name})` : ''}`);
  });
  
  // Check students
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, name, tutor_id');
  
  console.log(`\nPUBLIC.STUDENTS: ${students.length} total students\n`);
  
  // Group by tutor
  const byTutor = {};
  students.forEach(s => {
    if (!byTutor[s.tutor_id]) byTutor[s.tutor_id] = [];
    byTutor[s.tutor_id].push(s.name);
  });
  
  console.log('Students grouped by tutor:');
  Object.entries(byTutor).forEach(([tutorId, studentNames]) => {
    const tutor = tutors.find(t => t.id === tutorId);
    console.log(`  ${tutor?.email || tutorId}: ${studentNames.length} students`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\nSUMMARY:');
  console.log(`  Total users who can login: ${authUsers.users.length}`);
  console.log(`  Total tutor profiles: ${tutors.length}`);
  console.log(`  Total students: ${students.length}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('\nQUESTION: Were you expecting MORE users than this?');
  console.log('If yes, please let me know:');
  console.log('  1. How many users were you expecting?');
  console.log('  2. Do you have any other backup files?');
  console.log('  3. When was the last time you saw all users?');
}

finalVerification().catch(console.error);
