// Final test of Tranzak API with correct endpoint
require('dotenv').config({ path: '.env.local' });

async function testTranzakFinal() {
  console.log('🔍 Final Tranzak API Test\n');
  console.log('=========================\n');

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

  const testPayment = {
    amount: 1000,
    currency: 'XAF',
    description: 'LinguaFlow Starter Plan - Monthly Subscription',
    return_url: 'https://linguaflow.online/subscription/success',
    cancel_url: 'https://linguaflow.online/subscription/cancel',
    customer_email: 'test@linguaflow.online',
    customer_name: 'Test User',
    metadata: {
      plan: 'starter',
      billing_cycle: 'monthly',
      test: true,
    },
  };

  console.log('Test Payment Request:');
  console.log(JSON.stringify(testPayment, null, 2));
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
      body: JSON.stringify(testPayment),
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
      console.log('4. Switch to production credentials when ready');

    } else if (response.status === 401) {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('');
      console.log('Error: Invalid access token');
      console.log('');
      console.log('Possible causes:');
      console.log('1. API key is incorrect or expired');
      console.log('2. API key is not activated in Tranzak dashboard');
      console.log('3. App ID does not match the API key');
      console.log('4. Sandbox credentials being used for production endpoint (or vice versa)');
      console.log('');
      console.log('Solutions:');
      console.log('1. Log into Tranzak dashboard');
      console.log('2. Go to API Settings or Developer Settings');
      console.log('3. Verify your API credentials:');
      console.log(`   - Current API Key: ${apiKey}`);
      console.log(`   - Current App ID: ${appId}`);
      console.log('4. Check if API access is enabled/activated');
      console.log('5. Generate new credentials if needed');
      console.log('6. Contact Tranzak support if issue persists');

    } else if (response.status === 400) {
      console.log('❌ BAD REQUEST');
      console.log('');
      console.log('The request format is incorrect.');
      console.log('');
      console.log('Error details:');
      console.log(JSON.stringify(responseData.errors || responseData, null, 2));
      console.log('');
      console.log('Check Tranzak documentation for correct request format.');

    } else if (response.status === 404) {
      console.log('❌ ENDPOINT NOT FOUND');
      console.log('');
      console.log('The API endpoint does not exist.');
      console.log('This should not happen - we found the correct endpoint.');
      console.log('Contact Tranzak support.');

    } else {
      console.log('⚠️  UNEXPECTED RESPONSE');
      console.log('');
      console.log('Received an unexpected status code.');
      console.log('Review the response above and contact Tranzak support if needed.');
    }

  } catch (error) {
    console.log('❌ REQUEST FAILED');
    console.log('');
    console.log(`Error: ${error.message}`);
    console.log('');
    console.log('This is a network or connection error.');
    console.log('Check your internet connection and try again.');
  }

  console.log('');
  console.log('=========================');
  console.log('Test Complete');
  console.log('=========================');
}

testTranzakFinal().catch(console.error);
