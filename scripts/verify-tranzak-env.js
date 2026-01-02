// Verify Tranzak environment variables are properly configured
require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'TRANZAK_API_KEY',
  'TRANZAK_APP_ID', 
  'TRANZAK_WEBHOOK_SECRET',
  'TRANZAK_BASE_URL',
  'TRANZAK_ENVIRONMENT'
];

console.log('🔍 Verifying Tranzak Environment Variables...');
console.log('='.repeat(50));

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? 
    (varName.includes('SECRET') || varName.includes('KEY') ? 
      `${value.substring(0, 8)}...` : value) : 
    'NOT SET';
  
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!value) {
    allPresent = false;
  }
});

console.log('='.repeat(50));

if (allPresent) {
  console.log('✅ All Tranzak environment variables are configured!');
  console.log('🚀 Ready to proceed with subscription implementation.');
} else {
  console.log('❌ Missing environment variables detected.');
  console.log('📝 Please add missing variables to .env.local and Netlify.');
  process.exit(1);
}

// Test basic configuration
console.log('\n🧪 Testing Configuration...');
console.log(`Environment: ${process.env.TRANZAK_ENVIRONMENT}`);
console.log(`Base URL: ${process.env.TRANZAK_BASE_URL}`);
console.log(`Webhook URL: https://linguaflow.online/api/webhooks/tranzak`);

console.log('\n✅ Environment verification complete!');
