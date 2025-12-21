const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseOGMismatch() {
  console.log('🔍 Diagnosing OG Banner and Student Name Issues...\n');

  const shareId = 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8';

  // Fetch exactly what the layout.tsx fetches
  const { data: sharedLesson, error } = await supabase
    .from('shared_lessons')
    .select(`
      lesson_title,
      student_name,
      shared_at,
      banner_image_url,
      lesson_category,
      lesson_level,
      lesson:lessons (
        interactive_lesson_content,
        student:students (
          level,
          target_language,
          name
        )
      )
    `)
    .eq('id', shareId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 SHARED LESSON DATA:');
  console.log('   lesson_title:', sharedLesson.lesson_title);
  console.log('   student_name:', sharedLesson.student_name);
  console.log('   banner_image_url:', sharedLesson.banner_image_url);
  console.log('   lesson_category:', sharedLesson.lesson_category);
  console.log('   lesson_level:', sharedLesson.lesson_level);
  console.log('');

  console.log('📊 LESSON DATA:');
  console.log('   Type:', Array.isArray(sharedLesson.lesson) ? 'Array' : 'Object');
  if (Array.isArray(sharedLesson.lesson)) {
    console.log('   Length:', sharedLesson.lesson.length);
    if (sharedLesson.lesson.length > 0) {
      const lesson = sharedLesson.lesson[0];
      console.log('   First lesson has interactive_lesson_content:', !!lesson.interactive_lesson_content);
      console.log('   First lesson has student:', !!lesson.student);
      if (lesson.student) {
        console.log('   Student type:', Array.isArray(lesson.student) ? 'Array' : 'Object');
        if (Array.isArray(lesson.student)) {
          console.log('   Student array length:', lesson.student.length);
          if (lesson.student.length > 0) {
            console.log('   Student[0].name:', lesson.student[0].name);
            console.log('   Student[0].level:', lesson.student[0].level);
            console.log('   Student[0].target_language:', lesson.student[0].target_language);
          }
        } else {
          console.log('   Student.name:', lesson.student.name);
          console.log('   Student.level:', lesson.student.level);
          console.log('   Student.target_language:', lesson.student.target_language);
        }
      }
    }
  } else if (sharedLesson.lesson) {
    console.log('   Has interactive_lesson_content:', !!sharedLesson.lesson.interactive_lesson_content);
    console.log('   Has student:', !!sharedLesson.lesson.student);
  }
  console.log('');

  // Parse lesson content to see what title would be generated
  if (sharedLesson.lesson) {
    const lesson = Array.isArray(sharedLesson.lesson) ? sharedLesson.lesson[0] : sharedLesson.lesson;
    if (lesson && lesson.interactive_lesson_content) {
      const content = typeof lesson.interactive_lesson_content === 'string'
        ? JSON.parse(lesson.interactive_lesson_content)
        : lesson.interactive_lesson_content;

      const lessonTitle = content.selected_sub_topic?.title || 
                         content.name || 
                         content.title ||
                         'Language Lesson';

      console.log('📝 LESSON CONTENT ANALYSIS:');
      console.log('   Extracted lesson title:', lessonTitle);
      console.log('   This would generate banner for:', lessonTitle);
      console.log('');
    }
  }

  console.log('🎯 ISSUES IDENTIFIED:');
  console.log('   1. Banner URL stored:', sharedLesson.banner_image_url);
  console.log('   2. Student name stored:', sharedLesson.student_name);
  console.log('');
  console.log('💡 EXPECTED BEHAVIOR:');
  console.log('   - OG should use banner_image_url from shared_lessons table');
  console.log('   - Description should use student_name from shared_lessons table');
}

diagnoseOGMismatch().catch(console.error);
