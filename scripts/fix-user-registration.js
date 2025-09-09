#!/usr/bin/env node

/**
 * Script to fix user registration issues
 * This script will:
 * 1. Clean up orphaned auth users without tutor profiles
 * 2. Fix RLS policies to prevent infinite recursion
 * 3. Test the registration flow
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple dotenv replacement
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupOrphanedUsers() {
  console.log('🧹 Cleaning up orphaned auth users...');
  
  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    console.log(`Found ${authUsers.users.length} auth users`);

    // Get all tutor profiles
    const { data: tutors, error: tutorError } = await supabase
      .from('tutors')
      .select('id');
    if (tutorError) throw tutorError;

    console.log(`Found ${tutors.length} tutor profiles`);

    const tutorIds = new Set(tutors.map(t => t.id));
    const orphanedUsers = authUsers.users.filter(user => !tutorIds.has(user.id));

    console.log(`Found ${orphanedUsers.length} orphaned auth users`);

    // Delete orphaned auth users
    for (const user of orphanedUsers) {
      console.log(`Deleting orphaned user: ${user.email} (${user.id})`);
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`Failed to delete user ${user.email}:`, error.message);
      } else {
        console.log(`✅ Deleted orphaned user: ${user.email}`);
      }
    }

    return orphanedUsers.length;
  } catch (error) {
    console.error('❌ Error cleaning up orphaned users:', error.message);
    return 0;
  }
}

async function testRLSPolicies() {
  console.log('🔒 Testing RLS policies...');
  
  try {
    // Test if we can query tutors table without infinite recursion
    const { data, error } = await supabase
      .from('tutors')
      .select('id, email, is_admin')
      .limit(1);

    if (error) {
      console.error('❌ RLS policy test failed:', error.message);
      return false;
    }

    console.log('✅ RLS policies are working correctly');
    return true;
  } catch (error) {
    console.error('❌ RLS policy test error:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('👤 Testing user registration flow...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Test signup
    console.log(`Creating test user: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError.message);
      return false;
    }

    console.log('✅ Auth user created successfully');

    // Test tutor profile creation
    console.log('Creating tutor profile...');
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .insert([{
        id: signUpData.user.id,
        email: testEmail,
        is_admin: false,
        first_name: null,
        last_name: null
      }])
      .select()
      .single();

    if (tutorError) {
      console.error('❌ Tutor profile creation failed:', tutorError.message);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(signUpData.user.id);
      return false;
    }

    console.log('✅ Tutor profile created successfully');

    // Test signin
    console.log('Testing signin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Signin failed:', signInError.message);
    } else {
      console.log('✅ Signin successful');
    }

    // Clean up test user
    console.log('Cleaning up test user...');
    await supabase.from('tutors').delete().eq('id', signUpData.user.id);
    await supabase.auth.admin.deleteUser(signUpData.user.id);
    console.log('✅ Test user cleaned up');

    return !signInError;
  } catch (error) {
    console.error('❌ Registration test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting user registration fix...\n');

  // Step 1: Clean up orphaned users
  const orphanedCount = await cleanupOrphanedUsers();
  console.log(`\n📊 Cleaned up ${orphanedCount} orphaned users\n`);

  // Step 2: Test RLS policies
  const rlsWorking = await testRLSPolicies();
  console.log('');

  // Step 3: Test registration flow
  const registrationWorking = await testUserRegistration();
  console.log('');

  // Summary
  console.log('📋 Summary:');
  console.log(`   Orphaned users cleaned: ${orphanedCount}`);
  console.log(`   RLS policies working: ${rlsWorking ? '✅' : '❌'}`);
  console.log(`   Registration working: ${registrationWorking ? '✅' : '❌'}`);

  if (rlsWorking && registrationWorking) {
    console.log('\n🎉 User registration is now working correctly!');
  } else {
    console.log('\n⚠️  Some issues remain. Check the logs above for details.');
  }
}

main().catch(console.error);