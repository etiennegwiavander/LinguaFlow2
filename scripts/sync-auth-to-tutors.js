const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAuthToTutors() {
  console.log('=== SYNCING AUTH USERS TO TUTORS TABLE ===\n');
  
  // Get all auth users
  console.log('Fetching auth users...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Error fetching auth users:', authError.message);
    console.log('\nMake sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    return;
  }
  
  console.log(`Found ${users.length} auth users\n`);
  
  for (const user of users) {
    console.log(`Processing: ${user.email}`);
    
    // Check if tutor record exists
    const { data: existingTutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (existingTutor) {
      console.log('  ✅ Tutor record already exists');
      continue;
    }
    
    // Create tutor record
    const { error: insertError } = await supabase
      .from('tutors')
      .insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.email.split('@')[0],
        last_name: user.user_metadata?.last_name || '',
        created_at: user.created_at
      });
    
    if (insertError) {
      console.log('  ❌ Error creating tutor:', insertError.message);
    } else {
      console.log('  ✅ Tutor record created');
    }
  }
  
  // Verify sync
  console.log('\n=== VERIFICATION ===');
  const { data: tutors } = await supabase
    .from('tutors')
    .select('id, email, first_name, last_name');
  
  console.log(`\nTutors in database: ${tutors.length}`);
  tutors.forEach(t => {
    console.log(`  - ${t.email} (${t.first_name} ${t.last_name})`);
  });
  
  console.log('\n✅ Sync complete! You can now test password reset.');
}

syncAuthToTutors();
