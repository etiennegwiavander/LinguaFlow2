require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepInvestigate() {
  console.log('🔍 DEEP INVESTIGATION: Lesson Data Relationships\n');
  console.log('='.repeat(80));

  // Get the tutor
  const { data: tutor } = await supabase
    .from('tutors')
    .select('*')
    .eq('email', 'vanshidy@gmail.com')
    .single();

  console.log(`\n✅ Tutor: ${tutor.email} (ID: ${tutor.id})\n`);
  console.log('='.repeat(80));

  // 1. Get ALL lessons from lessons table
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('tutor_id', tutor.id)
    .order('created_at', { ascending: false });

  console.log(`\n📚 LESSONS TABLE: ${allLessons?.length || 0} records`);
  console.log('-'.repeat(80));
  
  allLessons?.forEach((lesson, idx) => {
    console.log(`\n${idx + 1}. Lesson ID: ${lesson.id.substring(0, 8)}...`);
    console.log(`   Student ID: ${lesson.student_id?.substring(0, 8) || 'NULL'}...`);
    console.log(`   Date: ${lesson.date}`);
    console.log(`   Created: ${lesson.created_at}`);
    console.log(`   Has interactive_lesson_content: ${lesson.interactive_lesson_content ? 'YES' : 'NO'}`);
    if (lesson.interactive_lesson_content) {
      console.log(`   Content name: ${lesson.interactive_lesson_content.name}`);
    }
  });

  console.log('\n' + '='.repeat(80));

  // 2. Get ALL lesson_sessions
  const { data: allSessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('tutor_id', tutor.id)
    .order('created_at', { ascending: false });

  console.log(`\n📝 LESSON_SESSIONS TABLE: ${allSessions?.length || 0} records`);
  console.log('-'.repeat(80));

  // Group sessions by lesson_id
  const sessionsByLesson = {};
  allSessions?.forEach(session => {
    const lessonId = session.lesson_id || 'NULL';
    if (!sessionsByLesson[lessonId]) {
      sessionsByLesson[lessonId] = [];
    }
    sessionsByLesson[lessonId].push(session);
  });

  console.log(`\n📊 Sessions grouped by lesson_id:`);
  Object.entries(sessionsByLesson).forEach(([lessonId, sessions]) => {
    console.log(`\n   Lesson ID: ${lessonId.substring(0, 8)}...`);
    console.log(`   Number of sessions: ${sessions.length}`);
    sessions.forEach((session, idx) => {
      console.log(`      ${idx + 1}. Session ${session.id.substring(0, 8)}... - Student: ${session.student_id?.substring(0, 8)}... - Created: ${session.created_at}`);
    });
  });

  console.log('\n' + '='.repeat(80));

  // 3. Get ALL student_progress
  const { data: allProgress } = await supabase
    .from('student_progress')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(`\n📈 STUDENT_PROGRESS TABLE: ${allProgress?.length || 0} records`);
  console.log('-'.repeat(80));

  // Group progress by session_id
  const progressBySession = {};
  allProgress?.forEach(progress => {
    const sessionId = progress.session_id || 'NULL';
    if (!progressBySession[sessionId]) {
      progressBySession[sessionId] = [];
    }
    progressBySession[sessionId].push(progress);
  });

  console.log(`\n📊 Progress grouped by session_id:`);
  Object.entries(progressBySession).forEach(([sessionId, progressRecords]) => {
    console.log(`\n   Session ID: ${sessionId.substring(0, 8)}...`);
    console.log(`   Number of progress records: ${progressRecords.length}`);
    progressRecords.forEach((progress, idx) => {
      console.log(`      ${idx + 1}. Progress ${progress.id.substring(0, 8)}... - Student: ${progress.student_id?.substring(0, 8)}... - Completed: ${progress.completed ? 'YES' : 'NO'}`);
    });
  });

  console.log('\n' + '='.repeat(80));

  // 4. CROSS-REFERENCE ANALYSIS
  console.log(`\n🔗 CROSS-REFERENCE ANALYSIS:`);
  console.log('-'.repeat(80));

  console.log(`\n1. Lessons in 'lessons' table: ${allLessons?.length || 0}`);
  console.log(`2. Sessions in 'lesson_sessions' table: ${allSessions?.length || 0}`);
  console.log(`3. Progress records in 'student_progress' table: ${allProgress?.length || 0}`);

  // Check how many sessions reference lessons that exist
  const lessonIds = new Set(allLessons?.map(l => l.id) || []);
  const sessionsWithValidLesson = allSessions?.filter(s => lessonIds.has(s.lesson_id)) || [];
  const sessionsWithInvalidLesson = allSessions?.filter(s => !lessonIds.has(s.lesson_id)) || [];

  console.log(`\n4. Sessions referencing EXISTING lessons: ${sessionsWithValidLesson.length}`);
  console.log(`5. Sessions referencing NON-EXISTENT lessons: ${sessionsWithInvalidLesson.length}`);

  if (sessionsWithInvalidLesson.length > 0) {
    console.log(`\n   ⚠️  ORPHANED SESSIONS (no matching lesson):`);
    sessionsWithInvalidLesson.forEach((session, idx) => {
      console.log(`      ${idx + 1}. Session ${session.id.substring(0, 8)}... references lesson ${session.lesson_id?.substring(0, 8)}... (DOES NOT EXIST)`);
    });
  }

  // Check how many progress records reference sessions that exist
  const sessionIds = new Set(allSessions?.map(s => s.id) || []);
  const progressWithValidSession = allProgress?.filter(p => p.session_id && sessionIds.has(p.session_id)) || [];
  const progressWithInvalidSession = allProgress?.filter(p => p.session_id && !sessionIds.has(p.session_id)) || [];
  const progressWithNullSession = allProgress?.filter(p => !p.session_id) || [];

  console.log(`\n6. Progress records referencing EXISTING sessions: ${progressWithValidSession.length}`);
  console.log(`7. Progress records referencing NON-EXISTENT sessions: ${progressWithInvalidSession.length}`);
  console.log(`8. Progress records with NULL session_id: ${progressWithNullSession.length}`);

  console.log('\n' + '='.repeat(80));

  // 5. THE REAL QUESTION: What represents a "generated lesson"?
  console.log(`\n❓ THE KEY QUESTION: What represents a "generated interactive lesson"?`);
  console.log('-'.repeat(80));

  console.log(`\nOption A: Count from 'lessons' table with interactive_lesson_content`);
  const lessonsWithContent = allLessons?.filter(l => l.interactive_lesson_content) || [];
  console.log(`   Result: ${lessonsWithContent.length} lessons`);

  console.log(`\nOption B: Count from 'lesson_sessions' table (all records)`);
  console.log(`   Result: ${allSessions?.length || 0} sessions`);

  console.log(`\nOption C: Count unique lesson_ids from 'lesson_sessions'`);
  const uniqueLessonIds = new Set(allSessions?.map(s => s.lesson_id).filter(Boolean) || []);
  console.log(`   Result: ${uniqueLessonIds.size} unique lessons`);

  console.log(`\nOption D: Count from 'student_progress' table`);
  console.log(`   Result: ${allProgress?.length || 0} progress records`);

  console.log('\n' + '='.repeat(80));

  // 6. DETAILED EXAMPLE: Pick one lesson and trace it
  if (allLessons && allLessons.length > 0) {
    const exampleLesson = allLessons[0];
    console.log(`\n🔬 DETAILED TRACE: Following lesson ${exampleLesson.id.substring(0, 8)}...`);
    console.log('-'.repeat(80));

    console.log(`\n1. LESSON RECORD:`);
    console.log(`   ID: ${exampleLesson.id}`);
    console.log(`   Student ID: ${exampleLesson.student_id}`);
    console.log(`   Date: ${exampleLesson.date}`);
    console.log(`   Has interactive_lesson_content: ${exampleLesson.interactive_lesson_content ? 'YES' : 'NO'}`);

    const relatedSessions = allSessions?.filter(s => s.lesson_id === exampleLesson.id) || [];
    console.log(`\n2. RELATED SESSIONS: ${relatedSessions.length}`);
    relatedSessions.forEach((session, idx) => {
      console.log(`   ${idx + 1}. Session ${session.id.substring(0, 8)}... - Created: ${session.created_at}`);
    });

    const relatedProgress = allProgress?.filter(p => 
      relatedSessions.some(s => s.id === p.session_id)
    ) || [];
    console.log(`\n3. RELATED PROGRESS RECORDS: ${relatedProgress.length}`);
    relatedProgress.forEach((progress, idx) => {
      console.log(`   ${idx + 1}. Progress ${progress.id.substring(0, 8)}... - Session: ${progress.session_id?.substring(0, 8)}...`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Investigation complete!\n');
}

deepInvestigate().catch(console.error);
