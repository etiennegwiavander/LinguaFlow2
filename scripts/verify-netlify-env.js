// Verify Netlify environment variables are set correctly
// This script helps diagnose environment variable issues in production

console.log('🔍 Netlify Environment Variables Check\n');
console.log('======================================\n');

// Check all Tranzak-related environment variables
const requiredVars = [
  'TRANZAK_API_KEY',
  'TRANZAK_APP_ID',
  'TRANZAK_BASE_URL',
  'TRANZAK_ENVIRONMENT',
  'TRANZAK_WEBHOOK_SECRET',
];

console.log('Required Tranzak Environment Variables:\n');

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = !!value;
  
  if (!isPresent) {
    allPresent = false;
  }
  
  console.log(`${isPresent ? '✅' : '❌'} ${varName}: ${
    isPresent 
      ? (value.length > 20 ? value.substring(0, 15) + '...' : value)
      : 'MISSING'
  }`);
});

console.log('\n======================================\n');

if (allPresent) {
  console.log('✅ All required environment variables are set!\n');
  console.log('If you\'re still seeing errors in production:');
  console.log('1. Check Netlify dashboard → Site settings → Environment variables');
  console.log('2. Ensure variables are set for the correct deploy context (Production/Deploy previews)');
  console.log('3. Redeploy the site after adding/updating variables');
  console.log('4. Check Netlify function logs for detailed error messages\n');
} else {
  console.log('❌ Some environment variables are missing!\n');
  console.log('To fix this in Netlify:');
  console.log('1. Go to Netlify dashboard');
  console.log('2. Select your site (LinguaFlow)');
  console.log('3. Go to Site settings → Environment variables');
  console.log('4. Add the missing variables:');
  console.log('');
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`   ${varName}=your_value_here`);
    }
  });
  
  console.log('');
  console.log('5. Click "Save"');
  console.log('6. Trigger a new deploy (or wait for next push)\n');
}

console.log('Current values from .env.local:');
console.log('================================');
console.log(`TRANZAK_API_KEY=${process.env.TRANZAK_API_KEY || 'NOT SET'}`);
console.log(`TRANZAK_APP_ID=${process.env.TRANZAK_APP_ID || 'NOT SET'}`);
console.log(`TRANZAK_BASE_URL=${process.env.TRANZAK_BASE_URL || 'NOT SET'}`);
console.log(`TRANZAK_ENVIRONMENT=${process.env.TRANZAK_ENVIRONMENT || 'NOT SET'}`);
console.log('');
console.log('Note: These values work locally but need to be set in Netlify for production.\n');
