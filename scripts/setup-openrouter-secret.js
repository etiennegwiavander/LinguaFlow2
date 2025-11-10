#!/usr/bin/env node

/**
 * Setup OpenRouter Secret for Discussion Questions
 * This script helps you set the OPENROUTER_API_KEY in Supabase
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔐 OpenRouter Secret Setup for Discussion Questions\n');
console.log('='.repeat(60));

// Check if OPENROUTER_API_KEY exists in .env.local
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!openrouterKey) {
  console.log('❌ OPENROUTER_API_KEY not found in .env.local');
  console.log('\n💡 Please add your OpenRouter API key to .env.local:');
  console.log('   OPENROUTER_API_KEY=your-api-key-here');
  process.exit(1);
}

console.log('✅ Found OPENROUTER_API_KEY in .env.local');
console.log(`   Key: ${openrouterKey.substring(0, 10)}...${openrouterKey.substring(openrouterKey.length - 4)}`);

console.log('\n' + '='.repeat(60));
console.log('📋 SETUP INSTRUCTIONS');
console.log('='.repeat(60));

console.log('\n🔐 You need to set this secret in Supabase Edge Functions.');

console.log('\n\nOption 1: Using Supabase CLI (Recommended)');
console.log('-'.repeat(60));
console.log('\n1. Make sure Supabase CLI is installed:');
console.log('   npm install -g supabase');
console.log('\n2. Login to Supabase:');
console.log('   supabase login');
console.log('\n3. Link your project (if not already linked):');
console.log('   supabase link --project-ref YOUR_PROJECT_REF');
console.log('\n4. Set the secret:');
console.log(`   supabase secrets set OPENROUTER_API_KEY="${openrouterKey}"`);
console.log('\n5. Verify the secret:');
console.log('   supabase secrets list');

console.log('\n\nOption 2: Using Supabase Dashboard');
console.log('-'.repeat(60));
console.log('\n1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions');
console.log('2. Click on "Edge Functions" in the sidebar');
console.log('3. Click on "Secrets" tab');
console.log('4. Add a new secret:');
console.log('   Name: OPENROUTER_API_KEY');
console.log(`   Value: ${openrouterKey}`);
console.log('5. Click "Save"');

console.log('\n\n' + '='.repeat(60));
console.log('🧪 TESTING');
console.log('='.repeat(60));

console.log('\nAfter setting the secret:');
console.log('   1. Wait 1-2 minutes for propagation');
console.log('   2. Run: node scripts/test-discussion-deepseek.js');
console.log('   3. Verify questions are contextual and specific');

console.log('\n\n' + '='.repeat(60));
console.log('📚 WHY THIS IS NEEDED');
console.log('='.repeat(60));

console.log('\n🔍 Supabase Edge Functions run in Deno (not Node.js) and don\'t');
console.log('   have access to your local .env.local file. Secrets must be');
console.log('   set in Supabase\'s environment.');

console.log('\n🔒 Your API key will be encrypted and only accessible to');
console.log('   your Edge Functions. It\'s never exposed to the client.');

console.log('\n💰 DeepSeek via OpenRouter is FREE:');
console.log('   • 10 requests per minute');
console.log('   • No credit card required');
console.log('   • Perfect for discussion questions');

console.log('\n\n✅ Next Steps:');
console.log('   1. Set the OPENROUTER_API_KEY secret in Supabase (choose option above)');
console.log('   2. Wait 1-2 minutes for the secret to propagate');
console.log('   3. Run: node scripts/test-discussion-deepseek.js');
console.log('   4. Verify questions are contextual and personalized');

console.log('\n');
