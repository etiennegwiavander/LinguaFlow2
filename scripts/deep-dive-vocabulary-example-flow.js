const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepDiveVocabularyFlow() {
  console.log('🔍 DEEP DIVE: VOCABULARY EXAMPLE SENTENCE GENERATION FLOW\n');
  console.log('='.repeat(80));

  // Find the most recent lesson with vocabulary
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .not('interactive_lesson_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (lessonError || !lessons.length) {
    console.error('❌ Error finding lessons:', lessonError);
    return;
  }

  console.log(`\n📚 Found ${lessons.length} recent lessons\n`);

  for (const lesson of lessons) {
    const content = lesson.interactive_lesson_content;
    const subTopic = content.selected_sub_topic;

    console.log('━'.repeat(80));
    console.log(`\n📝 LESSON: ${lesson.id}`);
    console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
    console.log(`   Sub-topic: ${subTopic?.title || 'Unknown'}`);
    console.log(`   Category: ${subTopic?.category || content.category}`);
    console.log(`   Level: ${subTopic?.level || content.level}`);

    // Check vocabulary sections
    const sections = content.sections || [];
    const vocabSections = sections.filter(s => 
      s.title?.toLowerCase().includes('vocabulary') ||
      s.id?.toLowerCase().includes('vocabulary')
    );

    console.log(`\n   📚 Vocabulary sections: ${vocabSections.length}`);

    for (const vocabSection of vocabSections) {
      const vocabItems = vocabSection.vocabulary_items || [];
      console.log(`\n   ━━━ ${vocabSection.title} ━━━`);
      console.log(`       Total words: ${vocabItems.length}`);

      if (vocabItems.length === 0) {
        console.log('       ❌ NO VOCABULARY ITEMS GENERATED');
        continue;
      }

      let wordsWithExamples = 0;
      let wordsWithoutExamples = 0;

      for (const item of vocabItems) {
        const examples = item.examples || [];
        if (examples.length === 0) {
          wordsWithoutExamples++;
          console.log(`       ❌ "${item.word}" - NO EXAMPLES`);
        } else {
          wordsWithExamples++;
          console.log(`       ✅ "${item.word}" - ${examples.length} examples`);
        }
      }

      console.log(`\n       📊 Summary:`);
      console.log(`          With examples: ${wordsWithExamples}`);
      console.log(`          Without examples: ${wordsWithoutExamples}`);
      console.log(`          Missing rate: ${vocabItems.length > 0 ? ((wordsWithoutExamples/vocabItems.length)*100).toFixed(1) : 0}%`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 ANALYZING EDGE FUNCTION CODE\n');

  console.log('Checking the AI prompt construction in generate-interactive-material...\n');
}

deepDiveVocabularyFlow().catch(console.error);
