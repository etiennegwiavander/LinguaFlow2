require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

async function testLessonSharingUISimulation() {
  console.log('🎭 Simulating lesson sharing from UI perspective...\n');

  const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Step 1: Get a real lesson that should be shareable
    console.log('📚 Finding a lesson to test with...');
    const { data: lessons, error: lessonsError } = await serviceSupabase
      .from('lessons')
      .select(`
        id, 
        tutor_id, 
        student_id,
        interactive_lesson_content,
        tutors!inner(id, email),
        students!inner(id, name)
      `)
      .limit(1);

    if (lessonsError || !lessons.length) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    const testLesson = lessons[0];
    console.log('✅ Found test lesson:', {
      id: testLesson.id,
      tutor_id: testLesson.tutor_id,
      tutor_email: testLesson.tutors.email,
      student_name: testLesson.students.name
    });

    // Step 2: Check if the tutor exists in auth
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(testLesson.tutor_id);
    
    if (authError) {
      console.error('❌ Tutor not found in auth:', authError);
      return;
    }

    console.log('✅ Tutor exists in auth:', authUser.email);

    // Step 3: Create a client session as if the user is logged in
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Simulate the exact data structure that the UI sends
    const shareableData = {
      lesson_id: testLesson.id,
      student_name: testLesson.students?.name || 'Student',
      lesson_title: testLesson.interactive_lesson_content?.name || 
                   testLesson.interactive_lesson_content?.selected_sub_topic?.title || 
                   'Interactive Lesson',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    };

    console.log('\n🧪 Testing lesson sharing with exact UI data structure:');
    console.log('Data to insert:', shareableData);

    // Step 4: Try to insert without authentication (this should fail)
    console.log('\n❌ Testing without authentication (should fail):');
    const { data: unauthResult, error: unauthError } = await userSupabase
      .from('shared_lessons')
      .insert(shareableData)
      .select()
      .single();

    if (unauthError) {
      console.log('Expected failure:', unauthError.message);
    } else {
      console.log('Unexpected success:', unauthResult);
    }

    // Step 5: Try with service role (simulating proper authentication)
    console.log('\n✅ Testing with service role (simulating proper auth):');
    const { data: authResult, error: authResultError } = await serviceSupabase
      .from('shared_lessons')
      .insert(shareableData)
      .select()
      .single();

    if (authResultError) {
      console.error('❌ Failed even with service role:', authResultError);
      
      // Let's check the RLS policies
      console.log('\n🔍 Checking RLS policies...');
      const { data: policies, error: policiesError } = await serviceSupabase
        .rpc('get_policies', { table_name: 'shared_lessons' });
      
      if (policiesError) {
        console.log('Could not fetch policies:', policiesError);
      } else {
        console.log('RLS Policies:', policies);
      }
      
    } else {
      console.log('✅ Success with service role:', {
        id: authResult.id,
        lesson_id: authResult.lesson_id,
        student_name: authResult.student_name,
        lesson_title: authResult.lesson_title
      });

      // Generate the share URL
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared-lesson/${authResult.id}`;
      console.log('📤 Generated share URL:', shareUrl);

      // Clean up
      await serviceSupabase.from('shared_lessons').delete().eq('id', authResult.id);
      console.log('🧹 Cleaned up test record');
    }

    // Step 6: Check what happens when a user tries to share a lesson they don't own
    console.log('\n🚫 Testing ownership validation...');
    
    // Get a different tutor's lesson
    const { data: otherLessons, error: otherError } = await serviceSupabase
      .from('lessons')
      .select('id, tutor_id')
      .neq('tutor_id', testLesson.tutor_id)
      .limit(1);

    if (otherError || !otherLessons.length) {
      console.log('No other tutor lessons found for ownership test');
    } else {
      const otherLesson = otherLessons[0];
      console.log('Testing with lesson from different tutor:', otherLesson.id);

      const invalidShareData = {
        ...shareableData,
        lesson_id: otherLesson.id
      };

      const { data: invalidResult, error: invalidError } = await serviceSupabase
        .from('shared_lessons')
        .insert(invalidShareData)
        .select()
        .single();

      if (invalidError) {
        console.log('✅ Correctly blocked sharing of other tutor\'s lesson:', invalidError.message);
      } else {
        console.log('❌ Unexpectedly allowed sharing other tutor\'s lesson:', invalidResult);
        // Clean up if it somehow succeeded
        await serviceSupabase.from('shared_lessons').delete().eq('id', invalidResult.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLessonSharingUISimulation();