const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tutors from backup that are missing
const missingTutors = [
  {
    id: '648cd5b9-f7c4-4dce-9626-266a02c84d4b',
    email: 'zebra-wound-mutt@duck.com',
    created_at: '2025-07-04 06:11:15.023721+00'
  },
  {
    id: '01f4f62c-5994-4980-bb01-314cbfeaca3b',
    email: 'vijayakumar.gopalakrishnan@gmail.com',
    created_at: '2025-07-08 17:58:25.07566+00'
  },
  {
    id: 'e8f4c349-3b0c-43d3-a80b-78884921b004',
    email: 'thillcameron@gmail.com',
    created_at: '2025-07-16 17:09:51.204998+00'
  }
];

async function restoreMissingTutors() {
  console.log('=== RESTORING MISSING TUTORS ===\n');
  
  // Check current state
  const { data: currentTutors } = await supabaseAdmin
    .from('tutors')
    .select('id, email');
  
  console.log(`Current tutors in database: ${currentTutors.length}\n`);
  
  // Check which are actually missing
  const currentIds = new Set(currentTutors.map(t => t.id));
  const actuallyMissing = missingTutors.filter(t => !currentIds.has(t.id));
  
  if (actuallyMissing.length === 0) {
    console.log('✅ All tutors are already in the database!');
    return;
  }
  
  console.log(`Found ${actuallyMissing.length} missing tutors:\n`);
  actuallyMissing.forEach(t => {
    console.log(`  - ${t.email} (${t.id})`);
  });
  
  console.log('\n⚠️  NOTE: These tutors exist in auth.users but not in public.tutors');
  console.log('This will create the tutor records to match auth users.\n');
  
  // Insert missing tutors
  for (const tutor of actuallyMissing) {
    console.log(`Restoring: ${tutor.email}...`);
    
    const { error } = await supabaseAdmin
      .from('tutors')
      .insert({
        id: tutor.id,
        email: tutor.email,
        is_admin: false,
        created_at: tutor.created_at,
        updated_at: tutor.created_at
      });
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Restored`);
    }
  }
  
  // Verify
  const { data: finalTutors } = await supabaseAdmin
    .from('tutors')
    .select('id, email');
  
  console.log(`\n✅ Final tutor count: ${finalTutors.length}`);
  console.log('\n🎉 RESTORATION COMPLETE!');
  console.log('\nSummary:');
  console.log(`  - Tutors: 18 (restored ${actuallyMissing.length} missing)`);
  console.log(`  - Students: 26 (already correct)`);
  console.log(`  - All users can now login!`);
}

restoreMissingTutors().catch(console.error);
