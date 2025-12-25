/**
 * Diagnose why completion status disappears after refresh
 * Check the exact student and lesson you're testing with
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseCompletionCheck() {
  console.log('🔍 Diagnosing completion check issue...\n');

  // Get the lesson with the two recent sessions
  const lessonId = 'cb2b5b55-b697-4bc5-adb6-87e18e825ce8';
  
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (!lesson) {
    console.log('Lesson not found');
    return;
  }

  console.log(`📝 Lesson: ${lesson.id.substring(0, 8)}...`);
  console.log(`   Student: ${lesson.student_id.substring(0, 8)}...\n`);

  // Get sub-topics from lesson
  const subTopics = lesson.sub_topics || [];
  console.log(`Sub-topics in lesson (${subTopics.length}):`);
  subTopics.slice(0, 5).forEach((st, i) => {
    console.log(`  ${i + 1}. "${st.title}"`);
    console.log(`     ID: ${st.id}`);
  });

  // Get sessions for this lesson
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  console.log(`\nSessions for this lesson (${sessions?.length || 0}):`);
  sessions?.forEach((s, i) => {
    console.log(`  ${i + 1}. "${s.sub_topic_data?.title}"`);
    console.log(`     ID: ${s.sub_topic_id}`);
    console.log(`     Created: ${new Date(s.created_at).toLocaleString()}`);
  });

  // Get progress for this student
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', lesson.student_id)
    .order('completion_date', { ascending: false});

  console.log(`\nProgress records for student (${progress?.length || 0}):`);
  progress?.forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.sub_topic_title}"`);
    console.log(`     ID: ${p.sub_topic_id}`);
    console.log(`     Completed: ${new Date(p.completion_date).toLocaleString()}`);
  });

  // Check matches
  console.log('\n=== COMPLETION CHECK SIMULATION ===\n');
  console.log('This simulates what happens when the UI checks completion after refresh:\n');

  const progressIds = new Set(progress?.map(p => p.sub_topic_id) || []);
  
  subTopics.slice(0, 5).forEach((st, i) => {
    const isCompleted = progressIds.has(st.id);
    console.log(`${i + 1}. ${isCompleted ? '✅' : '❌'} "${st.title}"`);
    console.log(`   Lesson ID: ${st.id}`);
    console.log(`   In progress: ${isCompleted ? 'YES' : 'NO'}`);
    
    if (!isCompleted) {
      // Check if there's a session with this title but different ID
      const sessionWithTitle = sessions?.find(s => s.sub_topic_data?.title === st.title);
      if (sessionWithTitle) {
        console.log(`   ⚠️  Session exists with different ID: ${sessionWithTitle.sub_topic_id}`);
      }
    }
    console.log('');
  });

  console.log('=== DIAGNOSIS ===\n');
  
  const matchCount = subTopics.slice(0, 5).filter(st => progressIds.has(st.id)).length;
  console.log(`Matches found: ${matchCount} out of ${Math.min(5, subTopics.length)}`);
  
  if (matchCount < sessions?.length) {
    console.log('\n❌ PROBLEM: Some sessions exist but don\'t match lesson sub_topics');
    console.log('   This means completion status will disappear after refresh.');
    console.log('\n   Possible causes:');
    console.log('   1. Lesson was regenerated after creating interactive material');
    console.log('   2. Sub-topic IDs changed between generation and material creation');
    console.log('   3. Wrong lesson is being loaded in the UI');
  } else if (matchCount === sessions?.length && matchCount > 0) {
    console.log('\n✅ All sessions match! Completion should persist.');
    console.log('   If it\'s not showing in UI, the issue is with:');
    console.log('   1. Student context not being set correctly');
    console.log('   2. Progress not being loaded from database');
    console.log('   3. UI checking wrong lesson');
  }
}

diagnoseCompletionCheck();
