#!/usr/bin/env node

/**
 * Diagnostic script to check lesson history database state
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseLessonHistory() {
  console.log('🔍 Diagnosing lesson history database state...\n');

  try {
    // Check lesson_sessions table
    console.log('📋 Checking lesson_sessions table:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('❌ Error fetching lesson sessions:', sessionsError.message);
    } else {
      console.log(`✅ Found ${sessions.length} lesson sessions`);
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Session ${session.id.substring(0, 8)}... - Student: ${session.student_id.substring(0, 8)}... - Sub-topic: ${session.sub_topic_id} - Created: ${session.created_at}`);
      });
    }

    // Check student_progress table
    console.log('\n📊 Checking student_progress table:');
    const { data: progress, error: progressError } = await supabase
      .from('student_progress')
      .select('*')
      .order('completion_date', { ascending: false })
      .limit(10);

    if (progressError) {
      console.error('❌ Error fetching student progress:', progressError.message);
    } else {
      console.log(`✅ Found ${progress.length} progress entries`);
      progress.forEach((entry, index) => {
        console.log(`   ${index + 1}. Progress ${entry.id.substring(0, 8)}... - Student: ${entry.student_id.substring(0, 8)}... - Sub-topic: ${entry.sub_topic_id} - Completed: ${entry.completion_date}`);
      });
    }

    // Check recent lessons table for comparison
    console.log('\n📚 Checking recent lessons table:');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id, date, status, sub_topics, interactive_lesson_content, created_at')
      .not('sub_topics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError.message);
    } else {
      console.log(`✅ Found ${lessons.length} recent lessons with sub-topics`);
      lessons.forEach((lesson, index) => {
        const hasInteractive = !!lesson.interactive_lesson_content;
        const subTopicsCount = lesson.sub_topics ? lesson.sub_topics.length : 0;
        console.log(`   ${index + 1}. Lesson ${lesson.id.substring(0, 8)}... - Student: ${lesson.student_id.substring(0, 8)}... - Sub-topics: ${subTopicsCount} - Interactive: ${hasInteractive} - Created: ${lesson.created_at}`);
      });
    }

    // Test the lesson history service
    console.log('\n🔧 Testing lesson history service:');
    
    // Get a recent student ID
    if (lessons && lessons.length > 0) {
      const testStudentId = lessons[0].student_id;
      console.log(`Testing with student ID: ${testStudentId.substring(0, 8)}...`);
      
      try {
        // Simulate the service call
        const { data: serviceSessions, error: serviceError } = await supabase
          .from('lesson_sessions')
          .select(`
            *,
            students!inner(id, name, level),
            tutors!inner(id, name),
            lessons(id, date, status)
          `)
          .eq('student_id', testStudentId)
          .order('completed_at', { ascending: false })
          .limit(50);

        if (serviceError) {
          console.error('❌ Service test failed:', serviceError.message);
        } else {
          console.log(`✅ Service test successful: Found ${serviceSessions.length} sessions for student`);
          serviceSessions.forEach((session, index) => {
            console.log(`   ${index + 1}. ${session.sub_topic_data?.title || session.sub_topic_id} - ${session.completed_at}`);
          });
        }
      } catch (serviceTestError) {
        console.error('❌ Service test error:', serviceTestError.message);
      }
    }

    console.log('\n📋 Summary:');
    console.log(`   - Lesson sessions: ${sessions?.length || 0}`);
    console.log(`   - Progress entries: ${progress?.length || 0}`);
    console.log(`   - Recent lessons: ${lessons?.length || 0}`);
    
    if ((sessions?.length || 0) === 0 && (progress?.length || 0) === 0) {
      console.log('\n⚠️ No lesson history data found in database!');
      console.log('   This could explain why lessons don\'t appear in the history tab.');
      console.log('   Possible causes:');
      console.log('   1. markSubTopicComplete is not saving to database');
      console.log('   2. Database write is failing silently');
      console.log('   3. RLS policies are preventing data access');
      console.log('   4. Student/tutor context is missing');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostic
diagnoseLessonHistory().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});