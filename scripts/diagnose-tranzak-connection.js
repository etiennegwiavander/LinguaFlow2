// Diagnose Tranzak API connection issues
require('dotenv').config({ path: '.env.local' });

async function diagnoseTranzakConnection() {
  console.log('🔍 Diagnosing Tranzak API Connection...\n');

  // Step 1: Check environment variables
  console.log('📋 Step 1: Checking Environment Variables');
  console.log('=========================================');
  const apiKey = process.env.TRANZAK_API_KEY;
  const appId = process.env.TRANZAK_APP_ID;
  const baseUrl = process.env.TRANZAK_BASE_URL || 'https://api.tranzak.net/v1';
  const environment = process.env.TRANZAK_ENVIRONMENT || 'sandbox';

  console.log(`TRANZAK_API_KEY: ${apiKey ? '✅ Set (length: ' + apiKey.length + ')' : '❌ Not set'}`);
  console.log(`TRANZAK_APP_ID: ${appId ? '✅ Set (length: ' + appId.length + ')' : '❌ Not set'}`);
  console.log(`TRANZAK_BASE_URL: ${baseUrl}`);
  console.log(`TRANZAK_ENVIRONMENT: ${environment}\n`);

  if (!apiKey || !appId) {
    console.error('❌ Missing required credentials. Cannot proceed with API test.\n');
    return;
  }

  // Step 2: Test DNS resolution
  console.log('📋 Step 2: Testing DNS Resolution');
  console.log('==================================');
  const dns = require('dns').promises;
  const url = new URL(baseUrl);
  const hostname = url.hostname;
  
  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ DNS resolution successful for ${hostname}`);
    console.log(`   IP addresses: ${addresses.join(', ')}\n`);
  } catch (error) {
    console.error(`❌ DNS resolution failed for ${hostname}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   This means your computer cannot find the Tranzak server.\n`);
    return;
  }

  // Step 3: Test basic connectivity
  console.log('📋 Step 3: Testing Basic Connectivity');
  console.log('======================================');
  const https = require('https');
  
  try {
    await new Promise((resolve, reject) => {
      const req = https.get(baseUrl, (res) => {
        console.log(`✅ Connection established to ${baseUrl}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}\n`);
        resolve();
      });
      
      req.on('error', (error) => {
        console.error(`❌ Connection failed to ${baseUrl}`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}\n`);
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Connection timeout after 10 seconds'));
      });
    });
  } catch (error) {
    console.error('❌ Basic connectivity test failed\n');
    return;
  }

  // Step 4: Test Tranzak API with actual credentials
  console.log('📋 Step 4: Testing Tranzak API Authentication');
  console.log('==============================================');
  
  try {
    const testPayload = {
      amount: 1000,
      currency: 'XAF',
      description: 'Test payment - LinguaFlow diagnostic',
      return_url: 'https://linguaflow.online/test/success',
      cancel_url: 'https://linguaflow.online/test/cancel',
      customer_email: 'test@linguaflow.online',
      customer_name: 'Test User',
      metadata: {
        test: true,
        diagnostic: true,
      },
    };

    console.log('Sending test payment request...');
    console.log(`Endpoint: ${baseUrl}/payments`);
    console.log(`Payload: ${JSON.stringify(testPayload, null, 2)}\n`);

    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-App-Id': appId,
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    console.log(`Response Body: ${JSON.stringify(responseData, null, 2)}\n`);

    if (response.ok) {
      console.log('✅ Tranzak API authentication successful!');
      console.log('   Your credentials are valid and the API is accessible.\n');
    } else {
      console.error('❌ Tranzak API request failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   This could mean:`);
      console.error(`   - Invalid API credentials`);
      console.error(`   - Incorrect API endpoint`);
      console.error(`   - Account not activated`);
      console.error(`   - API rate limit exceeded\n`);
    }

  } catch (error) {
    console.error('❌ Tranzak API test failed');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   🔍 DIAGNOSIS: DNS lookup failed');
      console.error('   This means the domain name cannot be resolved to an IP address.');
      console.error('   Possible causes:');
      console.error('   - No internet connection');
      console.error('   - DNS server issues');
      console.error('   - Firewall blocking DNS requests');
      console.error('   - Incorrect domain name in TRANZAK_BASE_URL\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🔍 DIAGNOSIS: Connection refused');
      console.error('   The server actively refused the connection.');
      console.error('   Possible causes:');
      console.error('   - Server is down');
      console.error('   - Firewall blocking the connection');
      console.error('   - Wrong port number\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   🔍 DIAGNOSIS: Connection timeout');
      console.error('   The connection attempt took too long.');
      console.error('   Possible causes:');
      console.error('   - Slow internet connection');
      console.error('   - Server not responding');
      console.error('   - Firewall blocking the connection\n');
    }
  }

  // Step 5: Network diagnostics
  console.log('📋 Step 5: Additional Network Diagnostics');
  console.log('==========================================');
  console.log('Testing general internet connectivity...\n');
  
  const testUrls = [
    'https://www.google.com',
    'https://api.github.com',
    'https://httpbin.org/get',
  ];

  for (const testUrl of testUrls) {
    try {
      const response = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      console.log(`✅ ${testUrl} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${testUrl} - Error: ${error.message}`);
    }
  }

  console.log('\n🏁 Diagnostic Complete');
  console.log('======================');
  console.log('Review the results above to identify the issue.');
  console.log('If DNS resolution or basic connectivity failed, check your internet connection.');
  console.log('If API authentication failed, verify your Tranzak credentials.\n');
}

diagnoseTranzakConnection().catch(console.error);
