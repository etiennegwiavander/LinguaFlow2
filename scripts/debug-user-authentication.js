require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserAuthentication() {
  console.log('🔍 Debugging user authentication and tutor relationships...\n');

  try {
    // Find the user who is likely trying to share lessons
    console.log('👤 Looking for the main user (vanshidy@gmail.com)...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    // First, let's see what users exist
    console.log('📋 All auth users:');
    authUsers.users.slice(0, 10).forEach(user => {
      console.log(`  ${user.email} (${user.id.substring(0, 8)}...)`);
    });

    // Find the tutor who owns the lessons we've been testing with
    console.log('\n🔍 Finding the tutor who owns the test lessons...');
    const { data: testLesson, error: testLessonError } = await supabase
      .from('lessons')
      .select(`
        id, 
        tutor_id,
        tutors!inner(id, email)
      `)
      .limit(1);

    if (testLessonError || !testLesson.length) {
      console.log('❌ Could not find test lesson:', testLessonError);
      return;
    }

    const lessonOwner = testLesson[0];
    console.log('📚 Test lesson owner:', {
      lesson_id: lessonOwner.id,
      tutor_id: lessonOwner.tutor_id,
      tutor_email: lessonOwner.tutors.email
    });

    // Find this tutor in auth users
    const mainUser = authUsers.users.find(u => u.id === lessonOwner.tutor_id);
    if (!mainUser) {
      console.log('❌ Lesson owner not found in auth users!');
      console.log('This is the root cause of the permission issue.');
      
      // Check if there's an auth user with the same email
      const authByEmail = authUsers.users.find(u => u.email === lessonOwner.tutors.email);
      if (authByEmail) {
        console.log('⚠️  Found auth user with same email but different ID:', {
          auth_id: authByEmail.id,
          tutor_id: lessonOwner.tutor_id,
          email: authByEmail.email
        });
      } else {
        console.log('❌ No auth user found with email:', lessonOwner.tutors.email);
      }
      return;
    }

    console.log('✅ Found main user in auth:', {
      id: mainUser.id,
      email: mainUser.email,
      created_at: mainUser.created_at
    });

    // Check if this user has a tutor record
    console.log('\n🎓 Checking tutor record...');
    const { data: tutorRecord, error: tutorError } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', mainUser.id)
      .single();

    if (tutorError) {
      console.log('❌ No tutor record found for auth user ID:', tutorError.message);
      
      // Check if there's a tutor with the same email
      const { data: tutorByEmail, error: emailError } = await supabase
        .from('tutors')
        .select('*')
        .eq('email', mainUser.email)
        .single();

      if (emailError) {
        console.log('❌ No tutor record found by email either:', emailError.message);
      } else {
        console.log('⚠️  Found tutor record by email but with different ID:', {
          tutor_id: tutorByEmail.id,
          auth_id: mainUser.id,
          email: tutorByEmail.email
        });
        
        // This is the problem! The tutor record has a different ID than the auth user
        console.log('\n🚨 PROBLEM IDENTIFIED:');
        console.log('The tutor record ID does not match the auth user ID!');
        console.log('This will cause RLS policies to fail.');
        
        // Check lessons owned by this tutor
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, tutor_id')
          .eq('tutor_id', tutorByEmail.id)
          .limit(3);

        if (lessonsError) {
          console.log('❌ Error fetching lessons:', lessonsError);
        } else {
          console.log(`\n📚 Found ${lessons.length} lessons owned by tutor ${tutorByEmail.id}`);
          console.log('But auth user ID is:', mainUser.id);
          console.log('RLS policy will fail because auth.uid() != lessons.tutor_id');
        }
      }
    } else {
      console.log('✅ Found matching tutor record:', {
        id: tutorRecord.id,
        email: tutorRecord.email,
        name: tutorRecord.name
      });
    }

    // Check all tutors to see the ID pattern
    console.log('\n📊 Analyzing tutor ID patterns...');
    const { data: allTutors, error: allTutorsError } = await supabase
      .from('tutors')
      .select('id, email, created_at')
      .limit(10);

    if (allTutorsError) {
      console.log('❌ Error fetching all tutors:', allTutorsError);
    } else {
      console.log('Sample tutors:');
      allTutors.forEach(tutor => {
        const authUser = authUsers.users.find(u => u.email === tutor.email);
        const idsMatch = authUser && authUser.id === tutor.id;
        console.log(`  ${tutor.email}: tutor_id=${tutor.id.substring(0, 8)}... auth_id=${authUser ? authUser.id.substring(0, 8) + '...' : 'NOT_FOUND'} match=${idsMatch ? '✅' : '❌'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUserAuthentication();