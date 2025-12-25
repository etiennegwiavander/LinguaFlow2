/**
 * Check the most recent lesson sessions to see what IDs are being saved
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentSessions() {
  console.log('🔍 Checking most recent lesson sessions...\n');

  // Get the most recent sessions
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!sessions || sessions.length === 0) {
    console.log('No sessions found');
    return;
  }

  console.log(`Found ${sessions.length} recent sessions:\n`);

  for (const session of sessions) {
    console.log(`📝 Session: ${session.id.substring(0, 8)}...`);
    console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`);
    console.log(`   Sub-topic: "${session.sub_topic_data?.title}"`);
    console.log(`   Sub-topic ID: ${session.sub_topic_id}`);
    console.log(`   Has timestamp: ${session.sub_topic_id.includes('_17') ? '❌ YES (OLD)' : '✅ NO (NEW)'}`);
    console.log(`   Lesson ID: ${session.lesson_id?.substring(0, 8)}...\n`);

    // Get the lesson to compare
    if (session.lesson_id) {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('sub_topics')
        .eq('id', session.lesson_id)
        .single();

      if (lesson && lesson.sub_topics) {
        const matchingSubTopic = lesson.sub_topics.find(st => 
          st.title === session.sub_topic_data?.title
        );

        if (matchingSubTopic) {
          console.log(`   Lesson has sub-topic with ID: ${matchingSubTopic.id}`);
          console.log(`   IDs match: ${matchingSubTopic.id === session.sub_topic_id ? '✅ YES' : '❌ NO'}`);
          
          if (matchingSubTopic.id !== session.sub_topic_id) {
            console.log(`   ⚠️  MISMATCH DETECTED!`);
            console.log(`      Expected: ${matchingSubTopic.id}`);
            console.log(`      Got:      ${session.sub_topic_id}`);
          }
        } else {
          console.log(`   ⚠️  Sub-topic not found in lesson.sub_topics`);
        }
      }
      console.log('');
    }
  }
}

checkRecentSessions();
