const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeBrokenLesson() {
  console.log('🔍 ANALYZING BROKEN LESSON WITH UNDEFINED VOCABULARY\n');
  console.log('='.repeat(80));

  const lessonId = '6d82e457-80e9-461a-ab8b-1d2a444587dc';

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('\n📝 LESSON DETAILS:');
  console.log(`   ID: ${lesson.id}`);
  console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
  console.log(`   Template ID: ${lesson.lesson_template_id}`);

  const content = lesson.interactive_lesson_content;
  console.log(`\n📋 CONTENT STRUCTURE:`);
  console.log(`   Category: ${content.category}`);
  console.log(`   Level: ${content.level}`);
  console.log(`   Sub-topic: ${content.selected_sub_topic?.title}`);
  console.log(`   Sections: ${content.sections?.length || 0}`);

  // Find vocabulary section
  const vocabSection = content.sections?.find(s => 
    s.title?.toLowerCase().includes('vocabulary')
  );

  if (!vocabSection) {
    console.log('\n❌ NO VOCABULARY SECTION FOUND');
    return;
  }

  console.log(`\n📚 VOCABULARY SECTION: ${vocabSection.title}`);
  console.log(`   Section ID: ${vocabSection.id}`);
  console.log(`   Content Type: ${vocabSection.content_type}`);
  console.log(`   Vocabulary Items: ${vocabSection.vocabulary_items?.length || 0}`);

  console.log('\n🔍 RAW VOCABULARY ITEMS DATA:');
  console.log(JSON.stringify(vocabSection.vocabulary_items, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 ROOT CAUSE ANALYSIS:\n');

  if (vocabSection.vocabulary_items) {
    for (let i = 0; i < vocabSection.vocabulary_items.length; i++) {
      const item = vocabSection.vocabulary_items[i];
      console.log(`Item ${i + 1}:`);
      console.log(`  word: ${item.word} (type: ${typeof item.word})`);
      console.log(`  definition: ${item.definition}`);
      console.log(`  part_of_speech: ${item.part_of_speech}`);
      console.log(`  examples: ${JSON.stringify(item.examples)}`);
      console.log(`  All keys: ${Object.keys(item).join(', ')}`);
      console.log('');
    }
  }

  console.log('\n💡 DIAGNOSIS:');
  console.log('The vocabulary items have "undefined" as the word value.');
  console.log('This suggests the AI response structure is malformed or');
  console.log('the JSON parsing is extracting the wrong field.');
  console.log('\nLet me check the template used for this lesson...\n');

  if (lesson.lesson_template_id) {
    const { data: template } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('id', lesson.lesson_template_id)
      .single();

    if (template) {
      console.log('📋 TEMPLATE USED:');
      console.log(`   Name: ${template.name}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Level: ${template.level}`);
      
      const templateVocabSection = template.sections?.find(s => 
        s.title?.toLowerCase().includes('vocabulary')
      );
      
      if (templateVocabSection) {
        console.log(`\n   Template vocabulary section structure:`);
        console.log(JSON.stringify(templateVocabSection, null, 2));
      }
    }
  }
}

analyzeBrokenLesson().catch(console.error);
