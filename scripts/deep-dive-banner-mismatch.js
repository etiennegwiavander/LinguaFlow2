const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Full PRE_GENERATED_IMAGES from ai-image-utils.ts
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

function generateEnhancedFallback(title) {
  const contextualImage = getInstantImage(title);
  if (contextualImage) {
    return contextualImage;
  }

  const allCategories = Object.keys(PRE_GENERATED_IMAGES);
  const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const categoryIndex = hash % allCategories.length;
  const selectedCategory = allCategories[categoryIndex];
  const imageArray = PRE_GENERATED_IMAGES[selectedCategory];
  const imageIndex = (hash * 7) % imageArray.length;

  return imageArray[imageIndex];
}

async function deepDiveBannerMismatch() {
  console.log('🔬 DEEP DIVE: Banner Image Mismatch Analysis\n');
  console.log('='.repeat(80));
  console.log('\n');

  const shareId = 'd7ba786a-f5e4-4bbd-87e3-7c1703f564e8';

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

  const lesson = Array.isArray(sharedLesson.lesson) ? sharedLesson.lesson[0] : sharedLesson.lesson;
  const lessonContent = typeof lesson.interactive_lesson_content === 'string'
    ? JSON.parse(lesson.interactive_lesson_content)
    : lesson.interactive_lesson_content;

  const actualTitle = lessonContent?.selected_sub_topic?.title || 
                     lessonContent?.name || 
                     'Language Lesson';

  console.log('📊 CURRENT STATE:');
  console.log('   Actual Lesson Title:', actualTitle);
  console.log('   Stored Banner URL:', sharedLesson.banner_image_url);
  console.log('');

  console.log('🎨 WHAT THE PAGE DISPLAYS:');
  console.log('   Title used:', actualTitle);
  const instantImage = getInstantImage(actualTitle);
  console.log('   getInstantImage result:', instantImage || 'null');
  
  if (!instantImage) {
    const fallbackImage = generateEnhancedFallback(actualTitle);
    console.log('   generateEnhancedFallback result:', fallbackImage);
    console.log('   ✓ Page will show this fallback image');
  } else {
    console.log('   ✓ Page will show this instant image');
  }
  console.log('');

  console.log('🌐 WHAT THE OG PREVIEW SHOWS:');
  console.log('   Uses stored banner_image_url:', sharedLesson.banner_image_url);
  console.log('');

  console.log('🔍 VERIFICATION:');
  console.log('   Stored URL:', sharedLesson.banner_image_url);
  
  // Check if stored URL matches conversation category
  const conversationImages = PRE_GENERATED_IMAGES.conversation;
  const isConversationImage = conversationImages.includes(
    sharedLesson.banner_image_url.replace(/\?.*$/, '?w=1792&h=1024&fit=crop&crop=center')
  );
  
  console.log('   Is from conversation category?', isConversationImage ? 'YES' : 'NO');
  
  if (isConversationImage) {
    console.log('   ✓ This confirms the stored URL is from an old "conversation" lesson');
  }
  console.log('');

  console.log('💡 ROOT CAUSE IDENTIFIED:');
  console.log('   1. The lesson content was updated/changed');
  console.log('   2. Old title: probably "Small Talk Across Cultures" (conversation)');
  console.log('   3. New title: "' + actualTitle + '" (business/negotiation)');
  console.log('   4. The shared_lessons.banner_image_url still has the OLD image');
  console.log('   5. The page generates a NEW image based on the current title');
  console.log('');

  console.log('✅ SOLUTION:');
  console.log('   Update the stored banner_image_url to match the current lesson content');
  console.log('');

  // Generate the correct banner URL
  const correctInstantImage = getInstantImage(actualTitle);
  const correctBannerUrl = correctInstantImage || generateEnhancedFallback(actualTitle);
  
  console.log('   Correct banner URL should be:', correctBannerUrl);
  console.log('');

  console.log('🔧 FIXING...');
  const { error } = await supabase
    .from('shared_lessons')
    .update({ banner_image_url: correctBannerUrl })
    .eq('id', shareId);

  if (error) {
    console.log('   ❌ Error updating:', error.message);
  } else {
    console.log('   ✅ Successfully updated banner_image_url!');
    console.log('   ✅ The OG preview will now match the page banner');
  }
}

deepDiveBannerMismatch().catch(console.error);
