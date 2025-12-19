require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseLessonSharingPermission() {
  console.log('🔍 Diagnosing lesson sharing permission issue...\n');

  try {
    // Get all lessons and their tutor relationships
    console.log('📚 Checking lessons table structure and data:');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, tutor_id, student_id, created_at')
      .limit(5);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    console.log('Lessons sample:', lessons);

    // Get all tutors
    console.log('\n👨‍🏫 Checking tutors table:');
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, email, created_at')
      .limit(5);

    if (tutorsError) {
      console.error('❌ Error fetching tutors:', tutorsError);
      return;
    }

    console.log('Tutors sample:', tutors);

    // Check auth users
    console.log('\n🔐 Checking auth users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log('Auth users sample:', authUsers.users.slice(0, 3).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at
    })));

    // Check if there are any mismatches between auth.users and tutors
    console.log('\n🔍 Checking for ID mismatches:');
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const tutorIds = new Set(tutors.map(t => t.id));

    console.log('Auth user IDs:', Array.from(authUserIds).slice(0, 3));
    console.log('Tutor IDs:', Array.from(tutorIds).slice(0, 3));

    const missingInTutors = authUsers.users.filter(u => !tutorIds.has(u.id));
    const missingInAuth = tutors.filter(t => !authUserIds.has(t.id));

    if (missingInTutors.length > 0) {
      console.log('⚠️  Auth users not in tutors table:', missingInTutors.map(u => ({ id: u.id, email: u.email })));
    }

    if (missingInAuth.length > 0) {
      console.log('⚠️  Tutors not in auth users:', missingInAuth.map(t => ({ id: t.id, email: t.email })));
    }

    // Check shared_lessons table structure
    console.log('\n📤 Checking shared_lessons table:');
    const { data: sharedLessons, error: sharedError } = await supabase
      .from('shared_lessons')
      .select('*')
      .limit(3);

    if (sharedError) {
      console.error('❌ Error fetching shared lessons:', sharedError);
    } else {
      console.log('Shared lessons sample:', sharedLessons);
    }

    // Test the RLS policy by trying to create a shared lesson
    console.log('\n🧪 Testing RLS policy with a sample lesson:');
    if (lessons.length > 0) {
      const testLesson = lessons[0];
      console.log('Testing with lesson:', { id: testLesson.id, tutor_id: testLesson.tutor_id });

      // Try to insert as service role (should work)
      const { data: testInsert, error: testError } = await supabase
        .from('shared_lessons')
        .insert({
          lesson_id: testLesson.id,
          student_name: 'Test Student',
          lesson_title: 'Test Lesson',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (testError) {
        console.error('❌ Test insert failed:', testError);
      } else {
        console.log('✅ Test insert succeeded:', testInsert);
        
        // Clean up test record
        await supabase.from('shared_lessons').delete().eq('id', testInsert.id);
        console.log('🧹 Cleaned up test record');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseLessonSharingPermission();