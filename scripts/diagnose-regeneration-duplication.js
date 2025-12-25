/**
 * Diagnostic Script: Check for duplicate lesson sessions on regeneration
 * 
 * This script checks if regenerating lessons creates duplicate entries
 * in the lesson_sessions table instead of updating existing ones.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDuplication() {
  console.log('🔍 Checking for duplicate lesson sessions...\n');

  try {
    // Get all lesson sessions grouped by student_id and sub_topic_data->title
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
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} sub-topics with multiple sessions:\n`);

    for (const [key, sessions] of duplicates) {
      const [studentId, title] = key.split('_');
      console.log(`\n📝 Sub-topic: "${title}"`);
      console.log(`   Student ID: ${studentId.substring(0, 8)}...`);
      console.log(`   Number of sessions: ${sessions.length}`);
      
      sessions.forEach((session, index) => {
        console.log(`\n   Session ${index + 1}:`);
        console.log(`   - ID: ${session.id.substring(0, 8)}...`);
        console.log(`   - Sub-topic ID: ${session.sub_topic_id}`);
        console.log(`   - Created: ${new Date(session.created_at).toLocaleString()}`);
        console.log(`   - Completed: ${new Date(session.completed_at).toLocaleString()}`);
      });

      // Check if there are completion records for each sub_topic_id
      console.log(`\n   Checking completion records:`);
      for (const session of sessions) {
        const { data: progress } = await supabase
          .from('student_progress')
          .select('*')
          .eq('sub_topic_id', session.sub_topic_id);
        
        console.log(`   - ${session.sub_topic_id}: ${progress?.length || 0} completion record(s)`);
      }
    }

    console.log('\n\n💡 DIAGNOSIS:');
    console.log('   If you see multiple sessions for the same sub-topic,');
    console.log('   it means regeneration is creating NEW sessions instead of');
    console.log('   updating existing ones. This causes completion status to');
    console.log('   be tied to old sub_topic_ids that no longer exist in the UI.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnoseDuplication();
