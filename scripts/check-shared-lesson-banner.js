const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSharedLessonBanner() {
  console.log('🔍 Checking shared lesson banner images...\n');

  // Get the most recent shared lesson
  const { data: sharedLessons, error } = await supabase
    .from('shared_lessons')
    .select(`
      id,
      lesson_title,
      banner_image_url,
      lesson:lessons (
        interactive_lesson_content
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching shared lessons:', error);
    return;
  }

  if (!sharedLessons || sharedLessons.length === 0) {
    console.log('No shared lessons found');
    return;
  }

  console.log(`Found ${sharedLessons.length} recent shared lessons:\n`);

  for (const lesson of sharedLessons) {
    console.log(`📚 Lesson: ${lesson.lesson_title}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Banner URL in DB: ${lesson.banner_image_url || 'NOT SET'}`);
    
    // Check what's in the lesson content
    if (lesson.lesson && lesson.lesson.interactive_lesson_content) {
      const content = typeof lesson.lesson.interactive_lesson_content === 'string' 
        ? JSON.parse(lesson.lesson.interactive_lesson_content)
        : lesson.lesson.interactive_lesson_content;
      
      const lessonTitle = content.selected_sub_topic?.title || 
                         content.name || 
                         content.title ||
                         lesson.lesson_title;
      
      console.log(`   Lesson Title from Content: ${lessonTitle}`);
    }
    
    console.log('');
  }
}

checkSharedLessonBanner().catch(console.error);
