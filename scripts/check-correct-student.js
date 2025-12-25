/**
 * Check progress for the CORRECT student ID
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCorrectStudent() {
  console.log('🔍 Checking progress for CORRECT student...\n');

  const studentId = '231d5e2b-8b56-408d-b396-5bde7ef05ea2'; // CORRECT ID
  const lessonId = 'cb2b5b55-b697-4bc5-adb6-87e18e825ce8';

  // Get progress
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId)
    .order('completion_date', { ascending: false });

  console.log(`📊 Found ${progress?.length || 0} completions:\n`);
  
  const completedSubTopics = progress?.map(p => p.sub_topic_id) || [];
  progress?.forEach((p, i) => {
    console.log(`${i + 1}. "${p.sub_topic_title}"`);
    console.log(`   ID: ${p.sub_topic_id}`);
    console.log(`   Completed: ${new Date(p.completion_date).toLocaleString()}\n`);
  });

  // Get lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('sub_topics')
    .eq('id', lessonId)
    .single();

  const subTopics = lesson?.sub_topics || [];
  
  console.log(`\n📋 Lesson has ${subTopics.length} sub-topics\n`);
  console.log('🎨 UI Rendering Check:\n');

  subTopics.slice(0, 10).forEach((st, i) => {
    const isCompleted = completedSubTopics.includes(st.id);
    console.log(`${i + 1}. ${isCompleted ? '✅' : '❌'} "${st.title}"`);
    if (isCompleted) {
      const record = progress.find(p => p.sub_topic_id === st.id);
      console.log(`   ✓ Completed: ${new Date(record.completion_date).toLocaleString()}`);
    }
    console.log('');
  });

  const matchingCompletions = subTopics.filter(st => completedSubTopics.includes(st.id)).length;
  
  console.log(`\n📊 RESULT:`);
  console.log(`   Database: ${completedSubTopics.length} completions`);
  console.log(`   UI should show: ${matchingCompletions} completions`);
  
  if (matchingCompletions === completedSubTopics.length) {
    console.log('\n✅ Perfect! All completions match the current lesson.');
    console.log('   If UI still shows issues after refresh, the problem is in:');
    console.log('   1. Progress context not loading correctly');
    console.log('   2. React state not updating');
    console.log('   3. Student context switching');
  } else {
    console.log('\n⚠️  Mismatch detected - lesson was regenerated after completions.');
  }
}

checkCorrectStudent();
