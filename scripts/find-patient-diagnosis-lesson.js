const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findPatientDiagnosisLesson() {
  console.log('🔍 SEARCHING FOR LESSON WITH "PATIENT" AND "DIAGNOSIS" VOCABULARY\n');
  console.log('=' .repeat(80));

  // Search all lessons with interactive content
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
    .limit(50);

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    return;
  }

  console.log(`📊 Searching through ${lessons.length} lessons...\n`);

  let found = false;

  for (const lesson of lessons) {
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
        found = true;
        console.log(`✅ FOUND MATCHING LESSON!\n`);
        console.log(`📝 LESSON ID: ${lesson.id}`);
        console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
        console.log(`   Student: ${lesson.student?.name} (Level: ${lesson.student?.level})`);
        console.log(`   Template ID: ${lesson.lesson_template_id || 'None'}`);

        const subTopic = content.selected_sub_topic;
        console.log(`   Sub-topic: ${subTopic?.title || 'Unknown'}`);
        console.log(`   Category: ${subTopic?.category || content.category}`);
        console.log(`   Level: ${subTopic?.level || content.level}`);

        console.log(`\n   📚 VOCABULARY SECTION: ${section.title}`);
        console.log(`       Section ID: ${section.id}`);
        console.log(`       Total vocabulary items: ${vocabItems.length}`);

        console.log(`\n       🔍 ANALYZING VOCABULARY WORDS:\n`);

        for (const item of vocabItems) {
          if (item.word?.toLowerCase() === 'patient' || item.word?.toLowerCase() === 'diagnosis') {
            const examples = item.examples || [];
            
            console.log(`       ━━━ Word: "${item.word}" ━━━`);
            console.log(`           Part of Speech: ${item.part_of_speech || 'N/A'}`);
            console.log(`           Definition: ${item.definition}`);
            console.log(`           Number of examples: ${examples.length}`);

            if (examples.length > 0) {
              console.log(`           Examples:`);
              examples.forEach((ex, idx) => {
                const isGeneric = 
                  ex.includes('is used in the context of language learning') ||
                  ex.includes('helps with communication skills') ||
                  ex.includes('in relevant situations') ||
                  ex.includes('Understanding') && ex.includes('helps with') ||
                  ex.includes('Students practice using') ||
                  ex.includes('The word') && ex.includes('is used');

                const marker = isGeneric ? '⚠️  GENERIC' : '✅ SPECIFIC';
                console.log(`              ${idx + 1}. [${marker}]`);
                console.log(`                 "${ex}"`);
              });
            } else {
              console.log(`           ❌ NO EXAMPLES FOUND`);
            }
            console.log('');
          }
        }

        console.log('\n' + '─'.repeat(80) + '\n');
      }
    }
  }

  if (!found) {
    console.log('❌ No lesson found with both "Patient" and "Diagnosis" vocabulary words');
    console.log('\n🔍 Searching for lessons with either word...\n');

    for (const lesson of lessons.slice(0, 20)) {
      const content = lesson.interactive_lesson_content;
      const sections = content.sections || [];
      
      for (const section of sections) {
        const vocabItems = section.vocabulary_items || [];
        
        const patientWord = vocabItems.find(item => 
          item.word?.toLowerCase() === 'patient'
        );
        const diagnosisWord = vocabItems.find(item => 
          item.word?.toLowerCase() === 'diagnosis'
        );

        if (patientWord || diagnosisWord) {
          console.log(`📝 Lesson ID: ${lesson.id}`);
          console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
          console.log(`   Student: ${lesson.student?.name} (Level: ${lesson.student?.level})`);
          console.log(`   Sub-topic: ${content.selected_sub_topic?.title || 'Unknown'}`);
          
          if (patientWord) {
            console.log(`   ✓ Has "Patient" with ${patientWord.examples?.length || 0} examples`);
          }
          if (diagnosisWord) {
            console.log(`   ✓ Has "Diagnosis" with ${diagnosisWord.examples?.length || 0} examples`);
          }
          console.log('');
        }
      }
    }
  }

  console.log('\n' + '=' .repeat(80));
}

findPatientDiagnosisLesson().catch(console.error);
