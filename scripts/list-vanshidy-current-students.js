require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const vanshidyTutorId = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689';

async function listVanshidyStudents() {
  console.log('📋 CURRENT STUDENTS ASSIGNED TO vanshidy@gmail.com\n');

  const { data: students, error } = await supabase
    .from('students')
    .select('id, name, created_at')
    .eq('tutor_id', vanshidyTutorId)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total: ${students.length} students\n`);

  students.forEach((student, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${student.name}`);
  });
}

listVanshidyStudents();
