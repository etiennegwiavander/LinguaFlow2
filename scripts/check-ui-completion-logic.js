/**
 * Check what the UI should show for completion status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUICompletionLogic() {
  console.log('🔍 Checking UI completion logic...\n');

  const studentId = '231d5e2b-b8b8-4b8b-8b8b-8b8b8b8b8b8b';
  const lessonId = 'cb2b5b55-b697-4bc5-adb6-87e18e825ce8';

  // Step 1: Get progress from database (what progress context loads)
  console.log('📊 Step 1: Loading progress from database (simulating progress context)...\n');
  
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId)
    .order('completion_date', { ascending: false });

  const completedSubTopics = progress?.map(p => p.sub_topic_id) || [];
  
  console.log(`Found ${completedSubTopics.length} completed sub-topics in database:`);
  completedSubTopics.forEach((id, i) => {
    const record = progress.find(p => p.sub_topic_id === id);
    console.log(`  ${i + 1}. ${id}`);
    console.log(`     Title: "${record.sub_topic_title}"`);
    console.log(`     Completed: ${new Date(record.completion_date).toLocaleString()}`);
  });

  // Step 2: Get lesson sub-topics (what UI renders)
  console.log('\n📋 Step 2: Loading lesson sub-topics (what UI renders)...\n');
  
  const { data: lesson } = await supabase
    .from('lessons')
    .select('sub_topics')
    .eq('id', lessonId)
    .single();

  const subTopics = lesson?.sub_topics || [];
  console.log(`Lesson has ${subTopics.length} sub-topics\n`);

  // Step 3: Simulate UI logic
  console.log('🎨 Step 3: Simulating UI rendering logic...\n');
  console.log('UI would show these sub-topics:\n');

  subTopics.slice(0, 10).forEach((st, i) => {
    const isCompleted = completedSubTopics.includes(st.id);
    console.log(`${i + 1}. ${isCompleted ? '✅' : '❌'} "${st.title}"`);
    console.log(`   ID: ${st.id}`);
    console.log(`   Status: ${isCompleted ? 'COMPLETED (green badge)' : 'Not completed'}`);
    console.log('');
  });

  // Step 4: Check for mismatches
  console.log('🔍 Step 4: Checking for issues...\n');
  
  const completedInLesson = subTopics.filter(st => completedSubTopics.includes(st.id));
  const completedNotInLesson = completedSubTopics.filter(id => 
    !subTopics.some(st => st.id === id)
  );

  console.log(`✅ ${completedInLesson.length} completions match current lesson`);
  console.log(`❌ ${completedNotInLesson.length} completions don't match current lesson\n`);

  if (completedNotInLesson.length > 0) {
    console.log('⚠️  These completions won\'t show in UI:');
    completedNotInLesson.forEach(id => {
      const record = progress.find(p => p.sub_topic_id === id);
      console.log(`   - "${record.sub_topic_title}" (${id})`);
    });
    console.log('\n💡 This happens when the lesson is regenerated after creating interactive material.');
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   Database has: ${completedSubTopics.length} completions`);
  console.log(`   UI will show: ${completedInLesson.length} completions`);
  
  if (completedInLesson.length === completedSubTopics.length) {
    console.log('\n✅ All completions should display correctly in UI!');
    console.log('   If you\'re seeing issues, check:');
    console.log('   1. Browser console for progress context logs');
    console.log('   2. React DevTools for completedSubTopics state');
    console.log('   3. Network tab for API calls');
  } else {
    console.log('\n⚠️  Some completions won\'t show because lesson was regenerated.');
  }
}

checkUICompletionLogic();
