/**
 * Diagnostic Script: Lesson Regeneration Issue
 * 
 * This script diagnoses what happens when lessons are regenerated
 * and why completion status appears to "move" between lessons.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseLessonRegenerationIssue() {
  console.log('🔍 Diagnosing Lesson Regeneration Issue\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Find a student with multiple lessons
    console.log('\n📋 Step 1: Finding students with lessons...');
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id, status, sub_topics, created_at, updated_at')
      .not('sub_topics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (lessonsError || !lessons || lessons.length === 0) {
      console.error('❌ No lessons found');
      return;
    }

    // Group by student
    const lessonsByStudent = {};
    lessons.forEach(lesson => {
      if (!lessonsByStudent[lesson.student_id]) {
        lessonsByStudent[lesson.student_id] = [];
      }
      lessonsByStudent[lesson.student_id].push(lesson);
    });

    console.log(`✅ Found ${Object.keys(lessonsByStudent).length} students with lessons\n`);

    // Step 2: Analyze each student's lessons
    for (const [studentId, studentLessons] of Object.entries(lessonsByStudent)) {
      if (studentLessons.length < 2) continue; // Skip students with only 1 lesson

      console.log('─'.repeat(70));
      console.log(`\n👤 Student: ${studentId.substring(0, 8)}...`);
      console.log(`   Total lessons: ${studentLessons.length}`);

      // Sort by creation date
      studentLessons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`\n   📚 Lesson Timeline:`);
      studentLessons.forEach((lesson, idx) => {
        const isUpcoming = lesson.status === 'upcoming';
        const subTopicCount = lesson.sub_topics?.length || 0;
        const firstSubTopicId = lesson.sub_topics?.[0]?.id || 'none';
        
        console.log(`\n   ${idx + 1}. Lesson ${lesson.id.substring(0, 8)}...`);
        console.log(`      Status: ${lesson.status} ${isUpcoming ? '← CURRENT UPCOMING' : ''}`);
        console.log(`      Created: ${new Date(lesson.created_at).toLocaleString()}`);
        console.log(`      Updated: ${new Date(lesson.updated_at).toLocaleString()}`);
        console.log(`      Sub-topics: ${subTopicCount}`);
        console.log(`      First sub-topic ID: ${firstSubTopicId.substring(0, 40)}...`);
      });

      // Step 3: Check if sub-topics were regenerated (same lesson, different sub-topics)
      const upcomingLesson = studentLessons.find(l => l.status === 'upcoming');
      if (upcomingLesson) {
        console.log(`\n   🔍 Analyzing upcoming lesson regeneration:`);
        
        const createdDate = new Date(upcomingLesson.created_at);
        const updatedDate = new Date(upcomingLesson.updated_at);
        const timeDiff = updatedDate - createdDate;
        const wasRegenerated = timeDiff > 60000; // More than 1 minute difference
        
        console.log(`      Created: ${createdDate.toLocaleString()}`);
        console.log(`      Updated: ${updatedDate.toLocaleString()}`);
        console.log(`      Time difference: ${Math.round(timeDiff / 1000)} seconds`);
        console.log(`      Was regenerated: ${wasRegenerated ? '✅ YES' : '❌ NO'}`);

        if (wasRegenerated) {
          console.log(`\n      ⚠️  ISSUE DETECTED:`);
          console.log(`      This lesson was regenerated, replacing old sub-topics`);
          console.log(`      Old completions may not match new sub-topic IDs`);
        }
      }

      // Step 4: Check completion records
      const { data: progressRecords } = await supabase
        .from('student_progress')
        .select('sub_topic_id, sub_topic_title, completion_date')
        .eq('student_id', studentId)
        .order('completion_date', { ascending: false });

      if (progressRecords && progressRecords.length > 0) {
        console.log(`\n   📊 Completion Records: ${progressRecords.length}`);
        
        // Check which lessons these completions belong to
        progressRecords.forEach((record, idx) => {
          const matchingLesson = studentLessons.find(lesson => 
            record.sub_topic_id.startsWith(lesson.id)
          );
          
          console.log(`\n      ${idx + 1}. ${record.sub_topic_title || 'Untitled'}`);
          console.log(`         ID: ${record.sub_topic_id.substring(0, 50)}...`);
          console.log(`         Belongs to lesson: ${matchingLesson ? matchingLesson.id.substring(0, 8) + '...' : '❌ NOT FOUND'}`);
          console.log(`         Completed: ${new Date(record.completion_date).toLocaleString()}`);
          
          if (!matchingLesson) {
            console.log(`         ⚠️  ORPHANED: This completion doesn't match any current lesson!`);
          }
        });
      }
    }

    // Step 5: Summary and diagnosis
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 DIAGNOSIS\n');

    console.log('🔍 How the "moving completion" bug happens:\n');
    console.log('1. User completes a sub-topic from Lesson A');
    console.log('   → Completion saved with ID: lessonA_subtopic_1_1\n');
    
    console.log('2. User clicks "Regenerate" on the SAME lesson');
    console.log('   → System REPLACES sub-topics in Lesson A');
    console.log('   → New sub-topics get NEW IDs: lessonA_subtopic_1_1 (different content!)\n');
    
    console.log('3. System checks if lessonA_subtopic_1_1 is complete');
    console.log('   → Finds old completion record with same ID');
    console.log('   → Shows green badge on NEW sub-topic (wrong!)\n');

    console.log('💡 ROOT CAUSE:');
    console.log('   When regenerating, the system REPLACES sub-topics in the same lesson');
    console.log('   instead of creating a NEW lesson. This causes ID reuse.\n');

    console.log('✅ SOLUTION:');
    console.log('   Option A: Create a NEW lesson when regenerating (recommended)');
    console.log('   Option B: Include a timestamp/version in sub-topic IDs');
    console.log('   Option C: Clear old completions when regenerating');

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
diagnoseLessonRegenerationIssue();
