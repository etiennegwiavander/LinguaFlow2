/**
 * Test script to check which Gemini models are working
 * This will test various Gemini models and report their status
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8';

// Models to test
const MODELS_TO_TEST = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'gemini-2.0-flash-exp',
  'gemini-exp-1206'
];

async function testGeminiModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const testPrompt = {
    contents: [{
      parts: [{
        text: "Say 'Hello, I am working!' in one sentence."
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
      console.log(`   Response: ${responseText.substring(0, 100)}...`);
      return { model: modelName, status: 'working', response: responseText };
    } else {
      console.log(`❌ ${modelName}: FAILED`);
      console.log(`   Error: ${data.error?.message || JSON.stringify(data)}`);
      return { model: modelName, status: 'failed', error: data.error?.message || 'Unknown error' };
    }
  } catch (error) {
    console.log(`❌ ${modelName}: ERROR`);
    console.log(`   Error: ${error.message}`);
    return { model: modelName, status: 'error', error: error.message };
  }
}

async function listAvailableModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  try {
    console.log('\n📋 Fetching list of available models...');
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.models) {
      console.log(`\n✅ Found ${data.models.length} available models:`);
      data.models.forEach(model => {
        console.log(`   - ${model.name} (${model.displayName || 'No display name'})`);
      });
      return data.models;
    } else {
      console.log(`❌ Failed to fetch models list`);
      console.log(`   Error: ${data.error?.message || JSON.stringify(data)}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Error fetching models list: ${error.message}`);
    return [];
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🔍 GEMINI API MODEL TESTING');
  console.log('='.repeat(60));
  console.log(`API Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5)}`);
  
  // First, list all available models
  const availableModels = await listAvailableModels();
  
  // Test each model
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING INDIVIDUAL MODELS');
  console.log('='.repeat(60));
  
  const results = [];
  for (const model of MODELS_TO_TEST) {
    const result = await testGeminiModel(model);
    results.push(result);
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
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
  failed.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMENDATION');
  console.log('='.repeat(60));
  
  if (working.length > 0) {
    console.log(`\n✅ Use one of these working models in your code:`);
    working.forEach(r => console.log(`   - ${r.model}`));
  } else {
    console.log(`\n❌ No models are working. Possible issues:`);
    console.log(`   1. API key might be invalid or expired`);
    console.log(`   2. API key might not have proper permissions`);
    console.log(`   3. Billing might not be enabled on your Google Cloud project`);
    console.log(`   4. API might be experiencing issues`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the tests
runTests().catch(console.error);
