const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyOGFixes() {
  console.log('✅ Verifying OG Banner and Student Name Fixes...\n');

  const shareId = 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8';

  // Simulate what the layout.tsx does
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

  console.log('📊 SHARED LESSON DATA (what OG will use):');
  console.log('   lesson_title:', sharedLesson.lesson_title);
  console.log('   student_name:', sharedLesson.student_name);
  console.log('   banner_image_url:', sharedLesson.banner_image_url);
  console.log('   lesson_category:', sharedLesson.lesson_category);
  console.log('   lesson_level:', sharedLesson.lesson_level);
  console.log('');

  // Extract lesson details (same as layout.tsx)
  const lesson = Array.isArray(sharedLesson.lesson) ? sharedLesson.lesson[0] : sharedLesson.lesson;
  const lessonContent = lesson?.interactive_lesson_content;
  const student = Array.isArray(lesson?.student) ? lesson?.student[0] : lesson?.student;
  
  const subTopicTitle = lessonContent?.selected_sub_topic?.title || 
                       lessonContent?.name || 
                       sharedLesson.lesson_title;
  const subTopicCategory = sharedLesson.lesson_category ||
                          lessonContent?.selected_sub_topic?.category || 
                          lessonContent?.category || 
                          'Language Learning';

  // Simulate banner URL logic
  const bannerImageUrl = sharedLesson.banner_image_url 
    ? sharedLesson.banner_image_url
    : 'Would generate from lesson content';

  console.log('🎨 OG METADATA (what will be generated):');
  console.log('   Title:', `${subTopicTitle} - ${sharedLesson.lesson_level?.toUpperCase()} Level | LinguaFlow`);
  console.log('   Description:', `${subTopicCategory} lesson for ${sharedLesson.student_name}.`);
  console.log('   Banner Image:', bannerImageUrl);
  console.log('');

  console.log('✅ VERIFICATION RESULTS:');
  console.log('   ✓ Student name is correct:', sharedLesson.student_name !== 'Student' ? '✅ YES' : '❌ NO');
  console.log('   ✓ Banner URL is stored:', sharedLesson.banner_image_url ? '✅ YES' : '❌ NO');
  console.log('   ✓ Banner will be used:', sharedLesson.banner_image_url ? '✅ YES (from DB)' : '⚠️  NO (will generate)');
  console.log('');

  if (sharedLesson.student_name !== 'Student' && sharedLesson.banner_image_url) {
    console.log('🎉 ALL FIXES VERIFIED!');
    console.log('   The OG preview will now show:');
    console.log('   - Correct student name:', sharedLesson.student_name);
    console.log('   - Consistent banner image from database');
  } else {
    console.log('⚠️  ISSUES REMAINING:');
    if (sharedLesson.student_name === 'Student') {
      console.log('   - Student name is still generic');
    }
    if (!sharedLesson.banner_image_url) {
      console.log('   - Banner URL not stored');
    }
  }
}

verifyOGFixes().catch(console.error);
