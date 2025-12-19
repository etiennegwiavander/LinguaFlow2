require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLessonOwnershipMismatch() {
  console.log('🔧 Fixing lesson ownership mismatch...\n');

  try {
    // Step 1: Find all tutors that don't exist in auth
    console.log('🔍 Finding orphaned tutors...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, email, name');
    
    if (tutorsError) {
      console.error('❌ Error fetching tutors:', tutorsError);
      return;
    }

    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const orphanedTutors = tutors.filter(t => !authUserIds.has(t.id));

    console.log(`📊 Found ${orphanedTutors.length} orphaned tutors (exist in tutors table but not in auth)`);

    if (orphanedTutors.length === 0) {
      console.log('✅ No orphaned tutors found');
      return;
    }

    // Step 2: For each orphaned tutor, find if there's a matching auth user by email
    console.log('\n🔄 Attempting to match orphaned tutors with auth users by email...');
    
    const fixes = [];
    
    for (const tutor of orphanedTutors) {
      const matchingAuthUser = authUsers.users.find(u => u.email === tutor.email);
      
      if (matchingAuthUser) {
        console.log(`✅ Found match: ${tutor.email}`);
        console.log(`  Tutor ID: ${tutor.id}`);
        console.log(`  Auth ID:  ${matchingAuthUser.id}`);
        
        fixes.push({
          oldTutorId: tutor.id,
          newTutorId: matchingAuthUser.id,
          email: tutor.email,
          name: tutor.name
        });
      } else {
        console.log(`❌ No auth user found for: ${tutor.email} (${tutor.id})`);
      }
    }

    if (fixes.length === 0) {
      console.log('\n❌ No matches found. Cannot fix automatically.');
      console.log('You may need to:');
      console.log('1. Create auth users for the orphaned tutors, or');
      console.log('2. Reassign lessons to existing auth users');
      return;
    }

    console.log(`\n🔧 Found ${fixes.length} fixable mismatches`);

    // Step 3: Ask for confirmation (in a real scenario, you'd want user input)
    console.log('\n⚠️  This will update lesson ownership. Proceeding with fixes...');

    for (const fix of fixes) {
      console.log(`\n🔄 Fixing ${fix.email}...`);
      
      // Update lessons to point to the correct tutor ID
      const { data: updatedLessons, error: updateError } = await supabase
        .from('lessons')
        .update({ tutor_id: fix.newTutorId })
        .eq('tutor_id', fix.oldTutorId)
        .select('id');

      if (updateError) {
        console.error(`❌ Error updating lessons for ${fix.email}:`, updateError);
        continue;
      }

      console.log(`✅ Updated ${updatedLessons.length} lessons`);

      // Update students to point to the correct tutor ID
      const { data: updatedStudents, error: studentsError } = await supabase
        .from('students')
        .update({ tutor_id: fix.newTutorId })
        .eq('tutor_id', fix.oldTutorId)
        .select('id');

      if (studentsError) {
        console.error(`❌ Error updating students for ${fix.email}:`, studentsError);
      } else {
        console.log(`✅ Updated ${updatedStudents.length} students`);
      }

      // Update the tutor record ID
      const { error: deleteTutorError } = await supabase
        .from('tutors')
        .delete()
        .eq('id', fix.oldTutorId);

      if (deleteTutorError) {
        console.error(`❌ Error deleting old tutor record:`, deleteTutorError);
      }

      // Insert new tutor record with correct ID
      const { error: insertTutorError } = await supabase
        .from('tutors')
        .insert({
          id: fix.newTutorId,
          email: fix.email,
          name: fix.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertTutorError) {
        console.error(`❌ Error creating new tutor record:`, insertTutorError);
      } else {
        console.log(`✅ Created new tutor record with correct ID`);
      }
    }

    console.log('\n🎉 Fix complete! Testing lesson sharing...');

    // Step 4: Test lesson sharing with the fixed data
    const { data: testLesson, error: testError } = await supabase
      .from('lessons')
      .select('id, tutor_id')
      .limit(1);

    if (testError || !testLesson.length) {
      console.log('❌ No lessons found for testing');
      return;
    }

    const lesson = testLesson[0];
    console.log(`🧪 Testing with lesson ${lesson.id} owned by ${lesson.tutor_id}`);

    // Verify the tutor exists in auth
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(lesson.tutor_id);
    
    if (authUserError) {
      console.log('❌ Tutor still not found in auth:', authUserError);
    } else {
      console.log('✅ Tutor found in auth:', authUser.email);
      
      // Test sharing
      const { data: shareResult, error: shareError } = await supabase
        .from('shared_lessons')
        .insert({
          lesson_id: lesson.id,
          student_name: 'Test Student',
          lesson_title: 'Test Lesson',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (shareError) {
        console.log('❌ Sharing still fails:', shareError);
      } else {
        console.log('✅ Sharing now works!', shareResult.id);
        
        // Clean up
        await supabase.from('shared_lessons').delete().eq('id', shareResult.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixLessonOwnershipMismatch();