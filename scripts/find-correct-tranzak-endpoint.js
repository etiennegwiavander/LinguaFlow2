// Find the correct Tranzak API endpoint path
require('dotenv').config({ path: '.env.local' });

async function findCorrectEndpoint() {
  console.log('🔍 Finding Correct Tranzak API Endpoint Path...\n');

  const apiKey = process.env.TRANZAK_API_KEY;
  const appId = process.env.TRANZAK_APP_ID;
  const baseUrl = 'https://api.tranzak.me';

  // Common API endpoint patterns to test
  const endpointPaths = [
    '/request-payment',
    '/v1/request-payment',
    '/v2/request-payment',
    '/api/request-payment',
    '/payment/request',
    '/payments',
    '/v1/payments',
    '/payment',
    '/checkout',
    '/v1/checkout',
    '/transaction/create',
    '/transactions',
  ];

  const testPayload = {
    amount: 1000,
    currency: 'XAF',
    description: 'Test',
    return_url: 'https://linguaflow.online/success',
    cancel_url: 'https://linguaflow.online/cancel',
    customer_email: 'test@linguaflow.online',
    customer_name: 'Test User',
  };

  console.log('Testing different endpoint paths:\n');

  for (const path of endpointPaths) {
    const fullUrl = `${baseUrl}${path}`;
    console.log(`Testing: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-App-Id': appId,
        },
        body: JSON.stringify(testPayload),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { raw: text };
      }

      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 150)}...`);

      if (response.status !== 404 && data.errorMsg !== 'Not found') {
        console.log(`  ✅ FOUND! This endpoint exists!\n`);
      } else {
        console.log(`  ❌ Not found\n`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  // Also test GET requests to see what endpoints are available
  console.log('\n📋 Testing GET requests for documentation:\n');

  const getEndpoints = [
    '/',
    '/docs',
    '/api-docs',
    '/swagger',
    '/health',
    '/status',
  ];

  for (const path of getEndpoints) {
    const fullUrl = `${baseUrl}${path}`;
    console.log(`Testing: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-App-Id': appId,
        },
      });

      const text = await response.text();
      console.log(`  Status: ${response.status}`);
      console.log(`  Response preview: ${text.substring(0, 100)}...\n`);

    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }
  }

  console.log('\n📧 Recommendation:');
  console.log('==================');
  console.log('Contact Tranzak support to get:');
  console.log('1. Official API documentation');
  console.log('2. Correct API endpoint paths');
  console.log('3. Example request/response formats');
  console.log('4. Sandbox testing credentials\n');
  console.log('Support: support@tranzak.net or check https://tranzak.me\n');
}

findCorrectEndpoint().catch(console.error);
