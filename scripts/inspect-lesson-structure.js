const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectLessonStructure() {
  console.log('🔍 Inspecting Lesson Structure\n');
  console.log('='.repeat(60));

  try {
    // Get one conversation lesson
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, interactive_lesson_content, lesson_template_id')
      .eq('lesson_template_id', '4a4d13e2-22ab-43cd-b331-4649333f2c4a') // B1 Conversation
      .not('interactive_lesson_content', 'is', null)
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (lessons.length === 0) {
      console.log('⚠️  No lessons found');
      return;
    }

    const lesson = lessons[0];
    console.log(`\n📋 Lesson ID: ${lesson.id}`);
    console.log(`\n📄 Full interactive_lesson_content structure:\n`);
    
    const content = typeof lesson.interactive_lesson_content === 'string'
      ? JSON.parse(lesson.interactive_lesson_content)
      : lesson.interactive_lesson_content;

    console.log(JSON.stringify(content, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

inspectLessonStructure();
