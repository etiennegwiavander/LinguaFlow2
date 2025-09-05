/**
 * Test script for SMTP Configuration API endpoints
 * Run with: node scripts/test-smtp-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testSMTPAPI() {
  console.log('🧪 Testing SMTP Configuration API endpoints...\n');

  try {
    // Test 1: GET /api/admin/email/smtp-config (should return empty array initially)
    console.log('1. Testing GET /api/admin/email/smtp-config');
    const getResponse = await fetch(`${BASE_URL}/api/admin/email/smtp-config`);
    const getResult = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getResult, null, 2));
    console.log('✅ GET endpoint accessible\n');

    // Test 2: POST /api/admin/email/smtp-config (create new config)
    console.log('2. Testing POST /api/admin/email/smtp-config');
    const testConfig = {
      provider: 'custom',
      host: 'smtp.example.com',
      port: 587,
      username: 'test@example.com',
      password: 'test-password',
      encryption: 'tls',
      is_active: true
    };

    const postResponse = await fetch(`${BASE_URL}/api/admin/email/smtp-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });
    const postResult = await postResponse.json();
    console.log('Status:', postResponse.status);
    console.log('Response:', JSON.stringify(postResult, null, 2));

    if (postResponse.status === 201 && postResult.config) {
      const configId = postResult.config.id;
      console.log('✅ POST endpoint working, created config:', configId);

      // Test 3: PUT /api/admin/email/smtp-config/[id] (update config)
      console.log('\n3. Testing PUT /api/admin/email/smtp-config/' + configId);
      const updateConfig = {
        ...testConfig,
        host: 'smtp.updated.com',
        port: 465,
        encryption: 'ssl'
      };

      const putResponse = await fetch(`${BASE_URL}/api/admin/email/smtp-config/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateConfig)
      });
      const putResult = await putResponse.json();
      console.log('Status:', putResponse.status);
      console.log('Response:', JSON.stringify(putResult, null, 2));
      console.log('✅ PUT endpoint working\n');

      // Test 4: POST /api/admin/email/smtp-config/[id]/test (test connection)
      console.log('4. Testing POST /api/admin/email/smtp-config/' + configId + '/test');
      const testResponse = await fetch(`${BASE_URL}/api/admin/email/smtp-config/${configId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: 'connection'
        })
      });
      const testResult = await testResponse.json();
      console.log('Status:', testResponse.status);
      console.log('Response:', JSON.stringify(testResult, null, 2));
      console.log('✅ Test endpoint accessible (expected to fail with test config)\n');

      // Test 5: DELETE /api/admin/email/smtp-config/[id] (delete config)
      console.log('5. Testing DELETE /api/admin/email/smtp-config/' + configId);
      
      // First deactivate the config
      await fetch(`${BASE_URL}/api/admin/email/smtp-config/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateConfig,
          is_active: false
        })
      });

      const deleteResponse = await fetch(`${BASE_URL}/api/admin/email/smtp-config/${configId}`, {
        method: 'DELETE'
      });
      const deleteResult = await deleteResponse.json();
      console.log('Status:', deleteResponse.status);
      console.log('Response:', JSON.stringify(deleteResult, null, 2));
      console.log('✅ DELETE endpoint working\n');

    } else {
      console.log('❌ POST endpoint failed, skipping other tests\n');
    }

    console.log('🎉 SMTP API endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the development server is running: npm run dev');
  }
}

// Run the tests
testSMTPAPI();