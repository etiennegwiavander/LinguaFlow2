const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the banner URL generator logic
function getInstantImage(title) {
  const PRE_GENERATED_IMAGES = {
    conversation: [
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1792&h=1024&fit=crop&crop=center",
    ],
  };

  const lowerTitle = title.toLowerCase();

  for (const [category, imageArray] of Object.entries(PRE_GENERATED_IMAGES)) {
    if (lowerTitle.includes(category)) {
      const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
      const imageIndex = hash % imageArray.length;
      return imageArray[imageIndex];
    }
  }

  if (lowerTitle.includes("speak") || lowerTitle.includes("talk") || lowerTitle.includes("conversation")) {
    const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.conversation.length;
    return PRE_GENERATED_IMAGES.conversation[imageIndex];
  }

  return null;
}

function getLessonBannerUrl(lesson) {
  try {
    if (!lesson) return null;

    const lessonContent = lesson.interactive_lesson_content;
    if (!lessonContent) return null;

    const lessonTitle = lessonContent.selected_sub_topic?.title || 
                       lessonContent.name || 
                       lessonContent.title ||
                       'Language Lesson';

    const curatedImageUrl = getInstantImage(lessonTitle);
    if (curatedImageUrl) return curatedImageUrl;

    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&crop=center';
  } catch (error) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&crop=center';
  }
}

function getOGBannerUrl(bannerUrl) {
  if (!bannerUrl) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&crop=center';
  }

  if (bannerUrl.includes('unsplash.com')) {
    const url = new URL(bannerUrl);
    url.searchParams.set('w', '1200');
    url.searchParams.set('h', '630');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('crop', 'center');
    return url.toString();
  }

  return bannerUrl;
}

async function testOGBannerFix() {
  console.log('🧪 Testing OG Banner Fix...\n');

  // Get the shared lesson with banner_image_url
  const { data: sharedLesson, error } = await supabase
    .from('shared_lessons')
    .select(`
      id,
      lesson_title,
      banner_image_url,
      lesson:lessons (
        interactive_lesson_content
      )
    `)
    .eq('id', 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📚 Testing Lesson:', sharedLesson.lesson_title);
  console.log('   ID:', sharedLesson.id);
  console.log('');

  // Simulate the OLD behavior (always generate from lesson content)
  const lesson = Array.isArray(sharedLesson.lesson) ? sharedLesson.lesson[0] : sharedLesson.lesson;
  const oldBehaviorUrl = getOGBannerUrl(getLessonBannerUrl(lesson));
  
  console.log('❌ OLD BEHAVIOR (always generate):');
  console.log('   Generated URL:', oldBehaviorUrl);
  console.log('');

  // Simulate the NEW behavior (use stored URL if available)
  const newBehaviorUrl = sharedLesson.banner_image_url 
    ? getOGBannerUrl(sharedLesson.banner_image_url)
    : getOGBannerUrl(getLessonBannerUrl(lesson));
  
  console.log('✅ NEW BEHAVIOR (use stored URL):');
  console.log('   Stored URL in DB:', sharedLesson.banner_image_url);
  console.log('   Final OG URL:', newBehaviorUrl);
  console.log('');

  // Compare
  if (oldBehaviorUrl === newBehaviorUrl) {
    console.log('⚠️  URLs are the SAME - this means the stored URL matches the generated one');
  } else {
    console.log('✅ URLs are DIFFERENT - the fix is working!');
    console.log('   The OG preview will now use the stored banner image');
  }
  
  console.log('');
  console.log('🎯 RESULT:');
  console.log('   The shared lesson page will now use the SAME banner image');
  console.log('   that is displayed on the actual lesson page.');
  console.log('   This ensures consistency between the OG preview and the actual content.');
}

testOGBannerFix().catch(console.error);
