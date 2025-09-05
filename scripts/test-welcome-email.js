/**
 * Test script for welcome email functionality
 * Run with: node scripts/test-welcome-email.js
 */

// Simple test script without external dependencies
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not read .env.local file:', error.message);
    return {};
  }
}

const env = loadEnvFile();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// We'll use fetch instead of the Supabase client for simplicity

async function testWelcomeEmailFunction() {
  console.log('🧪 Testing Welcome Email Function...\n');

  // Test data
  const testCases = [
    {
      email: 'test-tutor1@example.com',
      firstName: 'John',
      lastName: 'Doe'
    },
    {
      email: 'test-tutor2@example.com',
      firstName: 'Jane',
      lastName: 'Smith'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📧 Testing tutor welcome email for ${testCase.email}...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify(testCase)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Success for tutor:`, result.message || 'Email sent');
        if (result.emailContent) {
          console.log('📧 Email HTML generated successfully');
        }
      } else {
        console.error(`❌ Error for tutor:`, result.error || 'Unknown error');
      }
    } catch (err) {
      console.error(`❌ Exception for tutor:`, err.message);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function checkWelcomeEmailsTable() {
  console.log('📊 Checking welcome_emails table...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/welcome_emails?select=*&order=sent_at.desc&limit=5`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Error querying welcome_emails table:', response.statusText);
      return;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log('📭 No welcome emails found in database');
      return;
    }

    console.log(`📬 Found ${data.length} recent tutor welcome emails:`);
    data.forEach((email, index) => {
      console.log(`${index + 1}. ${email.email} (tutor) - ${email.status} - ${new Date(email.sent_at).toLocaleString()}`);
    });
  } catch (err) {
    console.error('❌ Exception checking table:', err.message);
  }
}

async function testAPIRoute() {
  console.log('\n🌐 Testing API Route...\n');

  const testData = {
    email: 'api-test@example.com',
    firstName: 'API',
    lastName: 'Test'
  };

  try {
    const response = await fetch('http://localhost:3000/api/welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API Route Success:', result);
    } else {
      console.error('❌ API Route Error:', result);
    }
  } catch (err) {
    console.error('❌ API Route Exception:', err.message);
    console.log('💡 Make sure your Next.js server is running on localhost:3000');
  }
}

async function runTests() {
  console.log('🚀 Welcome Email System Test Suite\n');
  console.log('=' .repeat(50));

  // Test 1: Supabase Function
  await testWelcomeEmailFunction();
  
  // Test 2: Database Table
  await checkWelcomeEmailsTable();
  
  // Test 3: API Route (requires server to be running)
  await testAPIRoute();

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test Suite Complete');
  console.log('\n💡 Next Steps:');
  console.log('1. Check your email provider configuration');
  console.log('2. Test with real email addresses');
  console.log('3. Verify email templates render correctly');
  console.log('4. Set up email monitoring and analytics');
}

// Run the tests
runTests().catch(console.error);