// Diagnose authentication issues
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseAuth() {
  console.log('🔍 Diagnosing Authentication...\n');
  console.log('='.repeat(60));

  try {
    // 1. Check Supabase connection
    console.log('\n🔗 Testing Supabase Connection...');
    const { data: testData, error: testError } = await supabase
      .from('tutors')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection working');

    // 2. Check auth users
    console.log('\n👤 Checking Auth Users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`✅ Found ${users.length} auth users`);
    if (users.length > 0) {
      console.log('\nRecent users:');
      users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
        console.log(`     Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`     Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
      });
    }

    // 3. Check tutors table
    console.log('\n📋 Checking Tutors Table...');
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, email, subscription_status')
      .limit(5);

    if (tutorsError) {
      console.error('❌ Error fetching tutors:', tutorsError);
      return;
    }

    console.log(`✅ Found ${tutors.length} tutors`);
    tutors.forEach(tutor => {
      console.log(`   - ${tutor.email}: ${tutor.subscription_status || 'No subscription'}`);
    });

    // 4. Check environment variables
    console.log('\n🔐 Checking Environment Variables...');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    let allPresent = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        const value = process.env[varName];
        const display = varName.includes('KEY') ? `${value.substring(0, 20)}...` : value;
        console.log(`✅ ${varName}: ${display}`);
      } else {
        console.log(`❌ ${varName}: NOT SET`);
        allPresent = false;
      }
    });

    // 5. Test session creation
    console.log('\n🎫 Testing Session Creation...');
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`Testing with user: ${testUser.email}`);
      
      // Note: In production, sessions are created client-side
      console.log('✅ Session creation happens client-side in the browser');
      console.log('   Check browser console for auth state');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Diagnosis Summary:\n');

    if (allPresent && users.length > 0) {
      console.log('✅ Supabase configured correctly');
      console.log('✅ Auth users exist');
      console.log('✅ Tutors table accessible');
      console.log('\n💡 If you\'re still having auth issues:');
      console.log('   1. Clear browser cookies and localStorage');
      console.log('   2. Log out and log back in');
      console.log('   3. Check browser console for errors');
      console.log('   4. Verify you\'re using the correct email/password');
    } else {
      console.log('⚠️  Some issues detected');
      if (!allPresent) {
        console.log('   - Missing environment variables');
      }
      if (users.length === 0) {
        console.log('   - No users found - create an account first');
      }
    }

  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error);
  }
}

diagnoseAuth();
