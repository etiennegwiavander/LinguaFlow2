require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkHistoryLessonInLessonsTable() {
  console.log('🔍 Checking if history lessons exist in lessons table\n');

  try {
    // 1. Get a sample lesson session
    console.log('📋 Step 1: Fetching sample lesson session...');
    const { data: session, error: sessionError } = await supabase
      .from('lesson_sessions')
      .select('*')
      .limit(1)
      .single();

    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError);
      return;
    }

    console.log('✅ Found session:');
    console.log('   Session ID:', session.id);
    console.log('   Lesson ID:', session.lesson_id);
    console.log('   Student ID:', session.student_id);
    console.log('   Tutor ID:', session.tutor_id);

    // 2. Check if the lesson_id exists in lessons table
    console.log('\n📋 Step 2: Checking if lesson exists in lessons table...');
    
    if (!session.lesson_id) {
      console.log('   ⚠️ Session has NO lesson_id - this is the problem!');
      console.log('   This means the session was created without linking to a lesson record.');
      
      // Check how many sessions have this issue
      const { data: sessionsWithoutLesson, error: countError } = await supabase
        .from('lesson_sessions')
        .select('id', { count: 'exact', head: true })
        .is('lesson_id', null);
      
      if (!countError) {
        console.log(`   ⚠️ Found ${sessionsWithoutLesson} sessions without lesson_id`);
      }
      
      return;
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', session.lesson_id)
      .single();

    if (lessonError) {
      if (lessonError.code === 'PGRST116') {
        console.log('   ❌ LESSON NOT FOUND in lessons table!');
        console.log('   This is the root cause of the sharing issue.');
        console.log('   The lesson_id in lesson_sessions points to a non-existent lesson.');
      } else {
        console.error('   ❌ Error fetching lesson:', lessonError);
      }
      
      // Check how many sessions have invalid lesson_ids
      console.log('\n📋 Step 3: Checking for orphaned sessions...');
      const { data: allSessions } = await supabase
        .from('lesson_sessions')
        .select('id, lesson_id')
        .not('lesson_id', 'is', null)
        .limit(100);
      
      let orphanedCount = 0;
      for (const s of allSessions || []) {
        const { data: l } = await supabase
          .from('lessons')
          .select('id')
          .eq('id', s.lesson_id)
          .single();
        
        if (!l) orphanedCount++;
      }
      
      console.log(`   ⚠️ Found ${orphanedCount} orphaned sessions (lesson_id points to non-existent lesson)`);
      
      return;
    }

    console.log('   ✅ Lesson EXISTS in lessons table:');
    console.log('   Lesson ID:', lesson.id);
    console.log('   Tutor ID:', lesson.tutor_id);
    console.log('   Student ID:', lesson.student_id);
    console.log('   Has interactive content:', !!lesson.interactive_lesson_content);

    // 3. Test if we can share this lesson
    console.log('\n📋 Step 3: Testing if this lesson can be shared...');
    const { data: shareTest, error: shareError } = await supabase
      .from('shared_lessons')
      .insert({
        lesson_id: lesson.id,
        student_name: 'Test Student',
        lesson_title: 'Test Lesson',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select();

    if (shareError) {
      console.log('   ❌ Cannot share:', shareError.message);
      console.log('   Error code:', shareError.code);
    } else {
      console.log('   ✅ Can share successfully!');
      // Clean up
      await supabase.from('shared_lessons').delete().eq('id', shareTest[0].id);
      console.log('   🧹 Cleaned up test share');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkHistoryLessonInLessonsTable().catch(console.error);
