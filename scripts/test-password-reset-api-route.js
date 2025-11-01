require('dotenv').config({ path: '.env.local' });

async function testPasswordResetAPIRoute() {
  const testEmail = 'vanshidy@gmail.com';
  
  console.log('Testing password reset API route (simulating UI button click)...\n');
  console.log(`Email: ${testEmail}\n`);

  try {
    // This simulates exactly what the UI does
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const result = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ SUCCESS! Password reset email should be sent.');
      console.log('Check your email at:', testEmail);
      console.log('Check Resend dashboard: https://resend.com/emails');
    } else {
      console.log('\n❌ FAILED');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\nMake sure your dev server is running:');
    console.log('  npm run dev');
  }
}

testPasswordResetAPIRoute();
