require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLessonSessionStructure() {
  console.log('🔍 CHECKING LESSON_SESSIONS STRUCTURE\n');
  console.log('='.repeat(80));

  // Get the tutor
  const { data: tutor } = await supabase
    .from('tutors')
    .select('*')
    .eq('email', 'vanshidy@gmail.com')
    .single();

  console.log(`\n✅ Tutor: ${tutor.email} (ID: ${tutor.id})\n`);
  console.log('='.repeat(80));

  // Get ALL lesson_sessions with full details
  const { data: allSessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('tutor_id', tutor.id)
    .order('created_at', { ascending: false });

  console.log(`\n📝 LESSON_SESSIONS: ${allSessions?.length || 0} total records`);
  console.log('-'.repeat(80));

  // Analyze each session in detail
  allSessions?.forEach((session, idx) => {
    console.log(`\n${idx + 1}. Session ID: ${session.id.substring(0, 8)}...`);
    console.log(`   Lesson ID: ${session.lesson_id?.substring(0, 8)}...`);
    console.log(`   Student ID: ${session.student_id?.substring(0, 8)}...`);
    console.log(`   Tutor ID: ${session.tutor_id?.substring(0, 8)}...`);
    console.log(`   Created: ${session.created_at}`);
    console.log(`   Updated: ${session.updated_at}`);
    
    // Check for content field
    if (session.content) {
      console.log(`   ✅ HAS CONTENT: YES`);
      console.log(`   Content type: ${typeof session.content}`);
      if (typeof session.content === 'object') {
        console.log(`   Content keys: ${Object.keys(session.content).join(', ')}`);
        if (session.content.name) {
          console.log(`   Lesson name: ${session.content.name}`);
        }
        if (session.content.sections) {
          console.log(`   Number of sections: ${session.content.sections?.length || 0}`);
        }
      }
    } else {
      console.log(`   ❌ HAS CONTENT: NO`);
    }
    
    // Check all other fields
    const allFields = Object.keys(session);
    console.log(`   All fields: ${allFields.join(', ')}`);
  });

  console.log('\n' + '='.repeat(80));

  // Analyze patterns
  const withContent = allSessions?.filter(s => s.content) || [];
  const withoutContent = allSessions?.filter(s => !s.content) || [];

  console.log(`\n📊 CONTENT ANALYSIS:`);
  console.log(`   Sessions WITH content: ${withContent.length}`);
  console.log(`   Sessions WITHOUT content: ${withoutContent.length}`);

  console.log('\n' + '='.repeat(80));

  // Check the lesson table for comparison
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('tutor_id', tutor.id);

  console.log(`\n📚 LESSONS TABLE COMPARISON:`);
  console.log(`   Total lessons: ${lessons?.length || 0}`);
  
  lessons?.forEach((lesson, idx) => {
    const relatedSessions = allSessions?.filter(s => s.lesson_id === lesson.id) || [];
    console.log(`\n   ${idx + 1}. Lesson ${lesson.id.substring(0, 8)}...`);
    console.log(`      Has interactive_lesson_content: ${lesson.interactive_lesson_content ? 'YES' : 'NO'}`);
    console.log(`      Related sessions: ${relatedSessions.length}`);
    console.log(`      Sessions with content: ${relatedSessions.filter(s => s.content).length}`);
  });

  console.log('\n' + '='.repeat(80));

  // RECOMMENDATION
  console.log(`\n💡 RECOMMENDATION:`);
  console.log('-'.repeat(80));
  
  if (withContent.length > 0) {
    console.log(`\n✅ FOUND RELIABLE INDICATOR: 'content' field`);
    console.log(`   Sessions with content field: ${withContent.length}`);
    console.log(`   This field appears to be populated when a lesson is fully generated.`);
    console.log(`\n   Dashboard should count: lesson_sessions WHERE content IS NOT NULL`);
  } else if (withoutContent.length === allSessions?.length) {
    console.log(`\n⚠️  NO CONTENT FIELD FOUND in any session`);
    console.log(`   All ${allSessions?.length} sessions have NULL content.`);
    console.log(`\n   Possible reasons:`);
    console.log(`   1. Content is stored elsewhere (in lessons table)`);
    console.log(`   2. Content field doesn't exist in schema`);
    console.log(`   3. Lessons were created but content wasn't saved to sessions`);
    console.log(`\n   Dashboard should count: lesson_sessions (all records)`);
    console.log(`   OR filter by: lesson_sessions WHERE lesson_id IN (SELECT id FROM lessons WHERE interactive_lesson_content IS NOT NULL)`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Analysis complete!\n');
}

checkLessonSessionStructure().catch(console.error);
