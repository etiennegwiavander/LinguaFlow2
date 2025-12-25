/**
 * Cleanup Script: Remove duplicate lesson sessions
 * 
 * This script removes duplicate lesson_sessions that were created
 * before the regeneration fix was implemented. It keeps only the
 * most recent session for each student + sub-topic combination.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicates() {
  console.log('🧹 Starting cleanup of duplicate lesson sessions...\n');

  try {
    // Get all lesson sessions
    const { data: sessions, error } = await supabase
      .from('lesson_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Total lesson sessions: ${sessions.length}\n`);

    // Group by student + sub-topic title
    const grouped = {};
    sessions.forEach(session => {
      const key = `${session.student_id}_${session.sub_topic_data?.title || 'unknown'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(session);
    });

    // Find duplicates
    const duplicates = Object.entries(grouped).filter(([_, sessions]) => sessions.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found! Database is clean.');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} sub-topics with duplicate sessions\n`);
    console.log('📋 Cleanup plan:\n');

    let totalToDelete = 0;
    const sessionsToDelete = [];

    for (const [key, sessions] of duplicates) {
      const [studentId, title] = key.split('_');
      const keepSession = sessions[0]; // Most recent (already sorted by created_at DESC)
      const deleteCount = sessions.length - 1;
      totalToDelete += deleteCount;

      console.log(`   "${title}"`);
      console.log(`   - Keep: ${keepSession.id.substring(0, 8)}... (${new Date(keepSession.created_at).toLocaleString()})`);
      console.log(`   - Delete: ${deleteCount} older session(s)`);

      // Add older sessions to delete list
      for (let i = 1; i < sessions.length; i++) {
        sessionsToDelete.push(sessions[i].id);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total duplicates: ${duplicates.length} sub-topics`);
    console.log(`   - Sessions to delete: ${totalToDelete}`);
    console.log(`   - Sessions to keep: ${duplicates.length}`);

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\n⚠️  Proceed with deletion? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Cleanup cancelled.');
        readline.close();
        return;
      }

      console.log('\n🗑️  Deleting duplicate sessions...');

      // Delete in batches of 100
      const batchSize = 100;
      for (let i = 0; i < sessionsToDelete.length; i += batchSize) {
        const batch = sessionsToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('lesson_sessions')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`❌ Error deleting batch ${i / batchSize + 1}:`, deleteError);
        } else {
          console.log(`   ✅ Deleted batch ${i / batchSize + 1} (${batch.length} sessions)`);
        }
      }

      console.log('\n✅ Cleanup complete!');
      console.log(`   Deleted ${totalToDelete} duplicate sessions`);
      console.log(`   Kept ${duplicates.length} most recent sessions`);

      // Also clean up orphaned progress records
      console.log('\n🧹 Cleaning up orphaned progress records...');
      
      const { data: allProgress } = await supabase
        .from('student_progress')
        .select('*');

      const { data: allSessions } = await supabase
        .from('lesson_sessions')
        .select('sub_topic_id');

      const validSubTopicIds = new Set(allSessions.map(s => s.sub_topic_id));
      const orphanedProgress = allProgress.filter(p => !validSubTopicIds.has(p.sub_topic_id));

      if (orphanedProgress.length > 0) {
        console.log(`   Found ${orphanedProgress.length} orphaned progress records`);
        
        const { error: progressDeleteError } = await supabase
          .from('student_progress')
          .delete()
          .in('id', orphanedProgress.map(p => p.id));

        if (progressDeleteError) {
          console.error('   ❌ Error deleting orphaned progress:', progressDeleteError);
        } else {
          console.log(`   ✅ Deleted ${orphanedProgress.length} orphaned progress records`);
        }
      } else {
        console.log('   ✅ No orphaned progress records found');
      }

      readline.close();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupDuplicates();
