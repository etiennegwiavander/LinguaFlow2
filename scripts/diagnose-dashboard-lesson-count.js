require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDashboardCount() {
  console.log('🔍 Diagnosing Dashboard Lesson Count for vanshidy@gmail.com\n');

  // Find the tutor
  const { data: tutor, error: tutorError } = await supabase
    .from('tutors')
    .select('id, email, first_name, last_name')
    .eq('email', 'vanshidy@gmail.com')
    .single();

  if (tutorError || !tutor) {
    console.error('❌ Tutor not found:', tutorError);
    return;
  }

  console.log('✅ Found tutor:', tutor.email);
  console.log('   ID:', tutor.id);
  console.log('   Name:', tutor.first_name, tutor.last_name);
  console.log('\n' + '='.repeat(80) + '\n');

  // Query 1: ALL lessons for this tutor
  const { data: allLessons, error: allError } = await supabase
    .from('lessons')
    .select('id, date, created_at, interactive_lesson_content, student_id')
    .eq('tutor_id', tutor.id)
    .order('created_at', { ascending: false });

  console.log('📊 QUERY 1: ALL LESSONS');
  console.log('   Total lessons in database:', allLessons?.length || 0);
  
  if (allLessons && allLessons.length > 0) {
    const withContent = allLessons.filter(l => l.interactive_lesson_content !== null);
    const withoutContent = allLessons.filter(l => l.interactive_lesson_content === null);
    
    console.log('   ✅ With interactive_lesson_content:', withContent.length);
    console.log('   ❌ Without interactive_lesson_content:', withoutContent.length);
    
    console.log('\n   Recent lessons:');
    allLessons.slice(0, 10).forEach((lesson, idx) => {
      const hasContent = lesson.interactive_lesson_content !== null;
      console.log(`   ${idx + 1}. ${lesson.id.substring(0, 8)}... - ${hasContent ? '✅ HAS' : '❌ NO'} content - Created: ${new Date(lesson.created_at).toLocaleDateString()}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Query 2: Dashboard query (with interactive_lesson_content filter)
  const { count: dashboardCount, error: dashboardError } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', tutor.id)
    .not('interactive_lesson_content', 'is', null);

  console.log('📊 QUERY 2: DASHBOARD "TOTAL LESSONS" QUERY');
  console.log('   Query: lessons WHERE tutor_id = X AND interactive_lesson_content IS NOT NULL');
  console.log('   Count:', dashboardCount);

  console.log('\n' + '='.repeat(80) + '\n');

  // Query 3: This month's lessons
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const { count: monthCount, error: monthError } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', tutor.id)
    .gte('date', startOfMonth.toISOString())
    .not('interactive_lesson_content', 'is', null);

  console.log('📊 QUERY 3: DASHBOARD "LESSONS THIS MONTH" QUERY');
  console.log('   Query: lessons WHERE tutor_id = X AND date >= start_of_month AND interactive_lesson_content IS NOT NULL');
  console.log('   Start of month:', startOfMonth.toISOString());
  console.log('   Count:', monthCount);

  console.log('\n' + '='.repeat(80) + '\n');

  // Query 4: Check what interactive_lesson_content looks like
  const { data: sampleLessons, error: sampleError } = await supabase
    .from('lessons')
    .select('id, interactive_lesson_content, created_at')
    .eq('tutor_id', tutor.id)
    .limit(5)
    .order('created_at', { ascending: false });

  console.log('📊 QUERY 4: SAMPLE LESSONS - interactive_lesson_content STRUCTURE');
  if (sampleLessons && sampleLessons.length > 0) {
    sampleLessons.forEach((lesson, idx) => {
      console.log(`\n   Lesson ${idx + 1}: ${lesson.id.substring(0, 8)}...`);
      console.log('   Created:', new Date(lesson.created_at).toLocaleString());
      
      if (lesson.interactive_lesson_content === null) {
        console.log('   ❌ interactive_lesson_content: NULL');
      } else if (lesson.interactive_lesson_content === undefined) {
        console.log('   ❌ interactive_lesson_content: UNDEFINED');
      } else if (typeof lesson.interactive_lesson_content === 'object') {
        console.log('   ✅ interactive_lesson_content: OBJECT');
        console.log('   Keys:', Object.keys(lesson.interactive_lesson_content).slice(0, 5).join(', '));
      } else if (typeof lesson.interactive_lesson_content === 'string') {
        console.log('   ⚠️  interactive_lesson_content: STRING (should be object)');
        console.log('   Length:', lesson.interactive_lesson_content.length);
      } else {
        console.log('   ⚠️  interactive_lesson_content: UNKNOWN TYPE -', typeof lesson.interactive_lesson_content);
      }
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Summary
  console.log('📋 SUMMARY:');
  console.log('   Total lessons in database:', allLessons?.length || 0);
  console.log('   Dashboard shows (Total Lessons):', dashboardCount);
  console.log('   Dashboard shows (This Month):', monthCount);
  console.log('\n   ⚠️  DISCREPANCY:', (allLessons?.length || 0) - (dashboardCount || 0), 'lessons are missing from dashboard count');
  console.log('   Reason: These lessons have NULL interactive_lesson_content');
}

diagnoseDashboardCount();
