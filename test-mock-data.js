/**
 * Simple test script to verify mock data services work
 */

// Test the mock data services directly
async function testMockDataServices() {
  try {
    console.log('Testing mock data services...\n');

    // Test dashboard data
    const { generateMockDashboardData } = await import('./lib/mock-data/dashboard-data.js');
    const dashboardData = generateMockDashboardData();
    console.log('✅ Dashboard data generated successfully');
    console.log(`   - Email types: ${dashboardData.emailTypes.length}`);
    console.log(`   - System status: ${dashboardData.systemHealth.overall_status}`);
    console.log(`   - Recent activities: ${dashboardData.recentActivity.length}`);

    // Test analytics data
    const { generateMockEmailAnalytics } = await import('./lib/mock-data/email-analytics.js');
    const analyticsData = generateMockEmailAnalytics();
    console.log('\n✅ Analytics data generated successfully');
    console.log(`   - Total sent: ${analyticsData.totalSent}`);
    console.log(`   - Delivery rate: ${(analyticsData.deliveryRate * 100).toFixed(1)}%`);
    console.log(`   - Daily stats: ${analyticsData.dailyStats.length} days`);

    // Test templates data
    const { generateMockEmailTemplates } = await import('./lib/mock-data/email-templates.js');
    const templatesData = generateMockEmailTemplates();
    console.log('\n✅ Templates data generated successfully');
    console.log(`   - Total templates: ${templatesData.length}`);
    console.log(`   - Active templates: ${templatesData.filter(t => t.is_active).length}`);

    // Test SMTP configs data
    const { generateMockSMTPConfigs } = await import('./lib/mock-data/smtp-configs.js');
    const smtpData = generateMockSMTPConfigs();
    console.log('\n✅ SMTP configs data generated successfully');
    console.log(`   - Total configs: ${smtpData.length}`);
    console.log(`   - Active configs: ${smtpData.filter(c => c.is_active).length}`);

    // Test email logs data
    const { generateMockEmailLogs } = await import('./lib/mock-data/email-logs.js');
    const logsData = generateMockEmailLogs(10);
    console.log('\n✅ Email logs data generated successfully');
    console.log(`   - Total logs: ${logsData.length}`);
    console.log(`   - Delivered: ${logsData.filter(l => l.status === 'delivered').length}`);

    console.log('\n🎉 All mock data services are working correctly!');
    console.log('\nNext steps:');
    console.log('1. Fix the Supabase WebSocket dependency issues');
    console.log('2. Start the development server');
    console.log('3. Test the API endpoints');

  } catch (error) {
    console.error('❌ Error testing mock data services:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMockDataServices();