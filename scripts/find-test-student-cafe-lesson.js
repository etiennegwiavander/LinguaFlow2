const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findTestStudentCafeLesson() {
  console.log('🔍 SEARCHING FOR "TEST" STUDENT CAFÉ LESSON\n');
  console.log('=' .repeat(80));

  // Find student named "test"
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    .ilike('name', '%test%');

  if (studentError) {
    console.error('❌ Error fetching students:', studentError);
    return;
  }

  console.log(`📊 Found ${students.length} student(s) with "test" in name:\n`);
  students.forEach(s => console.log(`   - ${s.name} (ID: ${s.id}, Level: ${s.level})`));

  if (students.length === 0) {
    console.log('\n❌ No students found with "test" in name');
    return;
  }

  const testStudent = students[0];
  console.log(`\n✅ Using student: ${testStudent.name} (${testStudent.level})\n`);
  console.log('=' .repeat(80));

  // Find recent lessons for this student
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', testStudent.id)
    .not('interactive_lesson_content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (lessonError) {
    console.error('❌ Error fetching lessons:', lessonError);
    return;
  }

  console.log(`\n📚 Found ${lessons.length} lesson(s) with interactive content\n`);

  for (const lesson of lessons) {
    const content = lesson.interactive_lesson_content;
    const subTopic = content.selected_sub_topic;
    
    console.log(`\n📝 LESSON ID: ${lesson.id}`);
    console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
    console.log(`   Sub-topic: ${subTopic?.title || 'Unknown'}`);
    console.log(`   Category: ${subTopic?.category || content.category}`);
    console.log(`   Level: ${subTopic?.level || content.level}`);

    // Check if this is the café lesson
    const isCafeLesson = subTopic?.title?.toLowerCase().includes('café') || 
                         subTopic?.title?.toLowerCase().includes('cafe');

    if (isCafeLesson) {
      console.log(`\n   🎯 THIS IS THE CAFÉ LESSON!\n`);
      
      const sections = content.sections || [];
      const vocabSections = sections.filter(s => 
        s.title?.toLowerCase().includes('vocabulary') ||
        s.id?.toLowerCase().includes('vocabulary')
      );

      console.log(`   📚 Found ${vocabSections.length} vocabulary section(s)\n`);

      for (const vocabSection of vocabSections) {
        console.log(`   ━━━ VOCABULARY SECTION: ${vocabSection.title} ━━━`);
        
        const vocabItems = vocabSection.vocabulary_items || [];
        console.log(`       Total vocabulary items: ${vocabItems.length}\n`);

        for (const item of vocabItems) {
          const examples = item.examples || [];
          
          console.log(`       Word: "${item.word}"`);
          console.log(`       Part of Speech: ${item.part_of_speech || 'N/A'}`);
          console.log(`       Number of examples: ${examples.length}`);

          if (examples.length > 0) {
            console.log(`       Examples:`);
            examples.forEach((ex, idx) => {
              const isGeneric = 
                ex.includes('is used in the context of language learning') ||
                ex.includes('helps with communication skills') ||
                ex.includes('in relevant situations') ||
                ex.includes('Understanding') && ex.includes('helps with') ||
                ex.includes('Students practice using') ||
                ex.includes('The word') && ex.includes('is used');

              const marker = isGeneric ? '🚨 GENERIC FALLBACK' : '✅ SPECIFIC';
              console.log(`          ${idx + 1}. [${marker}]`);
              console.log(`             "${ex}"`);
            });
          }
          console.log('');
        }
      }

      console.log('\n   🔍 CHECKING AI GENERATION DETAILS:\n');
      console.log(`   Template ID: ${lesson.lesson_template_id || 'None'}`);
      console.log(`   Created at: ${lesson.created_at}`);
      console.log(`   Updated at: ${lesson.updated_at || 'N/A'}`);
      
      console.log('\n' + '─'.repeat(80));
    }
  }

  console.log('\n\n' + '=' .repeat(80));
  console.log('\n🎯 ANALYSIS:\n');
  console.log('The generic sentences you see are:');
  console.log('1. "The word [X] is used in the context of language learning."');
  console.log('2. "Understanding [X] helps with communication skills."');
  console.log('3. "Students practice using [X] in relevant situations."\n');
  console.log('These are coming from the BASIC FALLBACK PROMPT (lines 600-700)');
  console.log('NOT from the template-based prompt.\n');
  console.log('This means the AI is using the FALLBACK prompt instead of the template prompt!');
  console.log('\n' + '=' .repeat(80));
}

findTestStudentCafeLesson().catch(console.error);
