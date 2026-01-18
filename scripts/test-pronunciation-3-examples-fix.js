const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPronunciation3ExamplesFix() {
  console.log('🧪 TESTING: Pronunciation 3-Examples Fix\n');
  console.log('=' .repeat(80));
  console.log('\nThis test will generate a NEW pronunciation lesson and verify:');
  console.log('  ✅ All vocabulary items have EXACTLY 3 examples');
  console.log('  ✅ No generic fallback sentences are present');
  console.log('  ✅ All examples use the actual vocabulary word\n');
  console.log('=' .repeat(80));

  try {
    // Find a test student (preferably A1 or A2 level to test the fix)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, level, tutor_id')
      .in('level', ['a1', 'a2'])
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No A1/A2 students found for testing');
      return;
    }

    const testStudent = students[0];
    console.log(`\n📝 Test Student: ${testStudent.name} (Level: ${testStudent.level.toUpperCase()})`);
    console.log(`   Student ID: ${testStudent.id}`);
    console.log(`   Tutor ID: ${testStudent.tutor_id}`);

    // Create a test lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        student_id: testStudent.id,
        tutor_id: testStudent.tutor_id,
        date: new Date().toISOString().split('T')[0],
        status: 'scheduled',
        materials: [],
        notes: 'Test lesson for pronunciation 3-examples fix'
      })
      .select()
      .single();

    if (lessonError || !lesson) {
      console.error('❌ Failed to create test lesson:', lessonError);
      return;
    }

    console.log(`\n✅ Test lesson created: ${lesson.id}`);

    // Find a pronunciation sub-topic
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'Pronunciation')
      .eq('is_active', true)
      .limit(1);

    if (templatesError || !templates || templates.length === 0) {
      console.error('❌ No pronunciation templates found');
      return;
    }

    const template = templates[0];
    console.log(`\n🎯 Using template: ${template.name} (${template.level.toUpperCase()})`);

    // Create a test sub-topic
    const testSubTopic = {
      id: 'test-pronunciation-' + Date.now(),
      title: 'Pronunciation: /ɪ/ vs /iː/ Sounds',
      category: 'Pronunciation',
      level: template.level,
      description: 'Practice distinguishing between short /ɪ/ and long /iː/ sounds'
    };

    console.log(`\n🔄 Generating interactive material...`);
    console.log(`   This may take 30-60 seconds...\n`);

    // Call the generate-interactive-material function
    const { data: authData } = await supabase.auth.getSession();
    
    // We need to use the service role to call the function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-interactive-material`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          selected_sub_topic: testSubTopic
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to generate interactive material:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Interactive material generated successfully!\n');
    console.log('=' .repeat(80));

    // Fetch the updated lesson
    const { data: updatedLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('interactive_lesson_content')
      .eq('id', lesson.id)
      .single();

    if (fetchError || !updatedLesson) {
      console.error('❌ Failed to fetch updated lesson:', fetchError);
      return;
    }

    const content = updatedLesson.interactive_lesson_content;

    // Analyze vocabulary sections
    console.log('\n📊 ANALYSIS RESULTS\n');
    console.log('=' .repeat(80));

    const vocabularySections = content.sections.filter(section => 
      section.content_type === 'vocabulary_matching' ||
      section.id?.includes('vocabulary') ||
      section.id?.includes('word_list')
    );

    console.log(`\nFound ${vocabularySections.length} vocabulary sections\n`);

    let totalVocabItems = 0;
    let itemsWith3Examples = 0;
    let itemsWithMoreThan3 = 0;
    let itemsWithLessThan3 = 0;
    let itemsWithFallbacks = 0;
    let itemsWithWordInAllExamples = 0;

    const fallbackPatterns = [
      'requires mutual respect and understanding',
      'healthy relationship requires',
      'important concept in family relationships',
      'Understanding different types of',
      'Every relationship has its own unique'
    ];

    for (const section of vocabularySections) {
      console.log(`\n🔹 Section: ${section.title || section.id}`);
      
      if (section.vocabulary_items && Array.isArray(section.vocabulary_items)) {
        console.log(`   Vocabulary items: ${section.vocabulary_items.length}\n`);

        for (const item of section.vocabulary_items) {
          totalVocabItems++;
          const exampleCount = item.examples ? item.examples.length : 0;

          console.log(`   📖 Word: "${item.word}"`);
          console.log(`      Examples: ${exampleCount}`);

          if (exampleCount === 3) {
            itemsWith3Examples++;
            console.log(`      ✅ CORRECT: Exactly 3 examples`);
          } else if (exampleCount > 3) {
            itemsWithMoreThan3++;
            console.log(`      ⚠️  WARNING: More than 3 examples (${exampleCount})`);
          } else {
            itemsWithLessThan3++;
            console.log(`      ⚠️  WARNING: Less than 3 examples (${exampleCount})`);
          }

          // Check if word appears in all examples
          let wordInAllExamples = true;
          let hasFallback = false;

          if (item.examples) {
            for (let i = 0; i < item.examples.length; i++) {
              const example = item.examples[i];
              const wordInExample = example.toLowerCase().includes(item.word.toLowerCase());
              const isFallback = fallbackPatterns.some(pattern => example.includes(pattern));

              if (!wordInExample) {
                wordInAllExamples = false;
                console.log(`      ❌ Example ${i + 1}: Word NOT found - "${example}"`);
              }

              if (isFallback) {
                hasFallback = true;
                itemsWithFallbacks++;
                console.log(`      🚨 Example ${i + 1}: FALLBACK detected - "${example}"`);
              }
            }

            if (wordInAllExamples) {
              itemsWithWordInAllExamples++;
              console.log(`      ✅ All examples contain the word`);
            }

            if (!hasFallback) {
              console.log(`      ✅ No fallback patterns detected`);
            }
          }

          console.log('');
        }
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('\n📈 SUMMARY\n');
    console.log('=' .repeat(80));
    console.log(`\nTotal Vocabulary Items: ${totalVocabItems}`);
    console.log(`\nExample Count Distribution:`);
    console.log(`  ✅ Exactly 3 examples: ${itemsWith3Examples} (${((itemsWith3Examples/totalVocabItems)*100).toFixed(1)}%)`);
    console.log(`  ⚠️  More than 3: ${itemsWithMoreThan3} (${((itemsWithMoreThan3/totalVocabItems)*100).toFixed(1)}%)`);
    console.log(`  ⚠️  Less than 3: ${itemsWithLessThan3} (${((itemsWithLessThan3/totalVocabItems)*100).toFixed(1)}%)`);
    console.log(`\nQuality Metrics:`);
    console.log(`  ✅ Items with word in ALL examples: ${itemsWithWordInAllExamples} (${((itemsWithWordInAllExamples/totalVocabItems)*100).toFixed(1)}%)`);
    console.log(`  🚨 Items with fallback sentences: ${itemsWithFallbacks} (${((itemsWithFallbacks/totalVocabItems)*100).toFixed(1)}%)`);

    // Test result
    console.log('\n' + '=' .repeat(80));
    console.log('\n🎯 TEST RESULT\n');
    console.log('=' .repeat(80));

    const allHave3Examples = itemsWith3Examples === totalVocabItems;
    const noFallbacks = itemsWithFallbacks === 0;
    const allHaveWord = itemsWithWordInAllExamples === totalVocabItems;

    if (allHave3Examples && noFallbacks && allHaveWord) {
      console.log('\n✅ ✅ ✅ TEST PASSED! ✅ ✅ ✅\n');
      console.log('All vocabulary items have exactly 3 examples,');
      console.log('no fallback sentences detected,');
      console.log('and all examples use the actual vocabulary word.\n');
      console.log('The fix is working correctly! 🎉\n');
    } else {
      console.log('\n⚠️  TEST FAILED\n');
      if (!allHave3Examples) {
        console.log('❌ Not all items have exactly 3 examples');
      }
      if (!noFallbacks) {
        console.log('❌ Fallback sentences detected');
      }
      if (!allHaveWord) {
        console.log('❌ Some examples don\'t contain the vocabulary word');
      }
      console.log('\nThe fix may need adjustment.\n');
    }

    console.log('=' .repeat(80));
    console.log(`\n📝 Test lesson ID: ${lesson.id}`);
    console.log('   You can view this lesson in the app to verify the results.\n');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPronunciation3ExamplesFix();
