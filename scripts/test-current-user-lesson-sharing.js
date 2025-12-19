require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCurrentUserLessonSharing() {
  console.log('🧪 Testing lesson sharing with current user authentication...\n');

  try {
    // You'll need to replace this with actual user credentials
    // For testing, let's try to sign in with a known user
    console.log('🔐 Please provide user credentials for testing:');
    console.log('This script needs to be run with actual user authentication.');
    console.log('Let me check what lessons exist and their ownership...\n');

    // Use service role to check lessons and their tutors
    const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Get a sample lesson and its tutor
    const { data: lessons, error: lessonsError } = await serviceSupabase
      .from('lessons')
      .select(`
        id, 
        tutor_id, 
        student_id,
        tutors!inner(id, email)
      `)
      .limit(3);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    console.log('📚 Sample lessons with tutor info:');
    lessons.forEach(lesson => {
      console.log(`  Lesson ${lesson.id}`);
      console.log(`  Tutor ID: ${lesson.tutor_id}`);
      console.log(`  Tutor Email: ${lesson.tutors.email}`);
      console.log('');
    });

    // Check if these tutors exist in auth
    for (const lesson of lessons) {
      const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(lesson.tutor_id);
      
      if (authError) {
        console.log(`❌ Tutor ${lesson.tutor_id} (${lesson.tutors.email}) not found in auth:`, authError.message);
      } else {
        console.log(`✅ Tutor ${lesson.tutor_id} (${lesson.tutors.email}) exists in auth`);
        
        // Test lesson sharing for this user
        console.log(`🧪 Testing lesson sharing for lesson ${lesson.id}...`);
        
        // Create a client with this user's session (simulated)
        // In a real scenario, you'd need the user to be actually logged in
        const { data: shareResult, error: shareError } = await serviceSupabase
          .from('shared_lessons')
          .insert({
            lesson_id: lesson.id,
            student_name: 'Test Student',
            lesson_title: 'Test Lesson Share',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (shareError) {
          console.log(`❌ Share failed for lesson ${lesson.id}:`, shareError);
        } else {
          console.log(`✅ Share succeeded for lesson ${lesson.id}:`, shareResult.id);
          
          // Clean up
          await serviceSupabase.from('shared_lessons').delete().eq('id', shareResult.id);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCurrentUserLessonSharing();