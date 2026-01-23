const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepAnalyzeVocabularyFallback() {
  console.log('🔬 Deep Analysis: Why First 3 Examples Are AI, Rest Are Fallback\n');
  console.log('='.repeat(70));

  try {
    // Get a recent lesson with vocabulary
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, interactive_lesson_content, lesson_template_id, student:students(name, level)')
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !lessons || lessons.length === 0) {
      console.error('❌ Error fetching lessons:', error);
      return;
    }

    console.log(`✅ Found ${lessons.length} recent lessons\n`);

    for (const lesson of lessons) {
      const content = typeof lesson.interactive_lesson_content === 'string'
        ? JSON.parse(lesson.interactive_lesson_content)
        : lesson.interactive_lesson_content;

      const sections = content.sections || [];
      const studentLevel = lesson.student?.level || 'unknown';

      // Find vocabulary sections
      const vocabSections = sections.filter(s => 
        s.vocabulary_items && s.vocabulary_items.length > 0
      );

      if (vocabSections.length === 0) continue;

      console.log('-'.repeat(70));
      console.log(`\n📋 Lesson: ${lesson.id}`);
      console.log(`   Student: ${lesson.student?.name} (Level: ${studentLevel})`);
      console.log(`   Template: ${content.category || 'Unknown'}`);

      vocabSections.forEach((section, sectionIndex) => {
        console.log(`\n   📝 Section ${sectionIndex + 1}: ${section.title}`);
        console.log(`      Vocabulary items: ${section.vocabulary_items.length}`);

        section.vocabulary_items.forEach((item, itemIndex) => {
          const examples = item.examples || [];
          console.log(`\n      Word ${itemIndex + 1}: "${item.word}"`);
          console.log(`         Part of speech: ${item.part_of_speech}`);
          console.log(`         Total examples: ${examples.length}`);

          // Analyze each example
          examples.forEach((example, exIndex) => {
            const exampleLower = example.toLowerCase();
            
            // Check for fallback patterns
            const fallbackPatterns = [
              { pattern: 'the word is an important concept', name: 'Generic noun pattern 1' },
              { pattern: 'understanding different types of word', name: 'Generic noun pattern 2' },
              { pattern: 'every word has its own unique', name: 'Generic noun pattern 3' },
              { pattern: 'a healthy word requires', name: 'Generic noun pattern 4' },
              { pattern: 'many people word to strengthen', name: 'Generic verb pattern 1' },
              { pattern: 'she words naturally', name: 'Generic verb pattern 2' },
              { pattern: 'we should word with respect', name: 'Generic verb pattern 3' },
              { pattern: 'they worded successfully', name: 'Generic verb pattern 4' },
              { pattern: 'the concept of "word" is important', name: 'Generic fallback 1' },
              { pattern: 'understanding "word" helps improve', name: 'Generic fallback 2' },
              { pattern: 'people often discuss "word"', name: 'Generic fallback 3' },
              { pattern: 'learning about "word" enhances', name: 'Generic fallback 4' }
            ];

            let isFallback = false;
            let matchedPattern = null;

            for (const { pattern, name } of fallbackPatterns) {
              if (exampleLower.includes(pattern.replace('word', item.word.toLowerCase()))) {
                isFallback = true;
                matchedPattern = name;
                break;
              }
            }

            // Also check if it's using the generic template structure
            if (!isFallback) {
              // Check for template-like structure
              const hasWordPlaceholder = exampleLower.includes(`the ${item.word.toLowerCase()} is`) ||
                                        exampleLower.includes(`${item.word.toLowerCase()} helps`) ||
                                        exampleLower.includes(`every ${item.word.toLowerCase()}`);
              
              if (hasWordPlaceholder && example.length < 80) {
                isFallback = true;
                matchedPattern = 'Template structure';
              }
            }

            const marker = isFallback ? '⚠️  FALLBACK' : '✅ AI';
            const patternInfo = matchedPattern ? ` [${matchedPattern}]` : '';
            
            console.log(`         ${exIndex + 1}. ${marker}${patternInfo}: "${example.substring(0, 70)}${example.length > 70 ? '...' : ''}"`);
          });

          // Analyze the pattern
          const aiCount = examples.filter((ex, i) => {
            const exLower = ex.toLowerCase();
            return !exLower.includes('the word is') && 
                   !exLower.includes('understanding different types of word') &&
                   !exLower.includes('every word has') &&
                   !exLower.includes('a healthy word') &&
                   !exLower.includes('the concept of "word"') &&
                   ex.length > 30;
          }).length;

          const fallbackCount = examples.length - aiCount;

          console.log(`\n         📊 Analysis: ${aiCount} AI-generated, ${fallbackCount} fallback`);

          if (aiCount === 3 && fallbackCount > 0) {
            console.log(`         🎯 PATTERN DETECTED: First 3 are AI, rest are fallback!`);
            console.log(`         🔍 This suggests AI generated exactly 3 examples, then fallback added more`);
          }
        });
      });
    }

    // Now let's understand WHY this happens
    console.log('\n\n' + '='.repeat(70));
    console.log('\n🔍 ROOT CAUSE ANALYSIS\n');
    console.log('Based on the code in validateAndEnsureExamples():');
    console.log('');
    console.log('1. AI generates vocabulary items with examples');
    console.log('2. For non-pronunciation lessons:');
    console.log('   - A1/A2 levels: targetCount = 5 examples');
    console.log('   - B1/B2 levels: targetCount = 4 examples');
    console.log('   - C1/C2 levels: targetCount = 3 examples');
    console.log('');
    console.log('3. If AI generates fewer examples than targetCount:');
    console.log('   - Function calls generateContextualExamples()');
    console.log('   - Adds generic fallback examples to reach targetCount');
    console.log('');
    console.log('4. THE PROBLEM:');
    console.log('   - AI is generating exactly 3 examples per word');
    console.log('   - But for A1/A2, targetCount is 5');
    console.log('   - But for B1/B2, targetCount is 4');
    console.log('   - So fallback adds 2 more (A1/A2) or 1 more (B1/B2)');
    console.log('');
    console.log('5. WHY AI GENERATES ONLY 3:');
    console.log('   - Check the AI prompt instructions');
    console.log('   - Likely the prompt is not clear about level-based counts');
    console.log('   - Or AI is defaulting to 3 examples (C1/C2 level)');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Analysis complete!\n');
}

deepAnalyzeVocabularyFallback();
