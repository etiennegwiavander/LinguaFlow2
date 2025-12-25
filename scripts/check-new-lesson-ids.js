/**
 * Check the format of newly created lesson IDs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNewLessons() {
  console.log('🔍 Checking most recent lessons and sessions...\n');

  // Get the most recent lesson
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .not('sub_topics', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!lessons || lessons.length === 0) {
    console.log('No lessons found');
    return;
  }

  const lesson = lessons[0];
  console.log(`📝 Most Recent Lesson: ${lesson.id.substring(0, 8)}...`);
  console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
  console.log(`   Student: ${lesson.student_id.substring(0, 8)}...\n`);

  const subTopics = lesson.sub_topics || [];
  console.log(`Sub-topics in lessons.sub_topics (${subTopics.length}):`);
  subTopics.slice(0, 3).forEach((st, i) => {
    console.log(`  ${i + 1}. "${st.title}"`);
    console.log(`     ID: ${st.id}`);
    console.log(`     Has timestamp: ${st.id.includes('_17') ? '❌ YES (OLD FORMAT)' : '✅ NO (NEW FORMAT)'}`);
  });

  // Get recent sessions for this lesson
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('created_at', { ascending: false });

  console.log(`\nLesson sessions for this lesson (${sessions?.length || 0}):`);
  if (sessions && sessions.length > 0) {
    sessions.forEach((s, i) => {
      console.log(`  ${i + 1}. "${s.sub_topic_data?.title}"`);
      console.log(`     ID: ${s.sub_topic_id}`);
      console.log(`     Has timestamp: ${s.sub_topic_id.includes('_17') ? '❌ YES (OLD FORMAT)' : '✅ NO (NEW FORMAT)'}`);
    });
  }

  // Check if IDs match
  console.log('\n=== MATCHING CHECK ===\n');
  
  if (sessions && sessions.length > 0) {
    const lessonIds = new Set(subTopics.map(st => st.id));
    const sessionIds = new Set(sessions.map(s => s.sub_topic_id));

    let allMatch = true;
    sessions.forEach((s, i) => {
      const match = lessonIds.has(s.sub_topic_id);
      console.log(`${i + 1}. ${match ? '✅' : '❌'} "${s.sub_topic_data?.title}"`);
      if (!match) {
        allMatch = false;
        console.log(`   Lesson ID: ${subTopics.find(st => st.title === s.sub_topic_data?.title)?.id || 'NOT FOUND'}`);
        console.log(`   Session ID: ${s.sub_topic_id}`);
      }
    });

    if (allMatch) {
      console.log('\n✅ All IDs match! Fix is working for new lessons.');
    } else {
      console.log('\n❌ IDs still don\'t match. Issue persists.');
    }
  } else {
    console.log('No sessions yet - create interactive material to test.');
  }
}

checkNewLessons();
