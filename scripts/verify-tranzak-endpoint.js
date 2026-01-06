// Verify correct Tranzak API endpoint
require('dotenv').config({ path: '.env.local' });

async function verifyTranzakEndpoint() {
  console.log('🔍 Verifying Tranzak API Endpoint...\n');

  // Common Tranzak API endpoints to test
  const possibleEndpoints = [
    'https://api.tranzak.net',
    'https://api.tranzak.me',
    'https://api.tranzak.cm',
    'https://tranzak.net/api',
    'https://tranzak.me/api',
    'https://sandbox.tranzak.net',
    'https://sandbox-api.tranzak.net',
    'https://api-sandbox.tranzak.net',
    'https://test-api.tranzak.net',
  ];

  console.log('Testing possible Tranzak API endpoints:\n');

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
      
      const text = await response.text();
      if (text) {
        console.log(`  Body preview: ${text.substring(0, 200)}...`);
      }
      console.log('');

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`  ❌ Timeout (5s)\n`);
      } else {
        console.log(`  ❌ Error: ${error.message}\n`);
      }
    }
  }

  console.log('\n📋 Recommendations:');
  console.log('===================');
  console.log('1. Check Tranzak official documentation for the correct API endpoint');
  console.log('2. Contact Tranzak support to confirm the API base URL');
  console.log('3. Verify your account has API access enabled');
  console.log('4. Check if you need to whitelist your IP address');
  console.log('5. Confirm you\'re using the correct environment (sandbox vs production)\n');

  console.log('📧 Tranzak Support:');
  console.log('==================');
  console.log('Email: support@tranzak.net (or check their website)');
  console.log('Website: https://tranzak.net');
  console.log('Documentation: Check their developer portal\n');
}

verifyTranzakEndpoint().catch(console.error);
