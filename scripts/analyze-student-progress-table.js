require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeStudentProgress() {
  console.log('🔍 ANALYZING STUDENT_PROGRESS TABLE\n');
  console.log('='.repeat(80));

  // Get the tutor
  const { data: tutor } = await supabase
    .from('tutors')
    .select('*')
    .eq('email', 'vanshidy@gmail.com')
    .single();

  console.log(`\n✅ Tutor: ${tutor.email} (ID: ${tutor.id})\n`);
  console.log('='.repeat(80));

  // Get ALL student_progress records with full details
  const { data: allProgress } = await supabase
    .from('student_progress')
    .select('*')
    .order('created_at', { ascending: false });

  console.log(`\n📈 STUDENT_PROGRESS TABLE: ${allProgress?.length || 0} total records`);
  console.log('-'.repeat(80));

  // Show each record in detail
  allProgress?.forEach((progress, idx) => {
    console.log(`\n${idx + 1}. Progress ID: ${progress.id.substring(0, 8)}...`);
    console.log(`   Student ID: ${progress.student_id?.substring(0, 8)}...`);
    console.log(`   Lesson ID: ${progress.lesson_id || 'NULL'}`);
    console.log(`   Session ID: ${progress.session_id || 'NULL'}`);
    console.log(`   Subtopic ID: ${progress.subtopic_id || 'NULL'}`);
    console.log(`   Completed: ${progress.completed ? 'YES' : 'NO'}`);
    console.log(`   Created: ${progress.created_at}`);
    console.log(`   Updated: ${progress.updated_at}`);
  });

  console.log('\n' + '='.repeat(80));

  // Analyze the structure
  const withLessonId = allProgress?.filter(p => p.lesson_id) || [];
  const withSessionId = allProgress?.filter(p => p.session_id) || [];
  const withSubtopicId = allProgress?.filter(p => p.subtopic_id) || [];
  const withNone = allProgress?.filter(p => !p.lesson_id && !p.session_id && !p.subtopic_id) || [];

  console.log(`\n📊 STRUCTURE ANALYSIS:`);
  console.log(`   Records with lesson_id: ${withLessonId.length}`);
  console.log(`   Records with session_id: ${withSessionId.length}`);
  console.log(`   Records with subtopic_id: ${withSubtopicId.length}`);
  console.log(`   Records with NONE of the above: ${withNone.length}`);

  console.log('\n' + '='.repeat(80));

  // Get students to understand the context
  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .eq('tutor_id', tutor.id);

  console.log(`\n👥 STUDENTS: ${students?.length || 0} students`);
  students?.forEach((student, idx) => {
    const studentProgress = allProgress?.filter(p => p.student_id === student.id) || [];
    console.log(`   ${idx + 1}. ${student.name} (${student.id.substring(0, 8)}...) - ${studentProgress.length} progress records`);
  });

  console.log('\n' + '='.repeat(80));

  // Check what subtopic_id represents
  if (withSubtopicId.length > 0) {
    console.log(`\n🔍 INVESTIGATING SUBTOPIC_ID:`);
    console.log(`   ${withSubtopicId.length} records have subtopic_id`);
    
    // Get unique subtopic_ids
    const uniqueSubtopicIds = [...new Set(withSubtopicId.map(p => p.subtopic_id))];
    console.log(`   ${uniqueSubtopicIds.length} unique subtopic_ids`);
    
    console.log(`\n   Sample subtopic_ids:`);
    uniqueSubtopicIds.slice(0, 5).forEach((subtopicId, idx) => {
      const count = withSubtopicId.filter(p => p.subtopic_id === subtopicId).length;
      console.log(`      ${idx + 1}. ${subtopicId} - ${count} records`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // THE KEY QUESTION: What does student_progress represent?
  console.log(`\n❓ WHAT DOES STUDENT_PROGRESS REPRESENT?`);
  console.log('-'.repeat(80));

  console.log(`\nBased on the data:`);
  console.log(`   - ${allProgress?.length || 0} progress records exist`);
  console.log(`   - ${withSessionId.length} are linked to lesson_sessions`);
  console.log(`   - ${withSubtopicId.length} are linked to subtopics (Discussion Topics?)`);
  console.log(`   - ${withNone.length} are orphaned (no clear link)`);

  console.log(`\n💡 HYPOTHESIS:`);
  console.log(`   student_progress might track:`);
  console.log(`   1. Interactive lesson completions (via session_id)`);
  console.log(`   2. Discussion topic completions (via subtopic_id)`);
  console.log(`   3. Other learning activities`);

  console.log('\n' + '='.repeat(80));

  // Cross-reference with lesson_sessions
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('tutor_id', tutor.id);

  console.log(`\n🔗 CROSS-REFERENCE WITH LESSON_SESSIONS:`);
  console.log(`   Total lesson_sessions: ${sessions?.length || 0}`);
  console.log(`   Progress records with session_id: ${withSessionId.length}`);
  
  if (sessions && sessions.length > 0) {
    const sessionIds = new Set(sessions.map(s => s.id));
    const progressWithValidSession = withSessionId.filter(p => sessionIds.has(p.session_id));
    const progressWithInvalidSession = withSessionId.filter(p => !sessionIds.has(p.session_id));
    
    console.log(`   Progress records with VALID session_id: ${progressWithValidSession.length}`);
    console.log(`   Progress records with INVALID session_id: ${progressWithInvalidSession.length}`);
  }

  console.log('\n' + '='.repeat(80));

  // Final recommendation
  console.log(`\n💡 RECOMMENDATION FOR DASHBOARD:`);
  console.log('-'.repeat(80));
  
  console.log(`\nTo count "Total Lessons Generated", we should count:`);
  console.log(`   Option 1: Unique lesson_ids in lesson_sessions = ${new Set(sessions?.map(s => s.lesson_id).filter(Boolean)).size}`);
  console.log(`   Option 2: Total lesson_sessions = ${sessions?.length || 0}`);
  console.log(`   Option 3: Lessons with interactive_lesson_content = 2`);
  console.log(`   Option 4: Student_progress records = ${allProgress?.length || 0}`);
  
  console.log(`\n   Which one makes sense for your use case?`);
  console.log(`   - If you want to count UNIQUE lessons created: Option 1`);
  console.log(`   - If you want to count LESSON VIEWS/SESSIONS: Option 2`);
  console.log(`   - If you want to count COMPLETED ACTIVITIES: Option 4 (filtered by completed=true)`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Analysis complete!\n');
}

analyzeStudentProgress().catch(console.error);
