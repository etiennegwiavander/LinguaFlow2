require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateLessonTables() {
  console.log('🔍 Investigating Lesson Tables Relationship for vanshidy@gmail.com\n');

  // Find the tutor
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('id, email')
    .eq('email', 'vanshidy@gmail.com')
    .single();

  if (tutorError || !tutor) {
    console.error('❌ Tutor not found');
    return;
  }

  console.log('✅ Tutor ID:', tutor.id);
  console.log('\n' + '='.repeat(80) + '\n');

  // Check lessons table
  const { data: lessons, count: lessonsCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact' })
    .eq('tutor_id', tutor.id);

  console.log('📊 LESSONS TABLE:');
  console.log('   Total records:', lessonsCount);
  console.log('   With interactive_lesson_content:', lessons?.filter(l => l.interactive_lesson_content).length || 0);
  console.log('   Without interactive_lesson_content:', lessons?.filter(l => !l.interactive_lesson_content).length || 0);

  console.log('\n' + '='.repeat(80) + '\n');

  // Check lesson_sessions table
  const { data: sessions, count: sessionsCount, error: sessionsError } = await supabase
    .from('lesson_sessions')
    .select('*', { count: 'exact' })
    .eq('tutor_id', tutor.id);

  console.log('📊 LESSON_SESSIONS TABLE:');
  if (sessionsError) {
    console.log('   ❌ Error:', sessionsError.message);
  } else {
    console.log('   Total records:', sessionsCount);
    if (sessions && sessions.length > 0) {
      console.log('\n   Sample sessions:');
      sessions.slice(0, 5).forEach((session, idx) => {
        console.log(`   ${idx + 1}. Session ID: ${session.id?.substring(0, 8)}...`);
        console.log(`      Student ID: ${session.student_id?.substring(0, 8)}...`);
        console.log(`      Lesson ID: ${session.lesson_id || 'NULL'}`);
        console.log(`      Created: ${new Date(session.created_at).toLocaleDateString()}`);
        console.log(`      Has content: ${session.interactive_lesson_content ? 'YES' : 'NO'}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Check student_progress table
  const { data: progress, count: progressCount, error: progressError } = await supabase
    .from('student_progress')
    .select('*', { count: 'exact' })
    .eq('tutor_id', tutor.id);

  console.log('📊 STUDENT_PROGRESS TABLE:');
  if (progressError) {
    console.log('   ❌ Error:', progressError.message);
  } else {
    console.log('   Total records:', progressCount);
    if (progress && progress.length > 0) {
      console.log('\n   Sample progress records:');
      progress.slice(0, 5).forEach((prog, idx) => {
        console.log(`   ${idx + 1}. Progress ID: ${prog.id?.substring(0, 8)}...`);
        console.log(`      Student ID: ${prog.student_id?.substring(0, 8)}...`);
        console.log(`      Lesson ID: ${prog.lesson_id?.substring(0, 8) || 'NULL'}...`);
        console.log(`      Session ID: ${prog.session_id?.substring(0, 8) || 'NULL'}...`);
        console.log(`      Completed: ${prog.completed ? 'YES' : 'NO'}`);
        console.log(`      Created: ${new Date(prog.created_at).toLocaleDateString()}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Check for students
  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', tutor.id);

  console.log('📊 STUDENTS TABLE:');
  console.log('   Total students:', studentsCount);

  console.log('\n' + '='.repeat(80) + '\n');

  // ANALYSIS
  console.log('📋 ANALYSIS:');
  console.log('   Lessons table:', lessonsCount, 'records');
  console.log('   Lesson_sessions table:', sessionsCount, 'records');
  console.log('   Student_progress table:', progressCount, 'records');
  console.log('   Students:', studentsCount);
  
  console.log('\n   🔍 ISSUE IDENTIFIED:');
  if (sessionsCount > lessonsCount) {
    console.log('   ⚠️  lesson_sessions has MORE records than lessons table!');
    console.log('   ⚠️  Dashboard is counting from WRONG table (lessons instead of lesson_sessions)');
  }
  
  console.log('\n   💡 RECOMMENDATION:');
  console.log('   Dashboard should count from lesson_sessions table, not lessons table');
  console.log('   This would show the actual number of generated lessons');
}

investigateLessonTables();
