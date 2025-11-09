require('dotenv').config({ path: '.env.local' });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

console.log('🔍 CHECKING OPENROUTER ACCOUNT STATUS\n');

if (!openRouterApiKey) {
  console.error('❌ OPENROUTER_API_KEY not found');
  process.exit(1);
}

async function checkAccount() {
  try {
    // Check account credits/limits
    console.log('📊 Fetching account information...');
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Account Information:');
    console.log(JSON.stringify(data, null, 2));

    // Check if there are any usage limits
    if (data.data) {
      console.log('\n📋 Key Details:');
      console.log(`   Label: ${data.data.label || 'N/A'}`);
      console.log(`   Usage: ${data.data.usage || 'N/A'}`);
      console.log(`   Limit: ${data.data.limit || 'Unlimited'}`);
      console.log(`   Is Free Tier: ${data.data.is_free_tier || 'N/A'}`);
      console.log(`   Rate Limit: ${data.data.rate_limit || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Failed to check account:', error.message);
  }
}

checkAccount();
