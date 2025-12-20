require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseHistoryLessonSharing() {
  console.log('🔍 Diagnosing History Lesson Sharing Issue\n');

  try {
    // 1. Get a sample lesson session from history
    console.log('📋 Step 1: Fetching sample lesson session from history...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select(`
        *,
        students!inner(id, name, level),
        tutors!inner(id, name),
        lessons(id, date, status, tutor_id, student_id)
      `)
      .limit(1)
      .single();

    if (sessionsError) {
      console.error('❌ Error fetching session:', sessionsError);
      return;
    }

    console.log('\n✅ Sample Lesson Session Structure:');
    console.log('   Session ID:', sessions.id);
    console.log('   Lesson ID:', sessions.lesson_id);
    console.log('   Lesson Object:', sessions.lessons);
    console.log('   Tutor Object:', sessions.tutors);
    console.log('   Student Object:', sessions.students);

    // 2. Check what happens when we try to share with session ID
    console.log('\n📋 Step 2: Testing share with SESSION ID (current broken behavior)...');
    const { data: shareTest1, error: shareError1 } = await supabase
      .from('shared_lessons')
      .insert({
        lesson_id: sessions.id,  // ❌ Using SESSION ID (wrong!)
        student_name: sessions.students.name,
        lesson_title: 'Test Lesson',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select();

    if (shareError1) {
      console.log('   ❌ Failed (as expected):', shareError1.message);
      console.log('   Error Code:', shareError1.code);
    } else {
      console.log('   ⚠️ Unexpectedly succeeded - cleaning up...');
      await supabase.from('shared_lessons').delete().eq('id', shareTest1[0].id);
    }

    // 3. Check what happens when we try to share with actual lesson ID
    console.log('\n📋 Step 3: Testing share with LESSON ID (correct behavior)...');
    const { data: shareTest2, error: shareError2 } = await supabase
      .from('shared_lessons')
      .insert({
        lesson_id: sessions.lesson_id,  // ✅ Using LESSON ID (correct!)
        student_name: sessions.students.name,
        lesson_title: 'Test Lesson',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select();

    if (shareError2) {
      console.log('   ❌ Failed:', shareError2.message);
      console.log('   Error Code:', shareError2.code);
    } else {
      console.log('   ✅ Success! Share link created:', shareTest2[0].id);
      // Clean up
      await supabase.from('shared_lessons').delete().eq('id', shareTest2[0].id);
      console.log('   🧹 Cleaned up test share link');
    }

    // 4. Show the data structure difference
    console.log('\n📊 Data Structure Comparison:');
    console.log('\n   Fresh Lesson (from lessons table):');
    console.log('   {');
    console.log('     id: "lesson-uuid",');
    console.log('     tutor_id: "tutor-uuid",  ✅ Has tutor_id');
    console.log('     student_id: "student-uuid",');
    console.log('     interactive_lesson_content: {...}');
    console.log('   }');
    
    console.log('\n   History Lesson (from lesson_sessions table):');
    console.log('   {');
    console.log('     id: "session-uuid",  ❌ This is SESSION id, not LESSON id!');
    console.log('     lesson_id: "lesson-uuid",  ✅ Actual lesson ID is here');
    console.log('     lesson: { id, date, status },  ⚠️ Nested lesson object');
    console.log('     tutor: { id, name },  ⚠️ Tutor info is nested');
    console.log('     interactive_content: {...}  ⚠️ Different field name');
    console.log('   }');

    console.log('\n🔧 THE FIX:');
    console.log('   When sharing a history lesson, use:');
    console.log('   - lessonEntry.lesson_id (not lessonEntry.id)');
    console.log('   - OR lessonEntry.lesson?.id if lesson object is available');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseHistoryLessonSharing().catch(console.error);
