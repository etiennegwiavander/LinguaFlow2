/**
 * Migration Script: Remove timestamps from old sub_topic_ids
 * 
 * This script updates lesson_sessions and student_progress records
 * that have the old format (with timestamps) to the new format (without timestamps).
 * 
 * Old format: lesson123_1735123456789_subtopic_1_1
 * New format: lesson123_subtopic_1_1
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateRemoveTimestamps() {
  console.log('🔄 Starting migration to remove timestamps from sub_topic_ids...\n');

  try {
    // Step 1: Find all sessions with timestamps in sub_topic_id
    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    console.log(`📊 Found ${sessions.length} total lesson sessions\n`);

    // Filter sessions that have timestamps (contain _17 which is the start of Unix timestamps in milliseconds)
    const sessionsWithTimestamps = sessions.filter(s => 
      s.sub_topic_id && s.sub_topic_id.includes('_17')
    );

    console.log(`⚠️  Found ${sessionsWithTimestamps.length} sessions with timestamps\n`);

    if (sessionsWithTimestamps.length === 0) {
      console.log('✅ No sessions need migration!');
      return;
    }

    // Step 2: Show what will be migrated
    console.log('📋 Migration Plan:\n');
    const updates = [];

    for (const session of sessionsWithTimestamps) {
      // Remove timestamp from sub_topic_id
      // Pattern: lessonId_timestamp_subtopic_X_Y -> lessonId_subtopic_X_Y
      const oldId = session.sub_topic_id;
      const newId = oldId.replace(/_\d{13}_/, '_'); // Remove _timestamp_

      console.log(`Session: ${session.id.substring(0, 8)}...`);
      console.log(`  Title: "${session.sub_topic_data?.title}"`);
      console.log(`  Old ID: ${oldId}`);
      console.log(`  New ID: ${newId}`);
      console.log('');

      updates.push({
        sessionId: session.id,
        studentId: session.student_id,
        oldId,
        newId
      });
    }

    // Step 3: Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question(`\n⚠️  Proceed with migrating ${updates.length} records? (yes/no): `, async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Migration cancelled.');
        readline.close();
        return;
      }

      console.log('\n🚀 Starting migration...\n');

      let successCount = 0;
      let errorCount = 0;

      // Step 4: Update lesson_sessions
      console.log('📝 Updating lesson_sessions...');
      for (const update of updates) {
        try {
          const { error } = await supabase
            .from('lesson_sessions')
            .update({ sub_topic_id: update.newId })
            .eq('id', update.sessionId);

          if (error) {
            console.error(`   ❌ Error updating session ${update.sessionId.substring(0, 8)}:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`   ❌ Error:`, err.message);
          errorCount++;
        }
      }

      console.log(`   ✅ Updated ${successCount} lesson_sessions`);
      if (errorCount > 0) {
        console.log(`   ❌ Failed ${errorCount} updates`);
      }

      // Step 5: Update student_progress
      console.log('\n📝 Updating student_progress...');
      successCount = 0;
      errorCount = 0;

      for (const update of updates) {
        try {
          const { error } = await supabase
            .from('student_progress')
            .update({ sub_topic_id: update.newId })
            .eq('student_id', update.studentId)
            .eq('sub_topic_id', update.oldId);

          if (error) {
            console.error(`   ❌ Error updating progress for ${update.oldId}:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`   ❌ Error:`, err.message);
          errorCount++;
        }
      }

      console.log(`   ✅ Updated ${successCount} student_progress records`);
      if (errorCount > 0) {
        console.log(`   ❌ Failed ${errorCount} updates`);
      }

      // Step 6: Verify the migration
      console.log('\n🔍 Verifying migration...');
      
      const { data: remainingSessions } = await supabase
        .from('lesson_sessions')
        .select('sub_topic_id')
        .ilike('sub_topic_id', '%_17%');

      console.log(`   Remaining sessions with timestamps: ${remainingSessions?.length || 0}`);

      if (remainingSessions && remainingSessions.length === 0) {
        console.log('\n✅ Migration complete! All timestamps removed.');
        console.log('\n💡 Next steps:');
        console.log('   1. Refresh your browser');
        console.log('   2. Completion status should now persist correctly');
      } else {
        console.log('\n⚠️  Some records still have timestamps. You may need to run the migration again.');
      }

      readline.close();
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  }
}

migrateRemoveTimestamps();
