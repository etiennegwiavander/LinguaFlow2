/**
 * Test script to verify admin portal integration
 * Run with: node scripts/test-admin-portal-integration.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAdminPortalIntegration() {
  console.log('🧪 Testing Admin Portal Integration...\n');

  try {
    // Test 1: Check if admin portal loads
    console.log('1. Testing admin portal accessibility');
    const portalResponse = await fetch(`${BASE_URL}/admin-portal`);
    console.log('Admin Portal Status:', portalResponse.status);
    
    if (portalResponse.status === 200) {
      console.log('✅ Admin portal is accessible\n');
    } else {
      console.log('❌ Admin portal not accessible\n');
    }

    // Test 2: Check if settings page loads
    console.log('2. Testing admin settings page');
    const settingsResponse = await fetch(`${BASE_URL}/admin-portal/settings`);
    console.log('Settings Page Status:', settingsResponse.status);
    
    if (settingsResponse.status === 200) {
      console.log('✅ Settings page is accessible\n');
    } else {
      console.log('❌ Settings page not accessible\n');
    }

    // Test 3: Test SMTP API endpoints are accessible
    console.log('3. Testing SMTP API endpoints');
    const apiResponse = await fetch(`${BASE_URL}/api/admin/email/smtp-config`);
    console.log('SMTP API Status:', apiResponse.status);
    
    if (apiResponse.status === 401) {
      console.log('✅ SMTP API is protected (returns 401 without auth)\n');
    } else if (apiResponse.status === 200) {
      console.log('✅ SMTP API is accessible\n');
    } else {
      console.log('❌ SMTP API has unexpected status\n');
    }

    console.log('🎉 Admin portal integration tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Visit http://localhost:3000/admin-portal/login to access the admin portal');
    console.log('2. Navigate to Settings > Email tab to manage SMTP configurations');
    console.log('3. Test creating, updating, and testing SMTP configurations');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the development server is running: npm run dev');
  }
}

// Run the tests
testAdminPortalIntegration();