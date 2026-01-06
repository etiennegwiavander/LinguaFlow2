// Test Tranzak sandbox API endpoints
require('dotenv').config({ path: '.env.local' });

async function testSandboxEndpoints() {
  console.log('🔍 Testing Tranzak Sandbox API Endpoints...\n');

  const apiKey = process.env.TRANZAK_API_KEY;
  const appId = process.env.TRANZAK_APP_ID;
  const baseUrl = 'https://sandbox.dsapi.tranzak.me';

  const testPayload = {
    amount: 1000,
    currency: 'XAF',
    description: 'Test',
    return_url: 'https://linguaflow.online/success',
    cancel_url: 'https://linguaflow.online/cancel',
    customer_email: 'test@linguaflow.online',
    customer_name: 'Test User',
  };

  // Common Tranzak API endpoint patterns
  const endpoints = [
    '/xp021/v1/request-payment',
    '/v1/request-payment',
    '/v2/request-payment',
    '/request-payment',
    '/api/v1/request-payment',
    '/payment/request',
    '/payments/create',
    '/checkout/create',
    '/transaction/create',
  ];

  console.log('Testing POST endpoints:\n');

  for (const endpoint of endpoints) {
    const fullUrl = `${baseUrl}${endpoint}`;
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
        data = { raw: text.substring(0, 200) };
      }

      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 200)}...`);

      if (response.status === 200 || response.status === 201) {
        console.log(`  ✅ SUCCESS! This endpoint works!\n`);
      } else if (response.status === 400 || response.status === 401 || response.status === 403) {
        console.log(`  ⚠️  Endpoint exists but request failed (auth/validation issue)\n`);
      } else if (response.status === 404) {
        console.log(`  ❌ Not found\n`);
      } else {
        console.log(`  ⚠️  Unexpected status\n`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  // Try different authentication methods
  console.log('\n📋 Testing Different Authentication Methods:\n');

  const authMethods = [
    {
      name: 'Bearer token + X-App-Id header',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-App-Id': appId,
      }
    },
    {
      name: 'API-Key header + App-Id header',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': apiKey,
        'App-Id': appId,
      }
    },
    {
      name: 'X-API-Key header + X-App-Id header',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-App-Id': appId,
      }
    },
    {
      name: 'apiKey and appId in body',
      headers: {
        'Content-Type': 'application/json',
      },
      bodyExtra: {
        apiKey: apiKey,
        appId: appId,
      }
    },
  ];

  const testEndpoint = '/v1/request-payment';

  for (const method of authMethods) {
    console.log(`Testing: ${method.name}`);
    const fullUrl = `${baseUrl}${testEndpoint}`;

    try {
      const body = method.bodyExtra 
        ? { ...testPayload, ...method.bodyExtra }
        : testPayload;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: method.headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 150)}...`);

      if (response.status !== 404) {
        console.log(`  ✅ This auth method got a response!\n`);
      } else {
        console.log(`  ❌ Still 404\n`);
      }

    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }
  }

  console.log('\n📧 Next Steps:');
  console.log('==============');
  console.log('1. Check Tranzak documentation for correct endpoint path');
  console.log('2. Verify API credentials are activated in Tranzak dashboard');
  console.log('3. Contact Tranzak support with test results above\n');
}

testSandboxEndpoints().catch(console.error);
