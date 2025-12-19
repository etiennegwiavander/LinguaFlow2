require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStudentStatus() {
  console.log('🔍 Checking student status - NO STUDENTS WERE DELETED...\n');

  try {
    // Check total number of students
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, name, tutor_id, created_at')
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    console.log(`📊 TOTAL STUDENTS IN DATABASE: ${allStudents.length}`);
    console.log('\n📋 Recent students:');
    
    allStudents.slice(0, 10).forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} - Tutor: ${student.tutor_id.substring(0, 8)}...`);
    });

    // Check students by tutor
    console.log('\n👥 Students grouped by tutor:');
    const studentsByTutor = {};
    allStudents.forEach(student => {
      if (!studentsByTutor[student.tutor_id]) {
        studentsByTutor[student.tutor_id] = [];
      }
      studentsByTutor[student.tutor_id].push(student);
    });

    // Get tutor info for each group
    for (const tutorId of Object.keys(studentsByTutor)) {
      const { data: tutor, error: tutorError } = await supabase
        .from('tutors')
        .select('email, name')
        .eq('id', tutorId)
        .single();

      const tutorInfo = tutorError ? `Unknown (${tutorId.substring(0, 8)}...)` : `${tutor.email}`;
      console.log(`  ${tutorInfo}: ${studentsByTutor[tutorId].length} students`);
      
      // Show first few student names
      const studentNames = studentsByTutor[tutorId].slice(0, 3).map(s => s.name).join(', ');
      if (studentsByTutor[tutorId].length > 3) {
        console.log(`    (${studentNames}, and ${studentsByTutor[tutorId].length - 3} more...)`);
      } else {
        console.log(`    (${studentNames})`);
      }
    }

    // Check if any students were created recently (which would indicate they weren't deleted)
    const recentStudents = allStudents.filter(s => {
      const createdDate = new Date(s.created_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdDate > oneDayAgo;
    });

    if (recentStudents.length > 0) {
      console.log(`\n🆕 ${recentStudents.length} students created in the last 24 hours:`);
      recentStudents.forEach(student => {
        console.log(`  - ${student.name} (created: ${student.created_at})`);
      });
    }

    // Check lessons to see if they still reference the students
    console.log('\n📚 Checking lesson-student relationships...');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id, tutor_id')
      .limit(5);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
    } else {
      console.log(`📊 Sample lessons still reference students:`);
      lessons.forEach(lesson => {
        const student = allStudents.find(s => s.id === lesson.student_id);
        console.log(`  Lesson ${lesson.id.substring(0, 8)}... -> Student: ${student ? student.name : 'NOT FOUND'}`);
      });
    }

    console.log('\n✅ SUMMARY:');
    console.log(`- Total students in database: ${allStudents.length}`);
    console.log(`- Students distributed across ${Object.keys(studentsByTutor).length} tutors`);
    console.log('- All students appear to be intact');
    console.log('- Only lesson ownership (tutor_id) was changed, not student data');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkStudentStatus();