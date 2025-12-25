/**
 * Find a lesson that has completed sessions and check for ID mismatch
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findCompletedLesson() {
  console.log('🔍 Finding lessons with completed sessions...\n');

  // Get all lesson_sessions
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!sessions || sessions.length === 0) {
    console.log('No lesson sessions found');
    return;
  }

  console.log(`Found ${sessions.length} recent sessions\n`);

  // Group by lesson_id
  const byLesson = {};
  sessions.forEach(s => {
    if (s.lesson_id) {
      if (!byLesson[s.lesson_id]) {
        byLesson[s.lesson_id] = [];
      }
      byLesson[s.lesson_id].push(s);
    }
  });

  // Find a lesson with multiple sessions
  for (const [lessonId, lessonSessions] of Object.entries(byLesson)) {
    if (lessonSessions.length >= 2) {
      console.log(`\n📝 Analyzing Lesson: ${lessonId.substring(0, 8)}...`);
      console.log(`   Sessions: ${lessonSessions.length}\n`);

      // Get the lesson
      const { data: lesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (!lesson) {
        console.log('   Lesson not found in database');
        continue;
      }

      const subTopics = lesson.sub_topics || [];
      console.log(`   Sub-topics in lessons.sub_topics: ${subTopics.length}`);
      
      if (subTopics.length === 0) {
        console.log('   No sub_topics in lesson');
        continue;
      }

      // Show first 3 sub-topics from lesson
      console.log('\n   From lessons.sub_topics:');
      subTopics.slice(0, 3).forEach((st, i) => {
        console.log(`     ${i + 1}. "${st.title}"`);
        console.log(`        ID: ${st.id}`);
      });

      // Show sessions
      console.log('\n   From lesson_sessions:');
      lessonSessions.slice(0, 3).forEach((s, i) => {
        console.log(`     ${i + 1}. "${s.sub_topic_data?.title}"`);
        console.log(`        ID: ${s.sub_topic_id}`);
      });

      // Check for matches
      console.log('\n   === ID COMPARISON ===');
      const lessonIds = new Set(subTopics.map(st => st.id));
      const sessionIds = new Set(lessonSessions.map(s => s.sub_topic_id));

      let mismatchFound = false;
      subTopics.slice(0, 3).forEach((st, i) => {
        const match = sessionIds.has(st.id);
        console.log(`     ${i + 1}. ${match ? '✅' : '❌'} "${st.title}"`);
        if (!match) {
          mismatchFound = true;
          // Try to find by title
          const sessionWithSameTitle = lessonSessions.find(s => 
            s.sub_topic_data?.title === st.title
          );
          if (sessionWithSameTitle) {
            console.log(`        💡 Session exists with different ID: ${sessionWithSameTitle.sub_topic_id}`);
          }
        }
      });

      if (mismatchFound) {
        console.log('\n   ❌ ID MISMATCH CONFIRMED!');
        console.log('   This is the problem causing completion status to disappear after refresh.');
        return;
      } else {
        console.log('\n   ✅ IDs match - checking next lesson...');
      }
    }
  }
}

findCompletedLesson();
