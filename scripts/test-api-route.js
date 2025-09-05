/**
 * Test the welcome email API route directly
 * Run with: node scripts/test-api-route.js
 * Make sure your Next.js server is running on localhost:3000
 */

async function testAPIRoute() {
  console.log('🌐 Testing Welcome Email API Route...\n');

  const testData = {
    email: 'test-tutor@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  try {
    console.log('📧 Sending test request...');
    
    const response = await fetch('http://localhost:3000/api/welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API Route Success!');
      console.log('📧 Response:', result);
    } else {
      console.error('❌ API Route Error:', result);
    }
  } catch (err) {
    console.error('❌ API Route Exception:', err.message);
    console.log('💡 Make sure your Next.js server is running on localhost:3000');
    console.log('   Run: npm run dev');
  }
}

// Test the API
testAPIRoute();