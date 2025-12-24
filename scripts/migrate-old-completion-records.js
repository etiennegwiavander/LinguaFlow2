/**
 * Migration Script: Update Old Completion Records
 * 
 * This script updates old completion records in student_progress
 * to match the new sub-topic ID format with lesson prefixes.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateOldCompletionRecords() {
  console.log('🔄 Migrating Old Completion Records\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Find all old-format completion records
    console.log('\n📋 Step 1: Finding old-format completion records...');
    
    const { data: oldRecords, error: fetchError } = await supabase
      .from('student_progress')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError);
      return;
    }

    // Filter for old format (doesn't start with UUID pattern)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/;
    const oldFormatRecords = oldRecords.filter(r => !uuidPattern.test(r.sub_topic_id));

    console.log(`✅ Found ${oldFormatRecords.length} old-format records to migrate`);

    if (oldFormatRecords.length === 0) {
      console.log('\n✅ No migration needed - all records already use new format!');
      return;
    }

    // Step 2: For each old record, find the matching lesson
    console.log('\n📋 Step 2: Matching records to lessons...');
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of oldFormatRecords) {
      console.log(`\n   Processing: ${record.sub_topic_title || record.sub_topic_id}`);
      console.log(`   Old ID: ${record.sub_topic_id}`);
      console.log(`   Student: ${record.student_id}`);

      // Find lessons for this student that have sub-topics
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, sub_topics, created_at')
        .eq('student_id', record.student_id)
        .not('sub_topics', 'is', null)
        .order('created_at', { ascending: false });

      if (lessonsError || !lessons || lessons.length === 0) {
        console.log(`   ⚠️  No lessons found for this student`);
        skippedCount++;
        continue;
      }

      // Try to find a lesson with a matching sub-topic
      let matchedLesson = null;
      let matchedSubTopic = null;

      for (const lesson of lessons) {
        // Check if any sub-topic in this lesson matches the old ID pattern
        const match = lesson.sub_topics.find(st => {
          // The new ID should be: {lesson_id}_{old_id}
          // So we check if the new ID ends with the old ID
          return st.id.endsWith(record.sub_topic_id) || 
                 st.id === `${lesson.id}_${record.sub_topic_id}`;
        });

        if (match) {
          matchedLesson = lesson;
          matchedSubTopic = match;
          break;
        }
      }

      if (!matchedLesson || !matchedSubTopic) {
        console.log(`   ⚠️  Could not find matching lesson - skipping`);
        skippedCount++;
        continue;
      }

      const newId = matchedSubTopic.id;
      console.log(`   ✅ Found match in lesson: ${matchedLesson.id.substring(0, 8)}...`);
      console.log(`   New ID: ${newId}`);

      // Step 3: Update the record with the new ID
      // We need to delete the old record and insert a new one (because sub_topic_id is part of unique constraint)
      
      // First, delete the old record
      const { error: deleteError } = await supabase
        .from('student_progress')
        .delete()
        .eq('id', record.id);

      if (deleteError) {
        console.log(`   ❌ Error deleting old record:`, deleteError.message);
        errorCount++;
        continue;
      }

      // Then, insert with new ID
      const { error: insertError } = await supabase
        .from('student_progress')
        .insert({
          student_id: record.student_id,
          tutor_id: record.tutor_id,
          sub_topic_id: newId,
          sub_topic_title: record.sub_topic_title,
          sub_topic_category: record.sub_topic_category,
          sub_topic_level: record.sub_topic_level,
          completion_date: record.completion_date,
          lesson_session_id: record.lesson_session_id,
          score: record.score,
          notes: record.notes
        });

      if (insertError) {
        console.log(`   ❌ Error inserting new record:`, insertError.message);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Migrated successfully!`);
      migratedCount++;
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 MIGRATION SUMMARY\n');
    console.log(`Total old records found: ${oldFormatRecords.length}`);
    console.log(`Successfully migrated: ${migratedCount} ✅`);
    console.log(`Skipped (no match): ${skippedCount} ⚠️`);
    console.log(`Errors: ${errorCount} ❌`);

    if (migratedCount > 0) {
      console.log(`\n✅ Migration completed successfully!`);
      console.log(`   ${migratedCount} completion records now use the new ID format`);
      console.log(`   Completion indicators should now persist correctly`);
    }

    if (skippedCount > 0) {
      console.log(`\n⚠️  ${skippedCount} records were skipped`);
      console.log(`   These are likely from deleted lessons or old data`);
      console.log(`   You can safely ignore these`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  }
}

// Run the migration
migrateOldCompletionRecords();
