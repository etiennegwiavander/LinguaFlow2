#!/usr/bin/env node

/**
 * Check if required environment variables are set for email functionality
 */

console.log('🔍 Checking Email System Environment Variables...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SERVICE_ROLE_KEY'
];

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`);
  } else {
    console.log(`❌ ${varName}: Not set`);
    allSet = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allSet) {
  console.log('🎉 All required environment variables are set!');
  console.log('\n📝 Note: Make sure your .env.local file contains:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('   - SERVICE_ROLE_KEY');
} else {
  console.log('⚠️  Some environment variables are missing!');
  console.log('\n📝 Please add the missing variables to your .env.local file');
  console.log('   You can find these values in your Supabase project settings');
}

console.log('\n🚀 Once all variables are set, the EmailTestingInterface should work correctly!');