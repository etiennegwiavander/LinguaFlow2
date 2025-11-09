require('dotenv').config({ path: '.env.local' });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

console.log('🧪 TESTING OPENROUTER DEEPSEEK MODELS\n');

if (!openRouterApiKey) {
  console.error('❌ OPENROUTER_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✓ OpenRouter API Key found\n');

// Test different DeepSeek model identifiers
const modelsToTest = [
  'deepseek/deepseek-chat',              // Current (paid)
  'deepseek/deepseek-chat-v3-free',      // V3 free
  'deepseek/deepseek-chat-free',         // Generic free
  'deepseek/deepseek-v3',                // V3
  'deepseek/deepseek-v3-free',           // V3 free variant
];

async function testModel(modelName) {
  console.log(`🤖 Testing: ${modelName}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Model Test'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{
          role: 'user',
          content: 'Say "test successful" in JSON format: {"status": "test successful"}'
        }],
        max_tokens: 50
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}`);
      return { model: modelName, success: false, error: response.status };
    }

    const data = await response.json();
    console.log(`   ✅ SUCCESS!`);
    if (data.choices?.[0]?.message?.content) {
      console.log(`   Response: ${data.choices[0].message.content.substring(0, 100)}`);
    }
    return { model: modelName, success: true };
    
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return { model: modelName, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Testing different DeepSeek model identifiers...\n');
  console.log('='.repeat(60) + '\n');
  
  const results = [];
  
  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
    console.log(''); // Empty line
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('='.repeat(60));
  console.log('\n📊 RESULTS SUMMARY:\n');
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (working.length > 0) {
    console.log('✅ WORKING MODELS:');
    working.forEach(r => console.log(`   - ${r.model}`));
    console.log('');
    console.log('💡 RECOMMENDATION:');
    console.log(`   Update Edge Function to use: "${working[0].model}"`);
  } else {
    console.log('❌ NO WORKING MODELS FOUND');
    console.log('\nPossible issues:');
    console.log('   - API key might be invalid or expired');
    console.log('   - Account needs verification');
    console.log('   - Rate limiting in effect');
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED MODELS:');
    failed.forEach(r => console.log(`   - ${r.model} (${r.error})`));
  }
}

runTests().catch(console.error);
