require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAuthUsersToTutors() {
  console.log('🔄 Syncing auth users to tutors table...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    // Get all existing tutors
    const { data: existingTutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, email');

    if (tutorsError) {
      console.error('❌ Error fetching tutors:', tutorsError);
      return;
    }

    console.log(`📊 Found ${existingTutors.length} existing tutors`);

    const existingTutorIds = new Set(existingTutors.map(t => t.id));
    const existingTutorEmails = new Set(existingTutors.map(t => t.email));

    // Find auth users that don't have tutor records
    const missingTutors = authUsers.users.filter(user => 
      !existingTutorIds.has(user.id) && !existingTutorEmails.has(user.email)
    );

    console.log(`🔍 Found ${missingTutors.length} auth users missing from tutors table`);

    if (missingTutors.length === 0) {
      console.log('✅ All auth users already have tutor records');
      return;
    }

    // Create tutor records for missing users
    const tutorsToInsert = missingTutors.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    }));

    console.log('📝 Creating tutor records for:', tutorsToInsert.map(t => ({ id: t.id, email: t.email })));

    const { data: insertedTutors, error: insertError } = await supabase
      .from('tutors')
      .insert(tutorsToInsert)
      .select();

    if (insertError) {
      console.error('❌ Error inserting tutors:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${insertedTutors.length} tutor records`);

    // Verify the sync
    const { data: updatedTutors, error: verifyError } = await supabase
      .from('tutors')
      .select('id, email');

    if (verifyError) {
      console.error('❌ Error verifying sync:', verifyError);
      return;
    }

    console.log(`🎉 Sync complete! Total tutors: ${updatedTutors.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

syncAuthUsersToTutors();