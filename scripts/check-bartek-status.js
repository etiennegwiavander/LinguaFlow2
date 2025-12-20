require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBartek() {
  console.log('🔍 CHECKING BARTEK STATUS...\n');

  // Find Bartek
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      tutor_id,
      created_at,
      tutors!inner(email, name)
    `)
    .ilike('name', '%bartek%');

  if (studentsError) {
    console.error('❌ Error:', studentsError);
    return;
  }

  if (!students || students.length === 0) {
    console.log('❌ No student named Bartek found');
    return;
  }

  console.log(`✅ Found ${students.length} student(s) matching "Bartek"\n`);

  for (const student of students) {
    console.log(`📝 Student: ${student.name}`);
    console.log(`   ID: ${student.id}`);
    console.log(`   Created: ${student.created_at}`);
    console.log(`   Current Tutor: ${student.tutors.email}`);
    console.log(`   Tutor Name: ${student.tutors.name || 'N/A'}`);

    // Check lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        created_at,
        tutor_id,
        tutors!inner(email)
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });

    if (lessonsError) {
      console.error('   ❌ Error fetching lessons:', lessonsError);
      continue;
    }

    console.log(`   Lessons: ${lessons?.length || 0}`);

    if (lessons && lessons.length > 0) {
      console.log(`   First lesson created by: ${lessons[0].tutors.email} on ${lessons[0].created_at}`);
      
      // Count lessons by tutor
      const lessonsByTutor = {};
      lessons.forEach(lesson => {
        const email = lesson.tutors.email;
        lessonsByTutor[email] = (lessonsByTutor[email] || 0) + 1;
      });

      console.log(`   Lesson breakdown:`);
      Object.entries(lessonsByTutor).forEach(([email, count]) => {
        console.log(`     - ${email}: ${count} lesson(s)`);
      });
    } else {
      console.log(`   ⚠️  No lessons found`);
    }

    // Check if assigned to vanshidy
    const isVanshidy = student.tutors.email === 'vanshidy@gmail.com';
    console.log(`\n   ${isVanshidy ? '✅' : '❌'} Is assigned to vanshidy@gmail.com: ${isVanshidy}`);
    
    console.log('\n' + '─'.repeat(60) + '\n');
  }
}

checkBartek();
