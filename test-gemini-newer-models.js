/**
 * Test newer Gemini models based on the available list
 */

require('dotenv').config({ path: '.env.local' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

// Newer models to test based on the available list
const MODELS_TO_TEST = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-pro-latest',
  'learnlm-2.0-flash-experimental'
];

async function testGeminiModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const testPrompt = {
    contents: [{
      parts: [{
        text: "Generate a simple English lesson topic about daily routines. Just give me one topic name."
      }]
    }]
  };

  try {
    console.log(`\n🧪 Testing model: ${modelName}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPrompt),
    });

    const data = await response.json();

    if (response.ok && data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0]?.content?.parts?.[0]?.text || 'No text response';
      console.log(`✅ ${modelName}: WORKING`);
      console.log(`   Response: ${responseText.substring(0, 150)}...`);
      return { model: modelName, status: 'working', response: responseText };
    } else {
      console.log(`❌ ${modelName}: FAILED`);
      const errorMsg = data.error?.message || JSON.stringify(data).substring(0, 200);
      console.log(`   Error: ${errorMsg}`);
      return { model: modelName, status: 'failed', error: errorMsg };
    }
  } catch (error) {
    console.log(`❌ ${modelName}: ERROR`);
    console.log(`   Error: ${error.message}`);
    return { model: modelName, status: 'error', error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🔍 TESTING NEWER GEMINI MODELS FOR LESSON GENERATION');
  console.log('='.repeat(60));
  
  const results = [];
  for (const model of MODELS_TO_TEST) {
    const result = await testGeminiModel(model);
    results.push(result);
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.status === 'working');
  const failed = results.filter(r => r.status !== 'working');
  
  console.log(`\n✅ Working models (${working.length}):`);
  working.forEach(r => console.log(`   - ${r.model}`));
  
  console.log(`\n❌ Failed models (${failed.length}):`);
  failed.forEach(r => {
    const shortError = r.error.substring(0, 100);
    console.log(`   - ${r.model}: ${shortError}...`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATION FOR LINGUAFLOW');
  console.log('='.repeat(60));
  
  if (working.length > 0) {
    console.log(`\n✅ Best models to use for lesson generation:`);
    working.forEach(r => {
      console.log(`   - ${r.model}`);
    });
    console.log(`\n📝 Update your Supabase Edge Functions to use one of these models.`);
  } else {
    console.log(`\n❌ ISSUE IDENTIFIED:`);
    console.log(`   Your API key has quota limitations.`);
    console.log(`   Some models work but hit free tier limits quickly.`);
    console.log(`\n💡 SOLUTIONS:`);
    console.log(`   1. Enable billing on your Google Cloud project`);
    console.log(`   2. Use the working model: gemini-2.0-flash-exp`);
    console.log(`   3. Consider upgrading to a paid tier for production use`);
  }
  
  console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
