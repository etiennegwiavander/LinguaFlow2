require('dotenv').config({ path: '.env.local' });

async function testPasswordReset() {
  const testEmail = 'vanshidy@gmail.com'; // Use your test email
  
  console.log('Testing password reset with direct Resend integration...\n');
  console.log(`Sending password reset email to: ${testEmail}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const result = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Check your email inbox at', testEmail);
      console.log('Also check Resend dashboard: https://resend.com/emails');
    } else {
      console.log('\n❌ FAILED:', result.error);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testPasswordReset();
