const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Replicate the getInstantImage logic from ai-image-utils.ts
const PRE_GENERATED_IMAGES = {
  conversation: [
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1792&h=1024&fit=crop&crop=center",
  ],
  business: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1792&h=1024&fit=crop&crop=center",
  ],
};

function getInstantImage(title) {
  const lowerTitle = title.toLowerCase();

  // Check for keywords in title
  for (const [category, imageArray] of Object.entries(PRE_GENERATED_IMAGES)) {
    if (lowerTitle.includes(category)) {
      const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
      const imageIndex = hash % imageArray.length;
      console.log(`   ✓ Found category "${category}" in title`);
      console.log(`   ✓ Hash: ${hash}, Index: ${imageIndex}`);
      return imageArray[imageIndex];
    }
  }

  // Check for common language learning patterns
  if (lowerTitle.includes("speak") || lowerTitle.includes("talk") || lowerTitle.includes("conversation")) {
    const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.conversation.length;
    console.log(`   ✓ Found conversation pattern in title`);
    console.log(`   ✓ Hash: ${hash}, Index: ${imageIndex}`);
    return PRE_GENERATED_IMAGES.conversation[imageIndex];
  }

  console.log(`   ✗ No matching category found`);
  return null;
}

async function traceBannerImageFlow() {
  console.log('🔍 TRACING BANNER IMAGE SELECTION FLOW\n');
  console.log('='.repeat(80));
  console.log('\n');

  const shareId = 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8';

  // Get the shared lesson
  const { data: sharedLesson } = await supabase
    .from('shared_lessons')
    .select(`
      id,
      lesson_id,
      lesson_title,
      banner_image_url,
      lesson:lessons (
        interactive_lesson_content
      )
    `)
    .eq('id', shareId)
    .single();

  if (!sharedLesson) {
    console.log('❌ Shared lesson not found');
    return;
  }

  console.log('📚 SHARED LESSON DATA:');
  console.log('   ID:', shareId);
  console.log('   Lesson Title (stored):', sharedLesson.lesson_title);
  console.log('   Banner URL (stored):', sharedLesson.banner_image_url);
  console.log('');

  // Parse lesson content
  const lesson = Array.isArray(sharedLesson.lesson) ? sharedLesson.lesson[0] : sharedLesson.lesson;
  const lessonContent = typeof lesson.interactive_lesson_content === 'string'
    ? JSON.parse(lesson.interactive_lesson_content)
    : lesson.interactive_lesson_content;

  const actualLessonTitle = lessonContent?.selected_sub_topic?.title || 
                           lessonContent?.name || 
                           lessonContent?.title ||
                           'Language Lesson';

  console.log('📖 LESSON CONTENT ANALYSIS:');
  console.log('   Actual Lesson Title:', actualLessonTitle);
  console.log('   Sub-topic Title:', lessonContent?.selected_sub_topic?.title);
  console.log('   Content Name:', lessonContent?.name);
  console.log('');

  console.log('🎨 BANNER IMAGE SELECTION FLOW:');
  console.log('');

  // FLOW 1: What the LessonBannerImage component does
  console.log('1️⃣  LessonBannerImage Component (on actual page):');
  console.log('   Input title:', actualLessonTitle);
  console.log('   Calls: useLessonBanner({ title: "' + actualLessonTitle + '" })');
  console.log('   Which calls: getInstantImage("' + actualLessonTitle + '")');
  const pageImage = getInstantImage(actualLessonTitle);
  console.log('   Result:', pageImage);
  console.log('');

  // FLOW 2: What gets stored when sharing
  console.log('2️⃣  When Sharing (handleShareLesson):');
  console.log('   Calls: getLessonBannerUrl(lesson)');
  console.log('   Which extracts title:', actualLessonTitle);
  console.log('   Then calls: getInstantImage("' + actualLessonTitle + '")');
  const sharedImage = getInstantImage(actualLessonTitle);
  console.log('   Result:', sharedImage);
  console.log('   Stored in DB:', sharedLesson.banner_image_url);
  console.log('');

  // FLOW 3: What the OG metadata uses
  console.log('3️⃣  OG Metadata (layout.tsx):');
  console.log('   Checks: sharedLesson.banner_image_url');
  console.log('   Value:', sharedLesson.banner_image_url);
  console.log('   Uses stored URL:', sharedLesson.banner_image_url ? 'YES' : 'NO');
  console.log('');

  console.log('='.repeat(80));
  console.log('\n');

  console.log('🎯 ANALYSIS:');
  console.log('');

  if (pageImage === sharedLesson.banner_image_url) {
    console.log('✅ IMAGES MATCH!');
    console.log('   The page and OG use the same image');
  } else {
    console.log('❌ IMAGES MISMATCH!');
    console.log('');
    console.log('   Page shows:', pageImage);
    console.log('   OG shows:', sharedLesson.banner_image_url);
    console.log('');
    console.log('   ROOT CAUSE:');
    console.log('   The stored banner_image_url was generated at a different time');
    console.log('   or with a different title than what the page is using now.');
    console.log('');
    console.log('   SOLUTION:');
    console.log('   Both should use the SAME title: "' + actualLessonTitle + '"');
  }
}

traceBannerImageFlow().catch(console.error);
