const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseConversationVocabulary() {
  console.log('🔍 DIAGNOSING CONVERSATION VOCABULARY EXAMPLES\n');
  console.log('=' .repeat(80));

  // Find recent conversation lessons
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      created_at,
      interactive_lesson_content,
      lesson_template_id,
      student:students(name, level)
    `)
    .not('interactive_lesson_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    return;
  }

  console.log(`\n📊 Found ${lessons.length} lessons with interactive content\n`);

  // Filter for conversation lessons
  const conversationLessons = lessons.filter(lesson => {
    const content = lesson.interactive_lesson_content;
    return content?.category === 'Conversation' || 
           content?.selected_sub_topic?.category === 'Conversation';
  });

  console.log(`🗣️  Found ${conversationLessons.length} CONVERSATION lessons\n`);
  console.log('=' .repeat(80));

  for (const lesson of conversationLessons.slice(0, 5)) {
    console.log(`\n📝 LESSON ID: ${lesson.id}`);
    console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
    console.log(`   Student: ${lesson.student?.name} (Level: ${lesson.student?.level})`);
    console.log(`   Template ID: ${lesson.lesson_template_id || 'None'}`);

    const content = lesson.interactive_lesson_content;
    const subTopic = content.selected_sub_topic;
    
    console.log(`   Sub-topic: ${subTopic?.title || 'Unknown'}`);
    console.log(`   Category: ${subTopic?.category || content.category}`);
    console.log(`   Level: ${subTopic?.level || content.level}`);

    // Find vocabulary sections
    const sections = content.sections || [];
    const vocabSections = sections.filter(s => 
      s.title?.toLowerCase().includes('vocabulary') ||
      s.id?.toLowerCase().includes('vocabulary')
    );

    console.log(`\n   📚 Found ${vocabSections.length} vocabulary section(s)`);

    for (const vocabSection of vocabSections) {
      console.log(`\n   ━━━ VOCABULARY SECTION: ${vocabSection.title} ━━━`);
      console.log(`       Section ID: ${vocabSection.id}`);
      console.log(`       Content Type: ${vocabSection.content_type}`);

      const vocabItems = vocabSection.vocabulary_items || [];
      console.log(`       Total vocabulary items: ${vocabItems.length}`);

      if (vocabItems.length > 0) {
        console.log(`\n       🔍 ANALYZING EACH VOCABULARY WORD:\n`);

        for (let i = 0; i < vocabItems.length; i++) {
          const item = vocabItems[i];
          const examples = item.examples || [];
          
          console.log(`       ${i + 1}. Word: "${item.word}"`);
          console.log(`          Part of Speech: ${item.part_of_speech || 'N/A'}`);
          console.log(`          Definition: ${item.definition?.substring(0, 60)}...`);
          console.log(`          Number of examples: ${examples.length}`);

          if (examples.length > 0) {
            console.log(`          Examples:`);
            examples.forEach((ex, idx) => {
              const isGeneric = 
                ex.includes('is used in the context of language learning') ||
                ex.includes('helps with communication skills') ||
                ex.includes('in relevant situations') ||
                ex.includes('Understanding') && ex.includes('helps with') ||
                ex.includes('Students practice using') ||
                ex.includes('The word') && ex.includes('is used');

              const marker = isGeneric ? '⚠️  GENERIC' : '✅ SPECIFIC';
              console.log(`             ${idx + 1}. [${marker}] ${ex.substring(0, 80)}${ex.length > 80 ? '...' : ''}`);
            });
          } else {
            console.log(`          ❌ NO EXAMPLES FOUND`);
          }
          console.log('');
        }
      }
    }

    console.log('\n' + '─'.repeat(80));
  }

  // Summary statistics
  console.log('\n\n📊 SUMMARY STATISTICS\n');
  console.log('=' .repeat(80));

  let totalVocabWords = 0;
  let wordsWithGenericExamples = 0;
  let wordsWithNoExamples = 0;
  let totalExamples = 0;
  let genericExamples = 0;

  for (const lesson of conversationLessons) {
    const content = lesson.interactive_lesson_content;
    const sections = content.sections || [];
    const vocabSections = sections.filter(s => 
      s.title?.toLowerCase().includes('vocabulary') ||
      s.id?.toLowerCase().includes('vocabulary')
    );

    for (const vocabSection of vocabSections) {
      const vocabItems = vocabSection.vocabulary_items || [];
      
      for (const item of vocabItems) {
        totalVocabWords++;
        const examples = item.examples || [];
        
        if (examples.length === 0) {
          wordsWithNoExamples++;
        } else {
          totalExamples += examples.length;
          
          const hasGeneric = examples.some(ex => 
            ex.includes('is used in the context of language learning') ||
            ex.includes('helps with communication skills') ||
            ex.includes('in relevant situations') ||
            ex.includes('Understanding') && ex.includes('helps with') ||
            ex.includes('Students practice using') ||
            ex.includes('The word') && ex.includes('is used')
          );

          if (hasGeneric) {
            wordsWithGenericExamples++;
            
            const genericCount = examples.filter(ex => 
              ex.includes('is used in the context of language learning') ||
              ex.includes('helps with communication skills') ||
              ex.includes('in relevant situations') ||
              ex.includes('Understanding') && ex.includes('helps with') ||
              ex.includes('Students practice using') ||
              ex.includes('The word') && ex.includes('is used')
            ).length;
            
            genericExamples += genericCount;
          }
        }
      }
    }
  }

  console.log(`Total conversation lessons analyzed: ${conversationLessons.length}`);
  console.log(`Total vocabulary words: ${totalVocabWords}`);
  console.log(`Words with NO examples: ${wordsWithNoExamples} (${((wordsWithNoExamples/totalVocabWords)*100).toFixed(1)}%)`);
  console.log(`Words with GENERIC examples: ${wordsWithGenericExamples} (${((wordsWithGenericExamples/totalVocabWords)*100).toFixed(1)}%)`);
  console.log(`Total examples: ${totalExamples}`);
  console.log(`Generic examples: ${genericExamples} (${((genericExamples/totalExamples)*100).toFixed(1)}%)`);
  console.log(`Average examples per word: ${(totalExamples/totalVocabWords).toFixed(1)}`);

  console.log('\n' + '=' .repeat(80));
}

diagnoseConversationVocabulary().catch(console.error);
