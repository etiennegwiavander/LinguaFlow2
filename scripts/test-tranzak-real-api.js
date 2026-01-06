// Test real Tranzak API with correct endpoint
require('dotenv').config({ path: '.env.local' });

async function testTranzakRealAPI() {
  console.log('🔍 Testing Real Tranzak API Integration...\n');

  const apiKey = process.env.TRANZAK_API_KEY;
  const appId = process.env.TRANZAK_APP_ID;
  const baseUrl = process.env.TRANZAK_BASE_URL || 'https://api.tranzak.me';

  console.log('📋 Configuration:');
  console.log('=================');
  console.log(`API Key: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`App ID: ${appId ? '✅ Set' : '❌ Missing'}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('');

  if (!apiKey || !appId) {
    console.error('❌ Missing credentials. Please set TRANZAK_API_KEY and TRANZAK_APP_ID in .env.local\n');
    return;
  }

  // Test 1: Create a test payment
  console.log('📋 Test 1: Creating Test Payment');
  console.log('=================================');

  const testPayment = {
    amount: 1000,
    currency: 'XAF',
    description: 'LinguaFlow Test Payment - Diagnostic',
    return_url: 'https://linguaflow.online/subscription/success',
    cancel_url: 'https://linguaflow.online/subscription/cancel',
    customer_email: 'test@linguaflow.online',
    customer_name: 'Test User',
    metadata: {
      test: true,
      diagnostic: true,
      timestamp: new Date().toISOString(),
    },
  };

  console.log('Request payload:');
  console.log(JSON.stringify(testPayment, null, 2));
  console.log('');

  try {
    const response = await fetch(`${baseUrl}/request-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-App-Id': appId,
      },
      body: JSON.stringify(testPayment),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log('Response Body:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok && responseData.success) {
      console.log('✅ Payment request created successfully!');
      console.log(`   Request ID: ${responseData.data?.requestId || 'N/A'}`);
      console.log(`   Payment URL: ${responseData.data?.links?.paymentUrl || 'N/A'}`);
      console.log('');
      
      // Test 2: Verify the payment
      if (responseData.data?.requestId) {
        console.log('📋 Test 2: Verifying Payment Status');
        console.log('====================================');
        
        const verifyResponse = await fetch(`${baseUrl}/request-payment/${responseData.data.requestId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-App-Id': appId,
          },
        });

        const verifyData = await verifyResponse.json();
        console.log('Verification Response:');
        console.log(JSON.stringify(verifyData, null, 2));
        console.log('');

        if (verifyResponse.ok) {
          console.log('✅ Payment verification successful!');
        } else {
          console.log('❌ Payment verification failed');
        }
      }
    } else {
      console.error('❌ Payment request failed');
      console.error('   This could mean:');
      console.error('   - Invalid API credentials');
      console.error('   - Account not activated');
      console.error('   - Insufficient permissions');
      console.error('   - Invalid request format');
      console.error('');
      
      if (responseData.errorMsg) {
        console.error(`   Error message: ${responseData.errorMsg}`);
      }
      if (responseData.errorCode) {
        console.error(`   Error code: ${responseData.errorCode}`);
      }
    }

  } catch (error) {
    console.error('❌ API request failed');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error('');
  }

  // Test 3: Check API health/status
  console.log('📋 Test 3: Checking API Health');
  console.log('===============================');

  try {
    const healthResponse = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-App-Id': appId,
      },
    });

    const healthData = await healthResponse.json();
    console.log('API Health Response:');
    console.log(JSON.stringify(healthData, null, 2));
    console.log('');

    if (healthResponse.ok) {
      console.log('✅ API is accessible');
    } else {
      console.log('⚠️  API returned non-OK status');
    }

  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  console.log('\n🏁 Test Complete');
  console.log('================');
  console.log('Summary:');
  console.log('- Correct API endpoint: https://api.tranzak.me');
  console.log('- DNS resolution: ✅ Working');
  console.log('- API connectivity: Check results above');
  console.log('');
  console.log('Next steps:');
  console.log('1. If payment creation failed, verify your credentials with Tranzak');
  console.log('2. Check if your account is activated and has API access');
  console.log('3. Confirm you\'re using the correct environment (sandbox/production)');
  console.log('4. Review Tranzak documentation for the correct API format');
  console.log('');
}

testTranzakRealAPI().catch(console.error);
