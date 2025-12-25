/**
 * Cleanup duplicate progress records
 * Keep only the most recent one for each student + sub_topic combination
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate progress records...\n');

  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .order('completion_date', { ascending: false });

  // Group by student_id + sub_topic_id
  const grouped = {};
  progress.forEach(p => {
    const key = `${p.student_id}_${p.sub_topic_id}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(p);
  });

  // Find duplicates
  const duplicates = Object.entries(grouped).filter(([_, records]) => records.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`Found ${duplicates.length} duplicate groups:\n`);

  const toDelete = [];
  for (const [key, records] of duplicates) {
    const keep = records[0]; // Most recent
    const deleteRecords = records.slice(1);
    
    console.log(`Sub-topic: "${keep.sub_topic_title}"`);
    console.log(`  Keep: ${new Date(keep.completion_date).toLocaleString()}`);
    console.log(`  Delete: ${deleteRecords.length} older record(s)`);
    
    toDelete.push(...deleteRecords.map(r => r.id));
  }

  console.log(`\nTotal records to delete: ${toDelete.length}`);

  // Delete duplicates
  for (const id of toDelete) {
    await supabase
      .from('student_progress')
      .delete()
      .eq('id', id);
  }

  console.log(`\n✅ Deleted ${toDelete.length} duplicate records`);
}

cleanupDuplicates();
