/**
 * Check the specific student with 3 completed lessons
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStudent() {
  // Get the student with ID starting with 231d5e2b
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .ilike('id', '231d5e2b%');

  if (!students || students.length === 0) {
    console.log('Student not found');
    return;
  }

  const student = students[0];
  console.log(`Student: ${student.name} (${student.id.substring(0, 8)}...)\n`);

  // Get their lesson
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', student.id)
    .not('sub_topics', 'is', null)
    .order('date', { ascending: false })
    .limit(1);

  if (!lessons || lessons.length === 0) {
    console.log('No lessons found');
    return;
  }

  const lesson = lessons[0];
  console.log(`Lesson ID: ${lesson.id.substring(0, 8)}...\n`);

  const subTopics = lesson.sub_topics || [];
  console.log(`Sub-topics in lessons.sub_topics: ${subTopics.length}`);
  subTopics.slice(0, 5).forEach((st, i) => {
    console.log(`  ${i + 1}. "${st.title}"`);
    console.log(`     ID: ${st.id}`);
  });

  // Get lesson_sessions
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false });

  console.log(`\nLesson sessions: ${sessions?.length || 0}`);
  sessions?.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. "${s.sub_topic_data?.title}"`);
    console.log(`     ID: ${s.sub_topic_id}`);
  });

  // Get progress
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', student.id)
    .order('completion_date', { ascending: false });

  console.log(`\nProgress records: ${progress?.length || 0}`);
  progress?.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.sub_topic_title}"`);
    console.log(`     ID: ${p.sub_topic_id}`);
  });

  // Check for matches
  console.log('\n=== MATCHING ANALYSIS ===\n');
  
  const lessonIds = new Set(subTopics.map(st => st.id));
  const sessionIds = new Set(sessions?.map(s => s.sub_topic_id) || []);
  const progressIds = new Set(progress?.map(p => p.sub_topic_id) || []);

  console.log('Checking first 3 sub-topics from lesson:\n');
  subTopics.slice(0, 3).forEach((st, i) => {
    console.log(`${i + 1}. "${st.title}"`);
    console.log(`   Lesson ID: ${st.id}`);
    console.log(`   In sessions: ${sessionIds.has(st.id) ? '✅' : '❌'}`);
    console.log(`   In progress: ${progressIds.has(st.id) ? '✅' : '❌'}`);
    console.log('');
  });
}

checkStudent();
