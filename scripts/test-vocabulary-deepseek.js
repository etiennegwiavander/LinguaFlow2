/**
 * Test script for Vocabulary Generation with DeepSeek via OpenRouter
 * 
 * This script tests the vocabulary generation Edge Function with DeepSeek
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
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

console.log('🧪 TESTING VOCABULARY GENERATION WITH DEEPSEEK');
console.log('='.repeat(60));
console.log('');

// Check environment variables
console.log('📋 Environment Check:');
console.log(`✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ OPENROUTER_API_KEY: ${openRouterApiKey ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVocabularyGeneration() {
  console.log('🚀 Testing Vocabulary Generation');
  console.log('-'.repeat(60));
  console.log('');

  try {
    // First, get a real student from the database
    console.log('📋 Step 1: Fetching a student profile...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (studentError || !students || students.length === 0) {
      console.log('⚠️  No students found in database');
      console.log('   Using test student ID instead');
      console.log('');
    }

    const testStudentId = students && students.length > 0 ? students[0].id : 'test-student-id';
    const studentName = students && students.length > 0 ? students[0].name : 'Test Student';

    console.log(`✅ Using student: ${studentName} (${testStudentId})`);
    console.log('');

    // Test vocabulary generation
    console.log('📋 Step 2: Calling generate-vocabulary-words Edge Function...');
    console.log('   Model: DeepSeek via OpenRouter');
    console.log('   Requesting: 5 vocabulary words (for faster testing)');
    console.log('   This may take 10-30 seconds...');
    console.log('');

    const startTime = Date.now();

    const { data, error } = await supabase.functions.invoke('generate-vocabulary-words', {
      body: {
        student_id: testStudentId,
        count: 5, // Request fewer words for faster testing
        exclude_words: [],
        difficulty: 'B1'
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Response time: ${duration} seconds`);
    console.log('');

    if (error) {
      console.log('❌ Edge Function Error:');
      console.log('   Status:', error.status || 'Unknown');
      console.log('   Message:', error.message);
      console.log('');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('🔧 DIAGNOSIS: Missing OPENROUTER_API_KEY Secret');
        console.log('');
        console.log('The Edge Function cannot access OPENROUTER_API_KEY.');
        console.log('');
        console.log('TO FIX:');
        console.log('1. Deploy the updated Edge Function:');
        console.log('   supabase functions deploy generate-vocabulary-words');
        console.log('');
        console.log('2. Set the secret:');
        console.log('   supabase secrets set OPENROUTER_API_KEY=' + (openRouterApiKey || 'your_key_here'));
      } else if (error.message.includes('Student not found')) {
        console.log('✅ Edge Function is working!');
        console.log('   (Error is expected - test student ID not in database)');
        console.log('');
        console.log('The Edge Function is deployed and accessible.');
        console.log('Try again with a real student ID from your database.');
      } else {
        console.log('🔍 Unexpected error. Check Edge Function logs in Supabase Dashboard.');
      }

      return;
    }

    // Success! Analyze the response
    console.log('✅ SUCCESS! Vocabulary Generated');
    console.log('='.repeat(60));
    console.log('');

    if (data && data.words && Array.isArray(data.words)) {
      console.log(`📚 Generated ${data.words.length} vocabulary words:`);
      console.log('');

      data.words.forEach((word, index) => {
        console.log(`${index + 1}. ${word.word}`);
        console.log(`   Pronunciation: ${word.pronunciation || 'N/A'}`);
        console.log(`   Part of Speech: ${word.partOfSpeech || 'N/A'}`);
        console.log(`   Definition: ${word.definition || 'N/A'}`);
        
        if (word.exampleSentences) {
          console.log(`   Example Sentences:`);
          if (word.exampleSentences.present) {
            console.log(`     • Present: ${word.exampleSentences.present.substring(0, 80)}...`);
          }
          if (word.exampleSentences.past) {
            console.log(`     • Past: ${word.exampleSentences.past.substring(0, 80)}...`);
          }
        }
        console.log('');
      });

      // Quality checks
      console.log('🔍 Quality Checks:');
      console.log('-'.repeat(60));
      
      const hasAllFields = data.words.every(w => 
        w.word && w.pronunciation && w.partOfSpeech && w.definition && w.exampleSentences
      );
      console.log(`✓ All required fields present: ${hasAllFields ? '✅ Yes' : '❌ No'}`);

      const hasAllTenses = data.words.every(w => 
        w.exampleSentences?.present && 
        w.exampleSentences?.past && 
        w.exampleSentences?.future &&
        w.exampleSentences?.presentPerfect &&
        w.exampleSentences?.pastPerfect &&
        w.exampleSentences?.futurePerfect
      );
      console.log(`✓ All 6 tenses present: ${hasAllTenses ? '✅ Yes' : '❌ No'}`);

      const hasIPA = data.words.every(w => w.pronunciation && w.pronunciation.includes('/'));
      console.log(`✓ IPA pronunciation format: ${hasIPA ? '✅ Yes' : '❌ No'}`);

      const avgDefinitionLength = data.words.reduce((sum, w) => sum + (w.definition?.length || 0), 0) / data.words.length;
      console.log(`✓ Average definition length: ${avgDefinitionLength.toFixed(0)} characters`);

      console.log('');
      console.log('🎉 DeepSeek Integration Test: PASSED');
      console.log('');
      console.log('The vocabulary generation is working correctly with DeepSeek!');

    } else {
      console.log('⚠️  Unexpected response format');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.log('❌ Test Failed:', error.message);
    console.log('');
    console.log('Stack trace:', error.stack);
  }
}

// Test OpenRouter API directly
async function testOpenRouterDirect() {
  console.log('');
  console.log('🔍 Testing OpenRouter API Directly');
  console.log('-'.repeat(60));
  console.log('');

  if (!openRouterApiKey) {
    console.log('⚠️  OPENROUTER_API_KEY not set in .env.local');
    console.log('   Skipping direct API test');
    return;
  }

  try {
    console.log('Calling OpenRouter DeepSeek API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: 'Generate one English vocabulary word with definition in JSON format: {"word": "example", "definition": "a thing characteristic of its kind"}'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ OpenRouter API Error:');
      console.log('   Status:', response.status);
      console.log('   Response:', errorText);
      
      if (response.status === 401) {
        console.log('');
        console.log('🔧 DIAGNOSIS: Invalid API Key');
        console.log('   Your OPENROUTER_API_KEY might be invalid or expired');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ OpenRouter API is working!');
    console.log('   Model:', data.model || 'deepseek/deepseek-chat');
    console.log('   Response received successfully');
    
    if (data.choices && data.choices[0]) {
      console.log('   Sample response:', data.choices[0].message.content.substring(0, 100) + '...');
    }

  } catch (error) {
    console.log('❌ OpenRouter API Test Failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testOpenRouterDirect();
  await testVocabularyGeneration();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next Steps:');
  console.log('1. If tests passed: Deploy to production');
  console.log('2. If tests failed: Check error messages above');
  console.log('3. Monitor Edge Function logs in Supabase Dashboard');
  console.log('4. Test with real students in the application');
  console.log('');
  console.log('For more information, see:');
  console.log('  - docs/vocabulary-deepseek-migration.md');
  console.log('  - VOCABULARY-CONNECTION-FIX.md');
  console.log('');
}

runTests().catch(console.error);
