/**
 * Test script for OpenRouter API key validation
 * Tests basic API connectivity and response using Deepseek model
 * Reads API key from environment variable
 */

require('dotenv').config({ path: '.env.local' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in .env.local');
  process.exit(1);
}

async function testDeepseekAPI() {
  console.log('🔍 Testing OpenRouter API key with Deepseek model...\n');
  
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LinguaFlow'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with a simple greeting to confirm the API is working.'
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }

    const data = await response.json();
    console.log('\n✅ API Key is VALID!');
    console.log('\n📝 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0]) {
      console.log('\n💬 AI Response:', data.choices[0].message.content);
    }

    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testDeepseekAPI()
  .then(result => {
    console.log('\n' + '='.repeat(50));
    if (result.success) {
      console.log('✅ OPENROUTER API KEY TEST: PASSED');
      console.log('The API key is working correctly!');
      console.log('You can now use Deepseek models via OpenRouter.');
    } else {
      console.log('❌ OPENROUTER API KEY TEST: FAILED');
      console.log('The API key may be invalid or there was a connection issue.');
    }
    console.log('='.repeat(50));
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });
