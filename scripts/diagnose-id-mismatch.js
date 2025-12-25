/**
 * Diagnostic Script: Check for ID mismatch between lessons table and lesson_sessions
 * 
 * This script compares:
 * 1. Sub-topic IDs in the lessons.sub_topics field (from generate-lesson-plan)
 * 2. Sub-topic IDs in lesson_sessions table (from generate-interactive-material)
 * 3. Sub-topic IDs in student_progress table (completion records)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseIdMismatch() {
  console.log('🔍 Diagnosing ID Mismatch Issue\n');
  console.log('=' .repeat(70));

  try {
    // Get a recent lesson with sub_topics
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .not('sub_topics', 'is', null)
      .order('date', { ascending: false })
      .limit(1);

    if (lessonsError || !lessons || lessons.length === 0) {
      console.log('❌ No lessons found with sub_topics');
      return;
    }

    const lesson = lessons[0];
    console.log(`\n📝 Analyzing Lesson: ${lesson.id.substring(0, 8)}...`);
    console.log(`   Student ID: ${lesson.student_id.substring(0, 8)}...`);
    console.log(`   Date: ${new Date(lesson.date).toLocaleDateString()}\n`);

    // Parse sub_topics from lessons table
    const subTopicsFromLesson = lesson.sub_topics || [];
    console.log(`📊 Sub-topics in lessons.sub_topics (${subTopicsFromLesson.length}):`);
    subTopicsFromLesson.forEach((st, i) => {
      console.log(`   ${i + 1}. "${st.title}"`);
      console.log(`      ID: ${st.id}`);
    });

    // Get lesson_sessions for this lesson
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.log('\n❌ Error fetching lesson_sessions:', sessionsError);
      return;
    }

    console.log(`\n📊 Sub-topics in lesson_sessions (${sessions?.length || 0}):`);
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, i) => {
        console.log(`   ${i + 1}. "${session.sub_topic_data?.title || 'Unknown'}"`);
        console.log(`      ID: ${session.sub_topic_id}`);
        console.log(`      Created: ${new Date(session.created_at).toLocaleString()}`);
      });
    } else {
      console.log('   (No sessions found)');
    }

    // Get student_progress for this student
    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', lesson.student_id)
      .order('completion_date', { ascending: false });

    if (progressError) {
      console.log('\n❌ Error fetching student_progress:', progressError);
      return;
    }

    console.log(`\n📊 Completion records in student_progress (${progress?.length || 0}):`);
    if (progress && progress.length > 0) {
      progress.forEach((p, i) => {
        console.log(`   ${i + 1}. "${p.sub_topic_title || 'Unknown'}"`);
        console.log(`      ID: ${p.sub_topic_id}`);
        console.log(`      Completed: ${new Date(p.completion_date).toLocaleString()}`);
      });
    } else {
      console.log('   (No progress records found)');
    }

    // Compare IDs
    console.log('\n' + '='.repeat(70));
    console.log('\n🔍 ID COMPARISON ANALYSIS\n');

    const lessonSubTopicIds = new Set(subTopicsFromLesson.map(st => st.id));
    const sessionSubTopicIds = new Set(sessions?.map(s => s.sub_topic_id) || []);
    const progressSubTopicIds = new Set(progress?.map(p => p.sub_topic_id) || []);

    console.log('Checking each sub-topic from lessons.sub_topics:\n');

    subTopicsFromLesson.forEach((st, i) => {
      console.log(`${i + 1}. "${st.title}"`);
      console.log(`   Lesson ID: ${st.id}`);
      
      const inSessions = sessionSubTopicIds.has(st.id);
      const inProgress = progressSubTopicIds.has(st.id);
      
      console.log(`   In lesson_sessions: ${inSessions ? '✅ YES' : '❌ NO'}`);
      console.log(`   In student_progress: ${inProgress ? '✅ YES' : '❌ NO'}`);
      
      if (!inSessions || !inProgress) {
        console.log(`   ⚠️  MISMATCH DETECTED!`);
        
        // Try to find similar titles
        const matchingSession = sessions?.find(s => 
          s.sub_topic_data?.title === st.title
        );
        
        if (matchingSession) {
          console.log(`   💡 Found session with same title but different ID:`);
          console.log(`      Session ID: ${matchingSession.sub_topic_id}`);
        }
      }
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('\n💡 DIAGNOSIS:\n');

    const hasIdMismatch = subTopicsFromLesson.some(st => 
      !sessionSubTopicIds.has(st.id) || !progressSubTopicIds.has(st.id)
    );

    if (hasIdMismatch) {
      console.log('❌ ID MISMATCH CONFIRMED!');
      console.log('\nThe problem:');
      console.log('   • lessons.sub_topics has IDs from generate-lesson-plan');
      console.log('   • lesson_sessions has DIFFERENT IDs from generate-interactive-material');
      console.log('   • student_progress uses the IDs from lesson_sessions');
      console.log('\nResult:');
      console.log('   • After refresh, UI loads sub_topics from lessons.sub_topics');
      console.log('   • Completion check looks for those IDs in student_progress');
      console.log('   • ❌ NOT FOUND because IDs don\'t match!');
      console.log('\nSolution needed:');
      console.log('   • generate-interactive-material must use the SAME sub_topic_id');
      console.log('     that was passed from the UI (from lessons.sub_topics)');
      console.log('   • OR update lessons.sub_topics when interactive material is created');
    } else {
      console.log('✅ No ID mismatch detected');
      console.log('   All sub_topic_ids match across tables');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnoseIdMismatch();
