/**
 * Diagnostic Script for Vocabulary Flashcards Connection Issues
 * 
 * This script helps diagnose why vocabulary generation is failing with connection errors
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

console.log('🔍 VOCABULARY FLASHCARDS CONNECTION DIAGNOSTIC');
console.log('='.repeat(60));
console.log('');

// Step 1: Check environment variables
console.log('📋 Step 1: Checking Environment Variables');
console.log('-'.repeat(60));
console.log(`✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ GEMINI_API_KEY: ${geminiApiKey ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials');
  process.exit(1);
}

// Step 2: Test Supabase connection
console.log('📋 Step 2: Testing Supabase Connection');
console.log('-'.repeat(60));

const supabase = createClient(supabaseUrl, supabaseServiceKey);

try {
  // Test basic database connection
  const { data, error } = await supabase.from('students').select('id').limit(1);
  
  if (error) {
    console.log('❌ Database connection failed:', error.message);
  } else {
    console.log('✅ Database connection successful');
  }
} catch (error) {
  console.log('❌ Database connection error:', error.message);
}
console.log('');

// Step 3: Check if Edge Function exists
console.log('📋 Step 3: Checking Edge Function Deployment');
console.log('-'.repeat(60));
console.log('Attempting to call generate-vocabulary-words Edge Function...');
console.log('');

try {
  const testPayload = {
    student_id: 'test-diagnostic',
    count: 1,
    exclude_words: [],
    difficulty: 'B1'
  };

  const { data, error } = await supabase.functions.invoke('generate-vocabulary-words', {
    body: testPayload
  });

  if (error) {
    console.log('❌ Edge Function Error:');
    console.log('   Status:', error.status || 'Unknown');
    console.log('   Message:', error.message);
    console.log('');
    
    if (error.message.includes('not found') || error.message.includes('404')) {
      console.log('🔧 DIAGNOSIS: Edge Function Not Deployed');
      console.log('');
      console.log('The generate-vocabulary-words Edge Function is not deployed to Supabase.');
      console.log('');
      console.log('TO FIX:');
      console.log('1. Install Supabase CLI: npm install -g supabase');
      console.log('2. Login: supabase login');
      console.log('3. Link project: supabase link --project-ref urmuwjcjcyohsrkgyapl');
      console.log('4. Deploy function: supabase functions deploy generate-vocabulary-words');
      console.log('5. Set secrets: supabase secrets set GEMINI_API_KEY=your_key_here');
    } else if (error.message.includes('GEMINI_API_KEY')) {
      console.log('🔧 DIAGNOSIS: Missing GEMINI_API_KEY Secret');
      console.log('');
      console.log('The Edge Function is deployed but cannot access GEMINI_API_KEY.');
      console.log('');
      console.log('TO FIX:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Navigate to Edge Functions > generate-vocabulary-words');
      console.log('3. Click on "Secrets" tab');
      console.log('4. Add secret: GEMINI_API_KEY = ' + (geminiApiKey || 'your_gemini_key'));
    } else if (error.message.includes('Student not found')) {
      console.log('✅ Edge Function is working!');
      console.log('   (Error is expected - we used a test student ID)');
      console.log('');
      console.log('The Edge Function is deployed and accessible.');
      console.log('The connection error you\'re seeing might be:');
      console.log('  - A timeout issue (AI generation takes time)');
      console.log('  - A CORS issue');
      console.log('  - An authentication issue');
    }
  } else {
    console.log('✅ Edge Function Response Received:');
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log('❌ Unexpected Error:', error.message);
}
console.log('');

// Step 4: Test API Route
console.log('📋 Step 4: Testing Next.js API Route');
console.log('-'.repeat(60));
console.log('Testing /api/supabase/functions/generate-vocabulary-words...');
console.log('');

try {
  const response = await fetch('http://localhost:3000/api/supabase/functions/generate-vocabulary-words', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_id: 'test-diagnostic',
      count: 1,
      difficulty: 'B1'
    })
  });

  console.log('Response Status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ API Route Error:');
    console.log('   Status:', response.status);
    console.log('   Response:', errorText);
    
    if (response.status === 404) {
      console.log('');
      console.log('🔧 DIAGNOSIS: API Route Not Found');
      console.log('');
      console.log('The Next.js API route is not accessible.');
      console.log('Make sure the development server is running: npm run dev');
    }
  } else {
    const data = await response.json();
    console.log('✅ API Route Response:');
    console.log('   Success:', data.success);
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log('❌ API Route Test Failed:', error.message);
  console.log('');
  console.log('Make sure your development server is running:');
  console.log('  npm run dev');
}
console.log('');

// Step 5: Test Gemini API directly
console.log('📋 Step 5: Testing Gemini API Directly');
console.log('-'.repeat(60));

if (!geminiApiKey) {
  console.log('⚠️  GEMINI_API_KEY not set in .env.local');
  console.log('   Cannot test Gemini API directly');
} else {
  console.log('Testing Gemini API connection...');
  console.log('');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Generate one English vocabulary word with definition in JSON format: {"word": "example", "definition": "a thing characteristic of its kind"}'
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      console.log('❌ Gemini API Error:');
      console.log('   Status:', response.status);
      const errorText = await response.text();
      console.log('   Response:', errorText);
      
      if (response.status === 400) {
        console.log('');
        console.log('🔧 DIAGNOSIS: Invalid Gemini API Key');
        console.log('   Your GEMINI_API_KEY might be invalid or expired');
      }
    } else {
      const data = await response.json();
      console.log('✅ Gemini API is working!');
      console.log('   Response received successfully');
    }
  } catch (error) {
    console.log('❌ Gemini API Test Failed:', error.message);
  }
}
console.log('');

// Summary
console.log('='.repeat(60));
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('='.repeat(60));
console.log('');
console.log('Common Issues and Solutions:');
console.log('');
console.log('1. Edge Function Not Deployed:');
console.log('   → Deploy: supabase functions deploy generate-vocabulary-words');
console.log('');
console.log('2. Missing GEMINI_API_KEY Secret:');
console.log('   → Set in Supabase Dashboard > Edge Functions > Secrets');
console.log('');
console.log('3. Timeout Issues:');
console.log('   → AI generation can take 10-30 seconds');
console.log('   → Check timeout settings in vocabulary-session.ts');
console.log('');
console.log('4. CORS/Authentication Issues:');
console.log('   → Check authorization headers in API route');
console.log('   → Verify Supabase RLS policies');
console.log('');
console.log('For more help, check:');
console.log('  - Supabase Dashboard: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl');
console.log('  - Edge Function Logs: Dashboard > Edge Functions > Logs');
console.log('  - Browser Console: Check for detailed error messages');
console.log('');
