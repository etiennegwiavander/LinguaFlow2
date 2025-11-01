const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestUser() {
  const testEmail = 'vanshidy@gmail.com';
  const testPassword = 'TestPassword123!';
  
  console.log('=== CREATING TEST USER ===\n');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}\n`);
  
  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating Supabase Auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        console.log('\n✅ User already exists! You can use this email for password reset.');
        console.log('Try the forgot password flow at: http://localhost:3000/auth/forgot-password');
        return;
      }
      
      throw authError;
    }
    
    console.log('✅ Auth user created:', authData.user?.id);
    
    // Step 2: Create tutor record
    console.log('\nStep 2: Creating tutor record...');
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .insert({
        id: authData.user.id,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (tutorError) {
      console.log('❌ Tutor error:', tutorError.message);
      throw tutorError;
    }
    
    console.log('✅ Tutor record created:', tutorData.id);
    
    console.log('\n=== SUCCESS ===');
    console.log('Test user created successfully!');
    console.log('\nYou can now:');
    console.log('1. Login at: http://localhost:3000/auth/login');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n2. Test password reset at: http://localhost:3000/auth/forgot-password');
    console.log(`   Email: ${testEmail}`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

createTestUser();
