require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHistoryLessonSharingComplete() {
  console.log('🧪 Testing Complete History Lesson Sharing Flow\n');

  try {
    // 1. Get a lesson session (simulating what the UI does)
    console.log('📋 Step 1: Fetching lesson session (like Lesson History tab)...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select(`
        *,
        students!inner(id, name, level),
        tutors!inner(id, name),
        lessons(id, date, status)
      `)
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    const session = sessions[0];
    console.log('✅ Got session:', session.id);

    // 2. Transform data (like our service does)
    console.log('\n📋 Step 2: Transforming session data (like lesson-history-service.ts)...');
    const transformedSession = {
      id: session.id,
      lesson_id: session.lesson_id,  // ✅ Actual lesson ID
      tutor_id: session.tutor_id,    // ✅ Tutor ID
      student_id: session.student_id, // ✅ Student ID
      completedAt: session.completed_at,
      completedSubTopic: session.sub_topic_data,
      interactive_lesson_content: session.interactive_content,
      lesson_template_id: session.lesson_template_id,
      student: session.students,
      tutor: session.tutors,
      lesson: session.lessons,
      duration_minutes: session.duration_minutes,
      status: session.status
    };

    console.log('✅ Transformed data:', {
      session_id: transformedSession.id,
      lesson_id: transformedSession.lesson_id,
      tutor_id: transformedSession.tutor_id,
      student_id: transformedSession.student_id
    });

    // 3. Simulate what StudentProfileClient does
    console.log('\n📋 Step 3: Simulating StudentProfileClient onViewLesson...');
    const actualLessonId = transformedSession.lesson_id || transformedSession.lesson?.id || transformedSession.id;
    const lessonData = {
      ...transformedSession,
      id: actualLessonId,  // ✅ Correct lesson ID
      tutor_id: transformedSession.tutor_id || transformedSession.tutor?.id,
      student_id: transformedSession.student_id || transformedSession.student?.id,
      selectedSubTopic: transformedSession.completedSubTopic
    };

    console.log('✅ Lesson data for LessonMaterialDisplay:', {
      id: lessonData.id,
      tutor_id: lessonData.tutor_id,
      student_id: lessonData.student_id
    });

    // 4. Verify the lesson exists and can be shared
    console.log('\n📋 Step 4: Verifying lesson exists in lessons table...');
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonData.id)
      .single();

    if (lessonError) {
      console.error('❌ Lesson not found:', lessonError.message);
      console.log('   This means lesson_id is incorrect!');
      return;
    }

    console.log('✅ Lesson found:', {
      id: lesson.id,
      tutor_id: lesson.tutor_id,
      student_id: lesson.student_id
    });

    // 5. Test sharing (like handleShareLesson does)
    console.log('\n📋 Step 5: Testing share operation...');
    const shareableData = {
      lesson_id: lessonData.id,  // Using the lesson ID from our transformed data
      student_name: lessonData.student?.name || 'Student',
      lesson_title: lessonData.interactive_lesson_content?.name || 'Interactive Lesson',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    };

    console.log('   Attempting to share with data:', shareableData);

    const { data: shareRecord, error: shareError } = await supabase
      .from('shared_lessons')
      .insert(shareableData)
      .select()
      .single();

    if (shareError) {
      console.error('❌ Share failed:', shareError.message);
      console.log('   Error code:', shareError.code);
      console.log('   Error details:', shareError);
      
      // Check RLS policy
      console.log('\n📋 Checking RLS policy...');
      const { data: policyCheck } = await supabase.rpc('check_lesson_ownership', {
        p_lesson_id: lessonData.id,
        p_tutor_id: lesson.tutor_id
      }).catch(() => ({ data: null }));
      
      console.log('   Policy check result:', policyCheck);
    } else {
      console.log('✅ Share successful!');
      console.log('   Share ID:', shareRecord.id);
      console.log('   Share URL:', `${supabaseUrl.replace('/rest/v1', '')}/shared-lesson/${shareRecord.id}`);
      
      // Clean up
      await supabase.from('shared_lessons').delete().eq('id', shareRecord.id);
      console.log('   🧹 Cleaned up test share');
    }

    // 6. Summary
    console.log('\n📊 SUMMARY:');
    console.log('   Session ID:', session.id);
    console.log('   Lesson ID used for sharing:', lessonData.id);
    console.log('   Lesson exists in DB:', !!lesson);
    console.log('   Can share:', !shareError);

    if (shareError) {
      console.log('\n❌ ISSUE IDENTIFIED:');
      console.log('   The sharing is failing even though:');
      console.log('   - We have the correct lesson ID');
      console.log('   - The lesson exists in the database');
      console.log('   - The lesson has the correct tutor_id');
      console.log('\n   This suggests an RLS policy issue or authentication problem.');
      console.log('   Check that the authenticated user matches the lesson tutor_id.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testHistoryLessonSharingComplete().catch(console.error);
