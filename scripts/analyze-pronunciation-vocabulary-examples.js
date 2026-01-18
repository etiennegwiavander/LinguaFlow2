const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzePronunciationVocabularyExamples() {
  console.log('🔍 DEEP ANALYSIS: Pronunciation Lesson Vocabulary Examples\n');
  console.log('=' .repeat(80));

  try {
    // Fetch recent pronunciation lessons
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        id,
        date,
        interactive_lesson_content,
        student:students(name, level),
        template:lesson_templates(name, category, level)
      `)
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching lessons:', error);
      return;
    }

    console.log(`\n📊 Found ${lessons.length} lessons with interactive content\n`);

    // Filter for pronunciation lessons
    const pronunciationLessons = lessons.filter(lesson => 
      lesson.template?.category === 'Pronunciation' ||
      lesson.interactive_lesson_content?.category === 'Pronunciation'
    );

    console.log(`🎯 Found ${pronunciationLessons.length} Pronunciation lessons\n`);
    console.log('=' .repeat(80));

    if (pronunciationLessons.length === 0) {
      console.log('\n⚠️  No pronunciation lessons found. Checking all lessons for vocabulary sections...\n');
    }

    // Analyze each pronunciation lesson
    for (const lesson of pronunciationLessons.slice(0, 5)) {
      console.log(`\n\n📝 LESSON ANALYSIS`);
      console.log(`   Lesson ID: ${lesson.id}`);
      console.log(`   Date: ${lesson.date}`);
      console.log(`   Student: ${lesson.student?.name} (${lesson.student?.level})`);
      console.log(`   Template: ${lesson.template?.name || 'Unknown'}`);
      console.log(`   Category: ${lesson.template?.category || 'Unknown'}`);
      console.log('-'.repeat(80));

      const content = lesson.interactive_lesson_content;

      if (!content || !content.sections) {
        console.log('   ⚠️  No sections found in interactive content');
        continue;
      }

      // Find vocabulary sections
      const vocabularySections = content.sections.filter(section => 
        section.content_type === 'vocabulary_matching' ||
        section.id?.includes('vocabulary') ||
        section.id?.includes('word_list')
      );

      console.log(`\n   📚 Found ${vocabularySections.length} vocabulary sections\n`);

      for (const section of vocabularySections) {
        console.log(`   🔹 Section: ${section.title || section.id}`);
        console.log(`      ID: ${section.id}`);
        console.log(`      Content Type: ${section.content_type}`);
        console.log(`      Has vocabulary_items: ${!!section.vocabulary_items}`);

        if (section.vocabulary_items && Array.isArray(section.vocabulary_items)) {
          console.log(`      Number of vocabulary items: ${section.vocabulary_items.length}\n`);

          // Analyze each vocabulary item
          for (let i = 0; i < Math.min(3, section.vocabulary_items.length); i++) {
            const item = section.vocabulary_items[i];
            console.log(`      📖 Word ${i + 1}: "${item.word}"`);
            console.log(`         Definition: ${item.meaning || item.definition || 'N/A'}`);
            console.log(`         Pronunciation: ${item.pronunciation || 'N/A'}`);
            console.log(`         Part of Speech: ${item.part_of_speech || 'N/A'}`);
            
            if (item.examples && Array.isArray(item.examples)) {
              console.log(`         Number of examples: ${item.examples.length}`);
              console.log(`         Examples:`);
              
              item.examples.forEach((example, idx) => {
                console.log(`            ${idx + 1}. "${example}"`);
                
                // Check if example uses the actual word
                const wordInExample = example.toLowerCase().includes(item.word.toLowerCase());
                const isGeneric = example.includes('requires mutual respect') || 
                                 example.includes('healthy') && example.includes('requires');
                
                if (!wordInExample) {
                  console.log(`               ⚠️  WARNING: Word "${item.word}" NOT found in example!`);
                }
                if (isGeneric) {
                  console.log(`               🚨 ALERT: Generic fallback sentence detected!`);
                }
              });
            } else {
              console.log(`         ❌ NO EXAMPLES FOUND!`);
            }
            console.log('');
          }

          if (section.vocabulary_items.length > 3) {
            console.log(`      ... and ${section.vocabulary_items.length - 3} more vocabulary items\n`);
          }
        } else {
          console.log(`      ❌ No vocabulary_items array found in this section\n`);
        }
      }

      // Check for fallback patterns
      console.log(`\n   🔍 FALLBACK PATTERN DETECTION:`);
      const allExamples = [];
      
      vocabularySections.forEach(section => {
        if (section.vocabulary_items) {
          section.vocabulary_items.forEach(item => {
            if (item.examples) {
              allExamples.push(...item.examples);
            }
          });
        }
      });

      const fallbackPatterns = [
        'requires mutual respect and understanding',
        'healthy relationship requires',
        'important concept in family relationships',
        'Understanding different types of',
        'Every relationship has its own unique'
      ];

      const detectedFallbacks = allExamples.filter(example => 
        fallbackPatterns.some(pattern => example.includes(pattern))
      );

      if (detectedFallbacks.length > 0) {
        console.log(`      🚨 FOUND ${detectedFallbacks.length} FALLBACK SENTENCES:`);
        detectedFallbacks.forEach((fb, idx) => {
          console.log(`         ${idx + 1}. "${fb}"`);
        });
      } else {
        console.log(`      ✅ No obvious fallback patterns detected`);
      }

      console.log('\n' + '='.repeat(80));
    }

    // Summary statistics
    console.log(`\n\n📊 SUMMARY STATISTICS\n`);
    console.log('='.repeat(80));

    let totalVocabItems = 0;
    let itemsWithExamples = 0;
    let itemsWithoutExamples = 0;
    let totalExamples = 0;
    let examplesWithWord = 0;
    let examplesWithoutWord = 0;
    let fallbackExamples = 0;

    const fallbackPatterns = [
      'requires mutual respect and understanding',
      'healthy relationship requires',
      'important concept in family relationships',
      'Understanding different types of',
      'Every relationship has its own unique'
    ];

    pronunciationLessons.forEach(lesson => {
      const content = lesson.interactive_lesson_content;
      if (!content || !content.sections) return;

      const vocabularySections = content.sections.filter(section => 
        section.content_type === 'vocabulary_matching' ||
        section.id?.includes('vocabulary') ||
        section.id?.includes('word_list')
      );

      vocabularySections.forEach(section => {
        if (section.vocabulary_items && Array.isArray(section.vocabulary_items)) {
          section.vocabulary_items.forEach(item => {
            totalVocabItems++;

            if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
              itemsWithExamples++;
              totalExamples += item.examples.length;

              item.examples.forEach(example => {
                const wordInExample = example.toLowerCase().includes(item.word.toLowerCase());
                if (wordInExample) {
                  examplesWithWord++;
                } else {
                  examplesWithoutWord++;
                }

                const isFallback = fallbackPatterns.some(pattern => example.includes(pattern));
                if (isFallback) {
                  fallbackExamples++;
                }
              });
            } else {
              itemsWithoutExamples++;
            }
          });
        }
      });
    });

    console.log(`Total Vocabulary Items Analyzed: ${totalVocabItems}`);
    console.log(`Items WITH Examples: ${itemsWithExamples} (${((itemsWithExamples/totalVocabItems)*100).toFixed(1)}%)`);
    console.log(`Items WITHOUT Examples: ${itemsWithoutExamples} (${((itemsWithoutExamples/totalVocabItems)*100).toFixed(1)}%)`);
    console.log(`\nTotal Example Sentences: ${totalExamples}`);
    console.log(`Examples containing the word: ${examplesWithWord} (${((examplesWithWord/totalExamples)*100).toFixed(1)}%)`);
    console.log(`Examples NOT containing the word: ${examplesWithoutWord} (${((examplesWithoutWord/totalExamples)*100).toFixed(1)}%)`);
    console.log(`Fallback/Generic Examples: ${fallbackExamples} (${((fallbackExamples/totalExamples)*100).toFixed(1)}%)`);

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

analyzePronunciationVocabularyExamples();
