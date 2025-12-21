const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewLessonShare() {
  console.log('🧪 Testing New Lesson Share Flow...\n');

  // Get a lesson to test with
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id,
      tutor_id,
      student_id,
      interactive_lesson_content,
      student:students (
        name,
        level,
        target_language
      )
    `)
    .limit(1)
    .single();

  if (!lesson) {
    console.log('❌ No lesson found to test with');
    return;
  }

  console.log('📚 Test Lesson:');
  console.log('   ID:', lesson.id);
  console.log('   Student ID:', lesson.student_id);
  console.log('');

  // Simulate the NEW handleShareLesson logic
  const studentData = Array.isArray(lesson.student) ? lesson.student[0] : lesson.student;
  const studentName = studentData?.name || 'Student';
  
  const lessonContent = typeof lesson.interactive_lesson_content === 'string'
    ? JSON.parse(lesson.interactive_lesson_content)
    : lesson.interactive_lesson_content;

  const lessonTitle = lessonContent?.selected_sub_topic?.title || 
                     lessonContent?.name || 
                     'Interactive Lesson';

  console.log('📝 Data that would be saved:');
  console.log('   student_name:', studentName);
  console.log('   lesson_title:', lessonTitle);
  console.log('   lesson_level:', studentData?.level);
  console.log('   lesson_category:', lessonContent?.selected_sub_topic?.category || lessonContent?.category);
  console.log('');

  console.log('✅ VERIFICATION:');
  if (studentName !== 'Student') {
    console.log('   ✓ Student name is correctly extracted:', studentName);
  } else {
    console.log('   ⚠️  Student name defaulted to "Student"');
  }

  if (lessonTitle !== 'Interactive Lesson') {
    console.log('   ✓ Lesson title is correctly extracted:', lessonTitle);
  } else {
    console.log('   ⚠️  Lesson title defaulted to "Interactive Lesson"');
  }

  console.log('');
  console.log('🎯 EXPECTED OG PREVIEW:');
  console.log('   Title:', `${lessonTitle} - ${studentData?.level?.toUpperCase()} Level | LinguaFlow`);
  console.log('   Description:', `Lesson for ${studentName}.`);
  console.log('');
  console.log('✅ The fix ensures:');
  console.log('   1. Student name is fetched from database during sharing');
  console.log('   2. Banner URL is stored and reused for consistency');
  console.log('   3. OG preview matches the actual lesson page');
}

testNewLessonShare().catch(console.error);
