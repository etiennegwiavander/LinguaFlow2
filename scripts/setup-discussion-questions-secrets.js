#!/usr/bin/env node

/**
 * Setup Discussion Questions Secrets
 * 
 * This script helps you set up the required secrets for the
 * discussion questions Edge Function in Supabase.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔧 Discussion Questions Secrets Setup\n');
console.log('=' .repeat(60));

// Check if Gemini API key exists in .env.local
const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!geminiKey) {
  console.log('❌ GEMINI_API_KEY not found in .env.local');
  console.log('\n💡 Please add your Gemini API key to .env.local:');
  console.log('   GEMINI_API_KEY=your-api-key-here');
  console.log('\n📝 Get a free API key at: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

console.log('✅ Found GEMINI_API_KEY in .env.local');
console.log(`   Key: ${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 4)}`);

console.log('\n' + '='.repeat(60));
console.log('📋 SETUP INSTRUCTIONS');
console.log('='.repeat(60));

console.log('\n🔐 You need to set this secret in Supabase Edge Functions.');
console.log('\nOption 1: Using Supabase CLI (Recommended)');
console.log('─'.repeat(60));
console.log('\n1. Make sure Supabase CLI is installed:');
console.log('   npm install -g supabase');
console.log('\n2. Login to Supabase:');
console.log('   supabase login');
console.log('\n3. Link your project:');
console.log('   supabase link --project-ref YOUR_PROJECT_REF');
console.log('\n4. Set the secret:');
console.log(`   supabase secrets set GEMINI_API_KEY="${geminiKey}"`);
console.log('\n5. Verify the secret:');
console.log('   supabase secrets list');

console.log('\n\nOption 2: Using Supabase Dashboard');
console.log('─'.repeat(60));
console.log('\n1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions');
console.log('2. Click on "Edge Functions" in the sidebar');
console.log('3. Click on "Secrets" tab');
console.log('4. Add a new secret:');
console.log('   Name: GEMINI_API_KEY');
console.log(`   Value: ${geminiKey}`);
console.log('5. Click "Save"');

console.log('\n\nOption 3: Quick PowerShell Command (Windows)');
console.log('─'.repeat(60));
console.log('\nRun this command in PowerShell:');
console.log(`\nsupabase secrets set GEMINI_API_KEY="${geminiKey}"`);

console.log('\n\n' + '='.repeat(60));
console.log('🧪 TESTING');
console.log('='.repeat(60));

console.log('\nAfter setting the secret, test it with:');
console.log('   node scripts/test-discussion-questions-fresh-generation.js');

console.log('\n\n' + '='.repeat(60));
console.log('📚 ADDITIONAL INFORMATION');
console.log('='.repeat(60));

console.log('\n🔍 Why is this needed?');
console.log('   Supabase Edge Functions run in Deno (not Node.js) and don\'t');
console.log('   have access to your local .env.local file. Secrets must be');
console.log('   set in Supabase\'s environment.');

console.log('\n🔒 Is it secure?');
console.log('   Yes! Supabase secrets are encrypted and only accessible to');
console.log('   your Edge Functions. They\'re never exposed to the client.');

console.log('\n💰 Gemini API Costs:');
console.log('   • Gemini 1.5 Flash: FREE up to 15 requests/minute');
console.log('   • Perfect for discussion questions generation');
console.log('   • No credit card required for free tier');

console.log('\n🔄 Alternative Models:');
console.log('   If you prefer, you can also use:');
console.log('   • OpenRouter (set OPENROUTER_API_KEY)');
console.log('   • OpenAI (set OPENAI_API_KEY)');
console.log('   The system will fall back to emergency questions if all fail.');

console.log('\n\n✅ Next Steps:');
console.log('   1. Set the GEMINI_API_KEY secret in Supabase (choose option above)');
console.log('   2. Wait 1-2 minutes for the secret to propagate');
console.log('   3. Run: node scripts/test-discussion-questions-fresh-generation.js');
console.log('   4. Verify questions are contextual and personalized');

console.log('\n');
