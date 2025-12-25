/**
 * Fix the remaining 2 progress records that still have timestamps
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRemaining() {
  console.log('🔧 Fixing remaining timestamp records...\n');

  // Delete the old records with timestamps
  const oldIds = [
    'cb2b5b55-b697-4bc5-adb6-87e18e825ce8_1766611138579_subtopic_1_2',
    'cb2b5b55-b697-4bc5-adb6-87e18e825ce8_1766611138579_subtopic_1_1'
  ];

  for (const oldId of oldIds) {
    const { error } = await supabase
      .from('student_progress')
      .delete()
      .eq('sub_topic_id', oldId);

    if (error) {
      console.log(`❌ Error deleting ${oldId}:`, error.message);
    } else {
      console.log(`✅ Deleted old record: ${oldId}`);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

fixRemaining();
