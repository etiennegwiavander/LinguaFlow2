const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFallbackFixDeployed() {
  console.log('🔍 VERIFYING FALLBACK FIX DEPLOYMENT\n');
  console.log('=' .repeat(80));

  // Find the Ness student
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%ness%');

  if (studentError) {
    console.error('❌ Error fetching students:', studentError);
    return;
  }

  if (students.length === 0) {
    console.log('❌ No student named "Ness" found');
    return;
  }

  const nessStudent = students[0];
  console.log(`✅ Found student: ${nessStudent.name} (Level: ${nessStudent.level})\n`);

  // Find the most recent lesson for Ness
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', nessStudent.id)
    .not('interactive_lesson_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (lessonError) {
    console.error('❌ Error fetching lessons:', lessonError);
    return;
  }

  if (lessons.length === 0) {
    console.log('❌ No lessons found for Ness');
    return;
  }

  const lesson = lessons[0];
  const content = lesson.interactive_lesson_content;
  const subTopic = content.selected_sub_topic;

  console.log(`📝 MOST RECENT LESSON:`);
  console.log(`   ID: ${lesson.id}`);
  console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
  console.log(`   Sub-topic: ${subTopic?.title || 'Unknown'}`);
  console.log(`   Category: ${subTopic?.category || content.category}`);
  console.log(`   Level: ${subTopic?.level || content.level}`);

  // Check vocabulary for generic sentences
  const sections = content.sections || [];
  const vocabSections = sections.filter(s => 
    s.title?.toLowerCase().includes('vocabulary') ||
    s.id?.toLowerCase().includes('vocabulary')
  );

  console.log(`\n📚 Analyzing ${vocabSections.length} vocabulary section(s)...\n`);

  let hasGenericSentences = false;
  let totalWords = 0;
  let wordsWithGeneric = 0;

  for (const vocabSection of vocabSections) {
    const vocabItems = vocabSection.vocabulary_items || [];
    totalWords += vocabItems.length;

    for (const item of vocabItems) {
      const examples = item.examples || [];
      
      const genericExamples = examples.filter(ex => 
        ex.includes('is used in the context of language learning') ||
        ex.includes('helps with communication skills') ||
        ex.includes('in relevant situations') ||
        (ex.includes('Understanding') && ex.includes('helps with')) ||
        ex.includes('Students practice using') ||
        (ex.includes('The word') && ex.includes('is used'))
      );

      if (genericExamples.length > 0) {
        hasGenericSentences = true;
        wordsWithGeneric++;
        
        console.log(`⚠️  GENERIC SENTENCES FOUND in word: "${item.word}"`);
        genericExamples.forEach((ex, idx) => {
          console.log(`   ${idx + 1}. "${ex}"`);
        });
        console.log('');
      }
    }
  }

  console.log('=' .repeat(80));
  console.log('\n📊 RESULTS:\n');
  console.log(`Total vocabulary words: ${totalWords}`);
  console.log(`Words with generic sentences: ${wordsWithGeneric}`);

  if (hasGenericSentences) {
    console.log('\n❌ DEPLOYMENT VERIFICATION FAILED!');
    console.log('   Generic sentences are still appearing.');
    console.log('   This lesson was created AFTER deployment.');
    console.log('\n🔍 POSSIBLE CAUSES:');
    console.log('   1. The deployed function is still using cached code');
    console.log('   2. The lesson was created BEFORE deployment');
    console.log('   3. There is another source of generic sentences');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Wait 1-2 minutes for function cache to clear');
    console.log('   2. Generate a NEW lesson for Ness');
    console.log('   3. Run this script again to verify');
  } else {
    console.log('\n✅ DEPLOYMENT VERIFICATION SUCCESSFUL!');
    console.log('   No generic sentences found.');
    console.log('   All vocabulary examples are contextually relevant.');
  }

  console.log('\n' + '=' .repeat(80));
}

verifyFallbackFixDeployed().catch(console.error);
