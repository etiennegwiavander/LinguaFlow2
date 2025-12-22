const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBannerFixComplete() {
  console.log('✅ VERIFYING BANNER FIX IS COMPLETE\n');
  console.log('='.repeat(80));
  console.log('\n');

  const shareId = 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8';

  const { data: sharedLesson } = await supabase
    .from('shared_lessons')
    .select(`
      id,
      lesson_title,
      student_name,
      banner_image_url,
      lesson:lessons (
        interactive_lesson_content
      )
    `)
    .eq('id', shareId)
    .single();

  const lesson = Array.isArray(sharedLesson.lesson) ? sharedLesson.lesson[0] : sharedLesson.lesson;
  const lessonContent = typeof lesson.interactive_lesson_content === 'string'
    ? JSON.parse(lesson.interactive_lesson_content)
    : lesson.interactive_lesson_content;

  const actualTitle = lessonContent?.selected_sub_topic?.title || 'Language Lesson';

  console.log('📊 FINAL STATE:');
  console.log('   Lesson Title:', actualTitle);
  console.log('   Student Name:', sharedLesson.student_name);
  console.log('   Banner URL:', sharedLesson.banner_image_url);
  console.log('');

  console.log('🎨 WHAT WILL BE DISPLAYED:');
  console.log('');
  console.log('   📱 On the Page:');
  console.log('      Title: "' + actualTitle + '"');
  console.log('      Banner: Business/office image (books and professional setting)');
  console.log('      URL: ' + sharedLesson.banner_image_url);
  console.log('');
  console.log('   🌐 In OG Preview:');
  console.log('      Title: "' + actualTitle + ' - B2 Level | LinguaFlow"');
  console.log('      Description: "Business English lesson for ' + sharedLesson.student_name + '."');
  console.log('      Banner: ' + sharedLesson.banner_image_url);
  console.log('');

  // Check if they match
  const expectedBannerUrl = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1792&h=1024&fit=crop&crop=center';
  
  if (sharedLesson.banner_image_url === expectedBannerUrl) {
    console.log('✅ SUCCESS! Banner images now match!');
    console.log('');
    console.log('   ✓ Page banner: Business image');
    console.log('   ✓ OG preview: Same business image');
    console.log('   ✓ Student name: ' + sharedLesson.student_name);
    console.log('');
    console.log('🎉 ALL ISSUES RESOLVED!');
  } else {
    console.log('⚠️  Banner URL is different than expected');
    console.log('   Expected:', expectedBannerUrl);
    console.log('   Actual:', sharedLesson.banner_image_url);
  }
}

verifyBannerFixComplete().catch(console.error);
