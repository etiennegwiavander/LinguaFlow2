const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLessonStudentData() {
  console.log('🔍 Checking lesson and student data...\n');

  // Get a shared lesson and trace back to the original lesson
  const { data: sharedLesson } = await supabase
    .from('shared_lessons')
    .select('id, lesson_id, student_name')
    .eq('id', 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8')
    .single();

  if (!sharedLesson) {
    console.log('Shared lesson not found');
    return;
  }

  console.log('📚 Shared Lesson:');
  console.log('   ID:', sharedLesson.id);
  console.log('   Lesson ID:', sharedLesson.lesson_id);
  console.log('   Student Name (stored):', sharedLesson.student_name);
  console.log('');

  // Get the original lesson with student data
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id,
      student_id,
      student:students (
        id,
        name,
        level,
        target_language
      )
    `)
    .eq('id', sharedLesson.lesson_id)
    .single();

  if (!lesson) {
    console.log('Original lesson not found');
    return;
  }

  console.log('📖 Original Lesson:');
  console.log('   ID:', lesson.id);
  console.log('   Student ID:', lesson.student_id);
  console.log('   Student data:', lesson.student);
  console.log('');

  console.log('🎯 ISSUE:');
  console.log('   When sharing, the code uses: lesson.student?.name || "Student"');
  console.log('   But lesson.student might not be populated in the component');
  console.log('   Actual student name should be:', lesson.student?.name);
  console.log('   But it was saved as:', sharedLesson.student_name);
}

checkLessonStudentData().catch(console.error);
