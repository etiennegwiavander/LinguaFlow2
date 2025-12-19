require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listStudentsForTutor(tutorEmail) {
  console.log(`📋 Students under ${tutorEmail}:\n`);

  try {
    // Get students for the specified tutor
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        name,
        level,
        target_language,
        native_language,
        created_at,
        tutors!inner(email)
      `)
      .eq('tutors.email', tutorEmail)
      .order('created_at', { ascending: true });

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    if (students.length === 0) {
      console.log(`❌ No students found for ${tutorEmail}`);
      return;
    }

    console.log(`📊 Total students: ${students.length}\n`);

    students.forEach((student, index) => {
      const createdDate = new Date(student.created_at).toLocaleDateString();
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   ID: ${student.id}`);
      console.log(`   Level: ${student.level || 'Not set'}`);
      console.log(`   Target Language: ${student.target_language || 'Not set'}`);
      console.log(`   Native Language: ${student.native_language || 'Not set'}`);
      console.log(`   Created: ${createdDate}`);
      console.log('');
    });

    // Get lesson count for each student
    console.log('📚 Lesson counts:');
    for (const student of students) {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('student_id', student.id);

      if (!lessonsError) {
        console.log(`   ${student.name}: ${lessons.length} lessons`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get tutor email from command line argument or use default
const tutorEmail = process.argv[2] || 'sachinmalusare207@gmail.com';
listStudentsForTutor(tutorEmail);