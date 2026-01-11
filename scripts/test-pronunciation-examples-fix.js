/**
 * Test Script: Pronunciation Vocabulary Examples Enhancement
 * 
 * This script verifies that the enhanced AI prompt generates
 * exactly 3 contextual example sentences for vocabulary words
 * in Pronunciation templates.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPronunciationExamples() {
  console.log('🧪 Testing Pronunciation Vocabulary Examples Enhancement\n');

  try {
    // Step 1: Find a test student with A2, B1, or B2 level
    console.log('📋 Step 1: Finding test student...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('level', ['a2', 'b1', 'b2'])
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No suitable test student found');
      console.log('💡 Create a student with A2, B1, or B2 level first');
      return;
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.name} (${student.level.toUpperCase()})\n`);

    // Step 2: Find a recent Pronunciation lesson
    console.log('📋 Step 2: Finding recent Pronunciation lesson...');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*, lesson_templates(*)')
      .eq('student_id', student.id)
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    // Find a Pronunciation lesson
    const pronunciationLesson = lessons?.find(lesson => 
      lesson.lesson_templates?.category === 'Pronunciation'
    );

    if (!pronunciationLesson) {
      console.log('⚠️  No existing Pronunciation lesson found');
      console.log('💡 Generate a new Pronunciation lesson to test the fix\n');
      console.log('📝 Steps to test:');
      console.log('   1. Go to the student profile in the app');
      console.log('   2. Create a new lesson');
      console.log('   3. Select a Pronunciation template (A2, B1, or B2)');
      console.log('   4. Generate the lesson');
      console.log('   5. Check the vocabulary sections\n');
      return;
    }

    console.log(`✅ Found Pronunciation lesson: ${pronunciationLesson.id}\n`);

    // Step 3: Analyze vocabulary sections
    console.log('📋 Step 3: Analyzing vocabulary sections...\n');
    const content = pronunciationLesson.interactive_lesson_content;
    
    if (!content || !content.sections) {
      console.log('⚠️  Lesson has no sections');
      return;
    }

    let vocabularyMatchingSections = 0;
    let totalVocabularyItems = 0;
    let itemsWithExamples = 0;
    let itemsWith3Examples = 0;
    let itemsWithContextualExamples = 0;
    let issuesFound = [];

    // Find all vocabulary_matching sections
    content.sections.forEach((section, sectionIndex) => {
      if (section.content_type === 'vocabulary_matching' && section.vocabulary_items) {
        vocabularyMatchingSections++;
        console.log(`📚 Section ${sectionIndex + 1}: ${section.title || 'Vocabulary'}`);
        
        section.vocabulary_items.forEach((item, itemIndex) => {
          totalVocabularyItems++;
          const word = item.word || 'unknown';
          const examples = item.examples || [];
          
          console.log(`   ${itemIndex + 1}. Word: "${word}"`);
          console.log(`      Pronunciation: ${item.pronunciation || 'N/A'}`);
          console.log(`      Meaning: ${item.meaning || 'N/A'}`);
          console.log(`      Examples: ${examples.length}`);

          // Check if has examples
          if (examples.length > 0) {
            itemsWithExamples++;
          } else {
            issuesFound.push(`❌ "${word}" has NO examples`);
          }

          // Check if has exactly 3 examples
          if (examples.length === 3) {
            itemsWith3Examples++;
            console.log(`      ✅ Has exactly 3 examples`);
          } else if (examples.length > 0) {
            issuesFound.push(`⚠️  "${word}" has ${examples.length} examples (expected 3)`);
            console.log(`      ⚠️  Has ${examples.length} examples (expected 3)`);
          }

          // Check if examples are contextual (use the actual word)
          let contextualCount = 0;
          examples.forEach((example, exIndex) => {
            const exampleLower = example.toLowerCase();
            const wordLower = word.toLowerCase();
            
            // Check if the example uses the actual word
            if (exampleLower.includes(wordLower)) {
              contextualCount++;
            } else {
              issuesFound.push(`❌ Example ${exIndex + 1} for "${word}" doesn't use the word: "${example}"`);
            }

            console.log(`         ${exIndex + 1}. "${example}"`);
          });

          if (contextualCount === examples.length && examples.length > 0) {
            itemsWithContextualExamples++;
            console.log(`      ✅ All examples are contextual`);
          } else if (examples.length > 0) {
            console.log(`      ⚠️  Only ${contextualCount}/${examples.length} examples are contextual`);
          }

          console.log('');
        });
      }
    });

    // Step 4: Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60) + '\n');

    console.log(`Lesson ID: ${pronunciationLesson.id}`);
    console.log(`Student: ${student.name} (${student.level.toUpperCase()})`);
    console.log(`Template: ${pronunciationLesson.lesson_templates?.name || 'Unknown'}\n`);

    console.log('📈 Statistics:');
    console.log(`   • Vocabulary Matching Sections: ${vocabularyMatchingSections}`);
    console.log(`   • Total Vocabulary Items: ${totalVocabularyItems}`);
    console.log(`   • Items with Examples: ${itemsWithExamples}/${totalVocabularyItems}`);
    console.log(`   • Items with Exactly 3 Examples: ${itemsWith3Examples}/${totalVocabularyItems}`);
    console.log(`   • Items with Contextual Examples: ${itemsWithContextualExamples}/${totalVocabularyItems}\n`);

    // Calculate success rate
    const examplesRate = totalVocabularyItems > 0 
      ? ((itemsWithExamples / totalVocabularyItems) * 100).toFixed(1)
      : 0;
    const threeExamplesRate = totalVocabularyItems > 0
      ? ((itemsWith3Examples / totalVocabularyItems) * 100).toFixed(1)
      : 0;
    const contextualRate = totalVocabularyItems > 0
      ? ((itemsWithContextualExamples / totalVocabularyItems) * 100).toFixed(1)
      : 0;

    console.log('✅ Success Rates:');
    console.log(`   • Has Examples: ${examplesRate}%`);
    console.log(`   • Has 3 Examples: ${threeExamplesRate}%`);
    console.log(`   • Contextual Examples: ${contextualRate}%\n`);

    // Overall assessment
    if (itemsWith3Examples === totalVocabularyItems && 
        itemsWithContextualExamples === totalVocabularyItems &&
        totalVocabularyItems > 0) {
      console.log('🎉 PERFECT! All vocabulary items have exactly 3 contextual examples!');
      console.log('✅ The enhancement is working as expected.\n');
    } else if (itemsWithExamples === totalVocabularyItems && totalVocabularyItems > 0) {
      console.log('⚠️  PARTIAL SUCCESS: All items have examples, but some issues found:');
      issuesFound.forEach(issue => console.log(`   ${issue}`));
      console.log('\n💡 The enhancement may need adjustment or this is an old lesson.\n');
    } else {
      console.log('❌ ISSUES DETECTED:');
      issuesFound.forEach(issue => console.log(`   ${issue}`));
      console.log('\n💡 Generate a NEW Pronunciation lesson to test the latest fix.\n');
    }

    // Recommendations
    console.log('📝 Recommendations:');
    if (itemsWith3Examples < totalVocabularyItems) {
      console.log('   • Generate a new Pronunciation lesson to test the latest enhancement');
    }
    if (itemsWithContextualExamples < totalVocabularyItems) {
      console.log('   • Check that examples use the actual vocabulary word');
    }
    if (vocabularyMatchingSections === 0) {
      console.log('   • This lesson may not have vocabulary_matching sections');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testPronunciationExamples();
