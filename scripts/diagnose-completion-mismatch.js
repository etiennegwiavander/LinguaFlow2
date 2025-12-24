/**
 * Diagnostic Script: Sub-Topic Completion Mismatch
 * 
 * This script diagnoses the mismatch between old completion records
 * and new sub-topic IDs after the fix.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseCompletionMismatch() {
  console.log('🔍 Diagnosing Sub-Topic Completion Mismatch\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Check lessons with sub-topics
    console.log('\n📋 Step 1: Checking lessons with sub-topics...');
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id, sub_topics, created_at')
      .not('sub_topics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    console.log(`✅ Found ${lessons.length} recent lessons with sub-topics\n`);

    // Step 2: Analyze each lesson
    for (const lesson of lessons) {
      console.log('─'.repeat(70));
      console.log(`\n📚 Lesson: ${lesson.id}`);
      console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
      console.log(`   Student: ${lesson.student_id}`);
      console.log(`   Sub-topics: ${lesson.sub_topics.length}`);

      // Check sub-topic ID format
      const firstSubTopic = lesson.sub_topics[0];
      const hasNewFormat = firstSubTopic.id.startsWith(lesson.id);
      
      console.log(`\n   Sub-topic ID Format:`);
      console.log(`   Example ID: ${firstSubTopic.id}`);
      console.log(`   Has lesson prefix: ${hasNewFormat ? '✅ YES (NEW FORMAT)' : '❌ NO (OLD FORMAT)'}`);

      // Step 3: Check completion records for this student
      const { data: progressRecords, error: progressError } = await supabase
        .from('student_progress')
        .select('sub_topic_id, sub_topic_title, completion_date')
        .eq('student_id', lesson.student_id)
        .order('completion_date', { ascending: false });

      if (progressError) {
        console.error('   ❌ Error fetching progress:', progressError);
        continue;
      }

      console.log(`\n   Completion Records: ${progressRecords.length}`);

      if (progressRecords.length > 0) {
        console.log(`\n   Recent Completions:`);
        progressRecords.slice(0, 3).forEach((record, idx) => {
          const hasLessonPrefix = record.sub_topic_id.includes('_subtopic_');
          const matchesThisLesson = record.sub_topic_id.startsWith(lesson.id);
          
          console.log(`   ${idx + 1}. ${record.sub_topic_title || 'Untitled'}`);
          console.log(`      ID: ${record.sub_topic_id}`);
          console.log(`      Format: ${hasLessonPrefix ? 'NEW (with lesson prefix)' : 'OLD (no prefix)'}`);
          console.log(`      Matches this lesson: ${matchesThisLesson ? '✅ YES' : '❌ NO'}`);
          console.log(`      Completed: ${new Date(record.completion_date).toLocaleString()}`);
        });
      }

      // Step 4: Check for mismatches
      console.log(`\n   🔍 Mismatch Analysis:`);
      
      const lessonSubTopicIds = lesson.sub_topics.map(st => st.id);
      const completedIds = progressRecords.map(r => r.sub_topic_id);
      
      const matchingCompletions = lessonSubTopicIds.filter(id => 
        completedIds.includes(id)
      );
      
      const orphanedCompletions = completedIds.filter(id => 
        !id.startsWith(lesson.id) && 
        id.includes('subtopic_')
      );

      console.log(`   Lesson sub-topics: ${lessonSubTopicIds.length}`);
      console.log(`   Matching completions: ${matchingCompletions.length}`);
      console.log(`   Orphaned completions (old format): ${orphanedCompletions.length}`);

      if (orphanedCompletions.length > 0) {
        console.log(`\n   ⚠️  MISMATCH DETECTED!`);
        console.log(`   ${orphanedCompletions.length} completion records use old format`);
        console.log(`   These won't match the new sub-topic IDs`);
        
        console.log(`\n   Orphaned IDs:`);
        orphanedCompletions.slice(0, 5).forEach(id => {
          console.log(`   - ${id}`);
        });
      } else if (matchingCompletions.length > 0) {
        console.log(`   ✅ All completions match correctly!`);
      } else {
        console.log(`   ℹ️  No completions for this lesson yet`);
      }
    }

    // Step 5: Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY\n');

    const { data: allProgress } = await supabase
      .from('student_progress')
      .select('sub_topic_id');

    const oldFormatCount = allProgress?.filter(p => 
      !p.sub_topic_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/)
    ).length || 0;

    const newFormatCount = allProgress?.filter(p => 
      p.sub_topic_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/)
    ).length || 0;

    console.log(`Total completion records: ${allProgress?.length || 0}`);
    console.log(`Old format (no lesson prefix): ${oldFormatCount}`);
    console.log(`New format (with lesson prefix): ${newFormatCount}`);

    if (oldFormatCount > 0) {
      console.log(`\n⚠️  ISSUE IDENTIFIED:`);
      console.log(`   ${oldFormatCount} completion records use the old ID format`);
      console.log(`   These won't match new lesson sub-topic IDs`);
      console.log(`\n💡 SOLUTION:`);
      console.log(`   Run the migration script to update old completion records`);
      console.log(`   Command: node scripts/migrate-old-completion-records.js`);
    } else {
      console.log(`\n✅ All completion records use the new format!`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
diagnoseCompletionMismatch();
