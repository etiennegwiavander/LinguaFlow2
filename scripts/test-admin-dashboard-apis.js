require('dotenv').config({ path: '.env.local' });

async function testAdminAPIs() {
  console.log('=== TESTING ADMIN DASHBOARD APIs ===\n');
  
  const baseUrl = 'http://localhost:3000';
  
  const tests = [
    {
      name: 'Dashboard Overview',
      url: `${baseUrl}/api/admin/email/dashboard`,
      method: 'GET'
    },
    {
      name: 'Email Templates',
      url: `${baseUrl}/api/admin/email/templates`,
      method: 'GET'
    },
    {
      name: 'SMTP Configurations',
      url: `${baseUrl}/api/admin/email/smtp-config`,
      method: 'GET'
    },
    {
      name: 'Email Logs',
      url: `${baseUrl}/api/admin/email/logs`,
      method: 'GET'
    },
    {
      name: 'Email Analytics',
      url: `${baseUrl}/api/admin/email/analytics`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ ${test.name} - SUCCESS`);
        
        // Show some sample data
        if (test.name === 'Dashboard Overview') {
          console.log(`   Total Emails: ${data.data.overview.totalEmailsSent}`);
          console.log(`   Active Configs: ${data.data.overview.activeConfigs}`);
          console.log(`   Active Templates: ${data.data.overview.activeTemplates}`);
        } else if (test.name === 'Email Templates') {
          console.log(`   Templates Found: ${data.data.length}`);
        } else if (test.name === 'SMTP Configurations') {
          console.log(`   SMTP Configs: ${data.data.length}`);
        } else if (test.name === 'Email Logs') {
          console.log(`   Email Logs: ${data.data.logs.length}`);
        } else if (test.name === 'Email Analytics') {
          console.log(`   Delivery Rate: ${data.data.overview.deliveryRate}%`);
        }
      } else {
        console.log(`❌ ${test.name} - FAILED`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR`);
      console.log(`   ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('=== TEST COMPLETE ===');
  console.log('\nIf all tests passed, your admin dashboard should now show real data!');
  console.log('Go to: http://localhost:3000/admin-portal/email');
}

testAdminAPIs();
