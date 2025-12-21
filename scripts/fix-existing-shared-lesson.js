const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixExistingSharedLesson() {
  console.log('🔧 Fixing existing shared lesson...\n');

  const shareId = 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8';

  // Get the shared lesson
  const { data: sharedLesson } = await supabase
    .from('shared_lessons')
    .select('id, lesson_id, student_name')
    .eq('id', shareId)
    .single();

  if (!sharedLesson) {
    console.log('❌ Shared lesson not found');
    return;
  }

  console.log('📚 Current shared lesson:');
  console.log('   Student name:', sharedLesson.student_name);
  console.log('');

  // Get the actual student name from the lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id,
      student:students (
        name
      )
    `)
    .eq('id', sharedLesson.lesson_id)
    .single();

  if (!lesson || !lesson.student) {
    console.log('❌ Could not fetch student data');
    return;
  }

  const studentData = Array.isArray(lesson.student) ? lesson.student[0] : lesson.student;
  const actualStudentName = studentData.name;

  console.log('✅ Actual student name:', actualStudentName);
  console.log('');

  // Update the shared lesson
  const { error } = await supabase
    .from('shared_lessons')
    .update({ student_name: actualStudentName })
    .eq('id', shareId);

  if (error) {
    console.error('❌ Error updating:', error);
    return;
  }

  console.log('✅ Successfully updated shared lesson!');
  console.log('   New student name:', actualStudentName);
  console.log('');
  console.log('🎯 The OG preview will now show the correct student name');
}

fixExistingSharedLesson().catch(console.error);
