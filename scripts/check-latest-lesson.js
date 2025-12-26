require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestLesson() {
  console.log('🔍 Checking latest lesson in history...\n');

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!lessons || lessons.length === 0) {
    console.log('❌ No lessons found');
    return;
  }

  console.log(`Found ${lessons.length} recent lessons:\n`);
  
  lessons.forEach((lesson, idx) => {
    console.log(`\n=== LESSON ${idx + 1} ===`);
    console.log('   ID:', lesson.id);
    console.log('   Category:', lesson.interactive_lesson_content?.category || 'N/A');
    console.log('   Name:', lesson.interactive_lesson_content?.name || 'N/A');
    console.log('   Created:', new Date(lesson.created_at).toLocaleString());
    console.log('   Updated:', new Date(lesson.updated_at).toLocaleString());
  });

  const lesson = lessons[0];
  console.log('\n\n📋 Analyzing MOST RECENT Lesson:');
  console.log('   Category:', lesson.interactive_lesson_content?.category);
  console.log('   Name:', lesson.interactive_lesson_content?.name);
  console.log('\n🔍 Analyzing sections...\n');

  const sections = lesson.interactive_lesson_content?.sections || [];
  
  sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section.title || 'Untitled'}`);
    console.log(`   ID: ${section.id}`);
    console.log(`   Type: ${section.type}`);
    console.log(`   Content Type: ${section.content_type || 'none'}`);
    
    if (section.id === 'find_the_sounds') {
      console.log('\n   🎯 SOUND IDENTIFICATION SECTION FOUND!');
      console.log('   All fields in this section:');
      Object.keys(section).forEach(key => {
        if (key !== 'title' && key !== 'id' && key !== 'type' && key !== 'content_type') {
          console.log(`      - ${key}: ${typeof section[key]} (${Array.isArray(section[key]) ? `array with ${section[key].length} items` : 'not array'})`);
          if (key === 'matching_questions') {
            console.log(`        Content:`, JSON.stringify(section[key], null, 2));
          }
        }
      });
    }
    console.log('');
  });
}

checkLatestLesson();
