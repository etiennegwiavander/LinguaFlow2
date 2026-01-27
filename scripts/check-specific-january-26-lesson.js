const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificLesson() {
  console.log('🔍 CHECKING FOR PATIENT/DIAGNOSIS LESSON GENERATED ON JAN 26, 2026\n');
  console.log('=' .repeat(80));

  // The lesson we found earlier was created Dec 21, 2025
  // But user says they generated it on Jan 26, 2026
  // Let's search for ALL lessons with Patient and Diagnosis vocabulary

  const { data: allLessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      created_at,
      interactive_lesson_content,
      student:students(name, level)
    `)
    .not('interactive_lesson_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    return;
  }

  console.log(`📊 Searching through ${allLessons.length} lessons...\n`);

  const matchingLessons = [];

  for (const lesson of allLessons) {
    const content = lesson.interactive_lesson_content;
    const sections = content.sections || [];
    
    for (const section of sections) {
      const vocabItems = section.vocabulary_items || [];
      
      const hasPatient = vocabItems.some(item => 
        item.word?.toLowerCase() === 'patient'
      );
      const hasDiagnosis = vocabItems.some(item => 
        item.word?.toLowerCase() === 'diagnosis'
      );

      if (hasPatient && hasDiagnosis) {
        matchingLessons.push({
          lesson,
          section,
          vocabItems
        });
      }
    }
  }

  console.log(`✅ Found ${matchingLessons.length} lesson(s) with both Patient and Diagnosis\n`);
  console.log('=' .repeat(80));

  for (const { lesson, section, vocabItems } of matchingLessons) {
    const content = lesson.interactive_lesson_content;
    
    console.log(`\n📝 LESSON ID: ${lesson.id}`);
    console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
    console.log(`   Student: ${lesson.student?.name} (Level: ${lesson.student?.level})`);
    console.log(`   Sub-topic: ${content.selected_sub_topic?.title || 'Unknown'}`);
    console.log(`   Category: ${content.selected_sub_topic?.category || content.category}`);

    console.log(`\n   📚 VOCABULARY ANALYSIS:\n`);

    for (const item of vocabItems) {
      if (item.word?.toLowerCase() === 'patient' || item.word?.toLowerCase() === 'diagnosis') {
        const examples = item.examples || [];
        
        console.log(`   ━━━ Word: "${item.word}" ━━━`);
        console.log(`       Part of Speech: ${item.part_of_speech || 'N/A'}`);
        console.log(`       Definition: ${item.definition}`);
        console.log(`       Number of examples: ${examples.length}`);

        if (examples.length > 0) {
          console.log(`       Examples:`);
          examples.forEach((ex, idx) => {
            const isFallback = 
              ex.includes('is used in the context of language learning') ||
              ex.includes('helps with communication skills') ||
              ex.includes('in relevant situations') ||
              ex.includes('Understanding') && ex.includes('helps with') ||
              ex.includes('Students practice using') ||
              ex.includes('The word') && ex.includes('is used') ||
              ex.includes('requires mutual respect and understanding') ||
              ex.includes('ed successfully after years of practice') ||
              ex.includes('is an important concept in family relationships');

            const marker = isFallback ? '🚨 FALLBACK/GENERIC' : '✅ SPECIFIC';
            console.log(`          ${idx + 1}. [${marker}]`);
            console.log(`             "${ex}"`);
          });
        } else {
          console.log(`       ❌ NO EXAMPLES FOUND`);
        }
        console.log('');
      }
    }

    console.log('\n' + '─'.repeat(80));
  }

  console.log('\n\n📊 SUMMARY\n');
  console.log('=' .repeat(80));
  
  if (matchingLessons.length === 0) {
    console.log('❌ No lessons found with both "Patient" and "Diagnosis" vocabulary');
  } else {
    console.log(`Found ${matchingLessons.length} lesson(s) with Patient and Diagnosis`);
    console.log('\nIf you see FALLBACK/GENERIC markers above, those are the problematic sentences.');
    console.log('The fallback code is in lines 778-863 of generate-interactive-material/index.ts');
    console.log('\nThe function generateContextualExamples() is defined but should NOT be called.');
    console.log('If it IS being called, there may be an older version deployed to Supabase.');
  }
  
  console.log('\n' + '=' .repeat(80));
}

checkSpecificLesson().catch(console.error);
