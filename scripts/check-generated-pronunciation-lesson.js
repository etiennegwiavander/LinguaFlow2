/**
 * Check what was actually generated for the most recent Pronunciation lesson
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGeneratedLesson() {
  console.log('🔍 Checking most recent Pronunciation lesson generation...\n');

  // First check lesson_history
  const { data: historyLessons } = await supabase
    .from('lesson_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`Found ${historyLessons?.length || 0} recent lessons in history\n`);

  if (historyLessons && historyLessons.length > 0) {
    // Find the most recent one with Pronunciation template
    for (const lesson of historyLessons) {
      // Check if it's a pronunciation lesson by looking at the template
      const { data: template } = await supabase
        .from('lesson_templates')
        .select('category, name')
        .eq('id', lesson.lesson_template_id)
        .single();

      if (template && template.category === 'Pronunciation') {
        console.log(`📋 Found Pronunciation Lesson: ${lesson.sub_topic_title}`);
        console.log(`   Template: ${template.name}`);
        console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}\n`);

        const content = lesson.interactive_lesson_content;
        if (!content || !content.sections) {
          console.log('❌ No interactive content found');
          return;
        }

        console.log('🔍 Analyzing generated sections:\n');
        console.log('='.repeat(80));

        content.sections.forEach((section, i) => {
          console.log(`\n${i + 1}. ${section.title || 'Untitled'}`);
          console.log(`   ID: ${section.id}`);
          console.log(`   Type: ${section.type}`);
          console.log(`   Content Type: ${section.content_type || 'none'}`);
          console.log(`   AI Placeholder: ${section.ai_placeholder || 'none'}`);

          // Check what fields exist in this section
          const fieldNames = Object.keys(section).filter(key => 
            !['id', 'type', 'title', 'subtitle', 'content_type', 'ai_placeholder', 'instruction', 'instruction_bg_color_var', 'background_color_var'].includes(key)
          );

          if (fieldNames.length > 0) {
            console.log(`   Generated fields: ${fieldNames.join(', ')}`);
            
            // Check specific problematic sections
            if (section.content_type === 'vocabulary_matching') {
              console.log(`\n   📊 VOCABULARY_MATCHING SECTION ANALYSIS:`);
              fieldNames.forEach(field => {
                const fieldContent = section[field];
                console.log(`      Field "${field}":`);
                if (typeof fieldContent === 'object' && fieldContent !== null) {
                  console.log(`         Type: object`);
                  console.log(`         Keys: ${Object.keys(fieldContent).join(', ')}`);
                  if (fieldContent.vocabulary_items) {
                    console.log(`         ✅ HAS vocabulary_items: ${fieldContent.vocabulary_items.length} items`);
                  } else {
                    console.log(`         ❌ MISSING vocabulary_items`);
                  }
                } else if (Array.isArray(fieldContent)) {
                  console.log(`         Type: array with ${fieldContent.length} items`);
                } else {
                  console.log(`         Type: ${typeof fieldContent}`);
                }
              });
            }

            if (section.content_type === 'matching') {
              console.log(`\n   📊 MATCHING SECTION ANALYSIS:`);
              fieldNames.forEach(field => {
                const fieldContent = section[field];
                console.log(`      Field "${field}":`);
                if (typeof fieldContent === 'object' && fieldContent !== null) {
                  console.log(`         Type: object`);
                  console.log(`         Keys: ${Object.keys(fieldContent).join(', ')}`);
                  if (fieldContent.matching_questions) {
                    console.log(`         ✅ HAS matching_questions: ${fieldContent.matching_questions.length} questions`);
                  } else {
                    console.log(`         ❌ MISSING matching_questions`);
                  }
                } else if (Array.isArray(fieldContent)) {
                  console.log(`         Type: array with ${fieldContent.length} items`);
                } else {
                  console.log(`         Type: ${typeof fieldContent}`);
                }
              });
            }
          } else {
            console.log(`   ⚠️  NO generated content fields found!`);
          }
        });

        console.log('\n' + '='.repeat(80));
        return; // Found it, exit
      }
    }
  }

  console.log('❌ No Pronunciation lessons found in recent history');
}

checkGeneratedLesson();
