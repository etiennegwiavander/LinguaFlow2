// Test Tranzak API with correct format from documentation
require('dotenv').config({ path: '.env.local' });

async function testCorrectFormat() {
  console.log('🔍 Testing Tranzak API with Correct Format\n');
  console.log('==========================================\n');

  const apiKey = process.env.TRANZAK_API_KEY;
  const appId = process.env.TRANZAK_APP_ID;
  const baseUrl = 'https://sandbox.dsapi.tranzak.me';
  const endpoint = '/xp021/v1/request-payment';

  console.log('Configuration:');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING'}`);
  console.log(`  App ID: ${appId || 'MISSING'}`);
  console.log('');

  // Correct format according to Tranzak documentation
  const paymentRequest = {
    amount: 1000,
    currencyCode: 'XAF', // Changed from 'currency' to 'currencyCode'
    description: 'LinguaFlow Starter Plan - Monthly Subscription',
    returnUrl: 'http://localhost:3000/subscription/success', // Changed from 'return_url' to 'returnUrl'
    mchTransactionRef: 'test_' + Date.now(), // Optional merchant transaction reference
  };

  console.log('Payment Request (Correct Format):');
  console.log(JSON.stringify(paymentRequest, null, 2));
  console.log('');

  try {
    console.log(`Making request to: ${baseUrl}${endpoint}\n`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-App-Id': appId,
      },
      body: JSON.stringify(paymentRequest),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    console.log('Response:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Body: ${JSON.stringify(responseData, null, 2)}`);
    console.log('');

    // Analyze the response
    if (response.status === 200 && responseData.success) {
      console.log('✅ SUCCESS! Payment request created!');
      console.log('');
      console.log('Payment Details:');
      console.log(`  Request ID: ${responseData.data?.requestId || 'N/A'}`);
      console.log(`  Payment URL: ${responseData.data?.links?.paymentUrl || 'N/A'}`);
      console.log(`  Amount: ${responseData.data?.amount || 'N/A'} ${responseData.data?.currencyCode || ''}`);
      console.log(`  Status: ${responseData.data?.status || 'N/A'}`);
      console.log('');
      console.log('🎉 Tranzak integration is working!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Test the payment flow in your app');
      console.log('2. Configure webhook endpoint');
      console.log('3. Test subscription activation');

    } else if (response.status === 401) {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('');
      console.log('Error: Invalid access token');
      console.log('');
      console.log('Your API credentials are not activated or invalid.');
      console.log('');
      console.log('Action Required:');
      console.log('1. Log into Tranzak dashboard');
      console.log('2. Go to API Settings');
      console.log('3. Verify credentials are activated');
      console.log('4. Contact Tranzak support if needed');

    } else if (response.status === 400) {
      console.log('❌ BAD REQUEST');
      console.log('');
      console.log('The request format is incorrect.');
      console.log('');
      console.log('Error details:');
      console.log(JSON.stringify(responseData.errors || responseData, null, 2));

    } else {
      console.log('⚠️  UNEXPECTED RESPONSE');
      console.log('');
      console.log('Review the response above.');
    }

  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.log('');
    console.log(`Error: ${error.message}`);
  }

  console.log('');
  console.log('==========================================');
  console.log('Test Complete');
  console.log('==========================================');
}

testCorrectFormat().catch(console.error);
