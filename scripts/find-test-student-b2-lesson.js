const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findTestStudentLesson() {
  console.log('🔍 Finding student "test" and their B2 English for Kids lesson...\n');

  // First, find the student named "test"
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name, target_language, native_language')
    .ilike('name', '%test%');

  if (studentError) {
    console.error('❌ Error finding student:', studentError);
    return;
  }

  console.log(`Found ${students.length} students with "test" in name:\n`);
  students.forEach(s => {
    console.log(`- ${s.name} (ID: ${s.id})`);
    console.log(`  Target: ${s.target_language}, Native: ${s.native_language}`);
  });

  // Find the one learning French
  const testStudent = students.find(s => 
    s.target_language === 'fr' || s.target_language === 'French'
  );

  if (!testStudent) {
    console.log('\n⚠️ No student named "test" learning French found');
    return;
  }

  console.log(`\n✅ Found student: ${testStudent.name} (${testStudent.id})`);
  console.log(`   Learning: ${testStudent.target_language}\n`);

  // Now find their lessons
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('id, created_at, interactive_lesson_content')
    .eq('student_id', testStudent.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (lessonError) {
    console.error('❌ Error finding lessons:', lessonError);
    return;
  }

  console.log(`Found ${lessons.length} recent lessons for ${testStudent.name}\n`);

  for (const lesson of lessons) {
    const content = lesson.interactive_lesson_content;
    
    if (!content) continue;

    const name = content.name || 'Unknown';
    const category = content.category || 'Unknown';
    const level = content.level || 'Unknown';

    console.log(`Lesson ${lesson.id}:`);
    console.log(`  - Name: ${name}`);
    console.log(`  - Category: ${category}`);
    console.log(`  - Level: ${level}`);
    console.log(`  - Created: ${new Date(lesson.created_at).toLocaleString()}`);

    if (name.includes('Kids') || name.includes('English for Kids')) {
      console.log(`  ✅ This is a Kids lesson!`);
      
      if (level === 'b2') {
        console.log(`  🎯 FOUND B2 KIDS LESSON!\n`);
        
        // Check the two sections
        const sections = content.sections || [];
        const warmUp = sections.find(s => s.id === 'warm_up_engagement');
        const pronunciation = sections.find(s => s.id === 'pronunciation_listening_practice');

        console.log('=' .repeat(80));
        console.log('WARM-UP/ENGAGEMENT SECTION:');
        console.log('='.repeat(80));
        if (warmUp) {
          console.log('Content Type:', warmUp.content_type);
          console.log('AI Placeholder:', warmUp.ai_placeholder);
          console.log('\nFields present:', Object.keys(warmUp).join(', '));
          
          if (warmUp.items) {
            console.log('\n📋 Items:', JSON.stringify(warmUp.items, null, 2));
          }
          if (warmUp.warm_up_questions) {
            console.log('\n🤖 warm_up_questions:', JSON.stringify(warmUp.warm_up_questions, null, 2));
          }
          if (warmUp.warm_up_engagement) {
            console.log('\n📝 warm_up_engagement:', warmUp.warm_up_engagement);
          }
        } else {
          console.log('❌ Section not found');
        }

        console.log('\n' + '='.repeat(80));
        console.log('PRONUNCIATION/LISTENING PRACTICE SECTION:');
        console.log('='.repeat(80));
        if (pronunciation) {
          console.log('Content Type:', pronunciation.content_type);
          console.log('AI Placeholder:', pronunciation.ai_placeholder);
          console.log('\nFields present:', Object.keys(pronunciation).join(', '));
          
          if (pronunciation.items) {
            console.log('\n📋 Items:', JSON.stringify(pronunciation.items, null, 2));
          }
          if (pronunciation.moral_story_content) {
            console.log('\n🤖 moral_story_content:', JSON.stringify(pronunciation.moral_story_content, null, 2));
          }
          if (pronunciation.pronunciation_listening_content) {
            const content = pronunciation.pronunciation_listening_content;
            if (typeof content === 'string') {
              console.log('\n📝 pronunciation_listening_content (string):', content.substring(0, 300) + '...');
            } else {
              console.log('\n📝 pronunciation_listening_content (object):', JSON.stringify(content, null, 2));
            }
          }
        } else {
          console.log('❌ Section not found');
        }

        console.log('\n' + '='.repeat(80));
        return lesson.id;
      }
    }
    console.log('');
  }

  console.log('⚠️ No B2 English for Kids lesson found');
}

findTestStudentLesson().catch(console.error);
