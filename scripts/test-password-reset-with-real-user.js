require('dotenv').config({ path: '.env.local' });

async function testPasswordResetWithRealUser() {
  const testEmail = 'vanshidy@gmail.com';
  
  console.log('=== TESTING PASSWORD RESET WITH REAL USER ===\n');
  console.log(`Testing with: ${testEmail}\n`);
  
  try {
    // Call the API route directly (this is what the UI does)
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const result = await response.json();

    console.log('API Response:');
    console.log('  Status:', response.status);
    console.log('  Body:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ API call successful!');
      console.log('\nNow check:');
      console.log('1. Your terminal running the dev server for any errors');
      console.log('2. Resend dashboard: https://resend.com/emails');
      console.log('3. Your email inbox:', testEmail);
      console.log('\nIf email doesn\'t appear in Resend:');
      console.log('- Check dev server terminal for Edge Function errors');
      console.log('- The API returns success even if user doesn\'t exist (security)');
      console.log('- Check if RESEND_API_KEY is set in Edge Function secrets');
    } else {
      console.log('\n❌ API call failed');
      console.log('Error:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running: npm run dev');
    console.log('2. You\'re testing against the correct environment');
  }
}

console.log('NOTE: This test calls the actual API route.');
console.log('Make sure your dev server is running!\n');

testPasswordResetWithRealUser();
