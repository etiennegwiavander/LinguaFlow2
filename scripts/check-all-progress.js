/**
 * Check ALL progress records in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllProgress() {
  console.log('🔍 Checking ALL progress records in database...\n');

  const { data: allProgress, error } = await supabase
    .from('student_progress')
    .select('*')
    .order('completion_date', { ascending: false });

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  console.log(`Found ${allProgress?.length || 0} total progress records:\n`);

  if (!allProgress || allProgress.length === 0) {
    console.log('⚠️  NO PROGRESS RECORDS FOUND!');
    console.log('   This means either:');
    console.log('   1. All completions were deleted');
    console.log('   2. The table was cleared');
    console.log('   3. We\'re looking at the wrong database');
    return;
  }

  // Group by student
  const byStudent = {};
  allProgress.forEach(p => {
    if (!byStudent[p.student_id]) {
      byStudent[p.student_id] = [];
    }
    byStudent[p.student_id].push(p);
  });

  Object.keys(byStudent).forEach(studentId => {
    const records = byStudent[studentId];
    console.log(`\n📚 Student: ${studentId}`);
    console.log(`   ${records.length} completions:`);
    records.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.sub_topic_title}"`);
      console.log(`      Sub-topic ID: ${r.sub_topic_id}`);
      console.log(`      Completed: ${new Date(r.completion_date).toLocaleString()}`);
    });
  });
}

checkAllProgress();
