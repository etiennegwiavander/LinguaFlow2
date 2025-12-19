require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reassignLessonsToExistingUser() {
  console.log('🔄 Reassigning lessons to an existing auth user...\n');

  try {
    // Step 1: Find an existing auth user to reassign lessons to
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    if (authUsers.users.length === 0) {
      console.log('❌ No auth users found');
      return;
    }

    // Pick the first auth user as the target
    const targetUser = authUsers.users[0];
    console.log('🎯 Target user for reassignment:', {
      id: targetUser.id,
      email: targetUser.email
    });

    // Step 2: Check if this user already has a tutor record
    const { data: existingTutor, error: tutorError } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', targetUser.id)
      .single();

    if (tutorError && tutorError.code !== 'PGRST116') {
      console.error('❌ Error checking existing tutor:', tutorError);
      return;
    }

    if (!existingTutor) {
      console.log('📝 Creating tutor record for target user...');
      const { error: insertError } = await supabase
        .from('tutors')
        .insert({
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.user_metadata?.full_name || targetUser.email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating tutor record:', insertError);
        return;
      }
      console.log('✅ Created tutor record');
    } else {
      console.log('✅ Tutor record already exists');
    }

    // Step 3: Find lessons owned by orphaned tutors
    const { data: orphanedLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id, 
        tutor_id, 
        student_id,
        tutors!inner(email)
      `)
      .eq('tutors.email', 'vanshidy@gmail.com'); // Focus on the main problematic tutor

    if (lessonsError) {
      console.error('❌ Error fetching orphaned lessons:', lessonsError);
      return;
    }

    console.log(`📚 Found ${orphanedLessons.length} lessons to reassign`);

    if (orphanedLessons.length === 0) {
      console.log('✅ No lessons need reassignment');
      return;
    }

    // Step 4: Reassign lessons
    console.log('🔄 Reassigning lessons...');
    const { data: updatedLessons, error: updateError } = await supabase
      .from('lessons')
      .update({ tutor_id: targetUser.id })
      .in('id', orphanedLessons.map(l => l.id))
      .select('id');

    if (updateError) {
      console.error('❌ Error updating lessons:', updateError);
      return;
    }

    console.log(`✅ Reassigned ${updatedLessons.length} lessons to ${targetUser.email}`);

    // Step 5: Reassign students as well
    const studentIds = [...new Set(orphanedLessons.map(l => l.student_id))];
    if (studentIds.length > 0) {
      console.log('👥 Reassigning students...');
      const { data: updatedStudents, error: studentsError } = await supabase
        .from('students')
        .update({ tutor_id: targetUser.id })
        .in('id', studentIds)
        .select('id');

      if (studentsError) {
        console.error('❌ Error updating students:', studentsError);
      } else {
        console.log(`✅ Reassigned ${updatedStudents.length} students`);
      }
    }

    // Step 6: Test lesson sharing
    console.log('\n🧪 Testing lesson sharing with reassigned lesson...');
    const testLesson = updatedLessons[0];
    
    const { data: shareResult, error: shareError } = await supabase
      .from('shared_lessons')
      .insert({
        lesson_id: testLesson.id,
        student_name: 'Test Student',
        lesson_title: 'Test Lesson Share',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (shareError) {
      console.error('❌ Sharing still fails:', shareError);
    } else {
      console.log('✅ Lesson sharing now works!');
      console.log('📤 Share URL:', `http://localhost:3000/shared-lesson/${shareResult.id}`);
      
      // Clean up test
      await supabase.from('shared_lessons').delete().eq('id', shareResult.id);
      console.log('🧹 Cleaned up test share');
    }

    console.log('\n🎉 Reassignment complete!');
    console.log(`📧 You can now log in as ${targetUser.email} to test lesson sharing`);
    console.log('🔑 Note: You may need to reset the password for this user if you don\'t know it');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

reassignLessonsToExistingUser();