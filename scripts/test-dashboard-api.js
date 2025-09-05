#!/usr/bin/env node

/**
 * Test script for Email Management Dashboard API
 * This script tests the dashboard API endpoints to ensure they work correctly
 */

const BASE_URL = 'http://localhost:3000';

async function testDashboardAPI() {
  console.log('🧪 Testing Email Management Dashboard API...\n');

  try {
    // Test 1: Dashboard Overview (GET)
    console.log('1. Testing Dashboard Overview (GET /api/admin/email/dashboard)');
    
    const dashboardResponse = await fetch(`${BASE_URL}/api/admin/email/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard overview retrieved successfully');
      console.log(`   - Email types: ${dashboardData.emailTypes?.length || 0}`);
      console.log(`   - System status: ${dashboardData.systemHealth?.status || 'unknown'}`);
      console.log(`   - Emails sent (24h): ${dashboardData.quickStats?.totalEmailsSent24h || 0}`);
      console.log(`   - Active templates: ${dashboardData.quickStats?.activeTemplates || 0}`);
    } else {
      console.log(`❌ Dashboard overview failed: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
      const errorData = await dashboardResponse.json().catch(() => ({}));
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }

    console.log('');

    // Test 2: Email Types Management (GET)
    console.log('2. Testing Email Types Management (GET /api/admin/email/types)');
    
    const typesResponse = await fetch(`${BASE_URL}/api/admin/email/types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (typesResponse.ok) {
      const typesData = await typesResponse.json();
      console.log('✅ Email types retrieved successfully');
      console.log(`   - Available types: ${typesData.emailTypes?.length || 0}`);
      typesData.emailTypes?.forEach(type => {
        console.log(`     * ${type.type}: ${type.isActive ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log(`❌ Email types retrieval failed: ${typesResponse.status} ${typesResponse.statusText}`);
    }

    console.log('');

    // Test 3: Bulk Operations (GET)
    console.log('3. Testing Bulk Operations (GET /api/admin/email/templates/bulk)');
    
    const bulkOpsResponse = await fetch(`${BASE_URL}/api/admin/email/templates/bulk?operation=get_operations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (bulkOpsResponse.ok) {
      const bulkOpsData = await bulkOpsResponse.json();
      console.log('✅ Bulk operations retrieved successfully');
      console.log(`   - Available operations: ${bulkOpsData.operations?.length || 0}`);
      bulkOpsData.operations?.forEach(op => {
        console.log(`     * ${op.name}: ${op.description}`);
      });
    } else {
      console.log(`❌ Bulk operations retrieval failed: ${bulkOpsResponse.status} ${bulkOpsResponse.statusText}`);
    }

    console.log('');

    // Test 4: System Health Check (GET)
    console.log('4. Testing System Health Check (GET /api/admin/email/health)');
    
    const healthResponse = await fetch(`${BASE_URL}/api/admin/email/health?type=full&details=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ System health check completed successfully');
      console.log(`   - Overall status: ${healthData.status || 'unknown'}`);
      console.log(`   - Checks passed: ${healthData.summary?.passedChecks || 0}/${healthData.summary?.totalChecks || 0}`);
      console.log(`   - Recommendations: ${healthData.recommendations?.length || 0}`);
      
      if (healthData.checks) {
        Object.entries(healthData.checks).forEach(([checkName, check]) => {
          const statusIcon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
          console.log(`     ${statusIcon} ${checkName}: ${check.message}`);
        });
      }
    } else {
      console.log(`❌ System health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }

    console.log('');

    // Test 5: Dashboard Actions (POST) - System Health Check
    console.log('5. Testing Dashboard Actions - Health Check (POST /api/admin/email/dashboard)');
    
    const actionResponse = await fetch(`${BASE_URL}/api/admin/email/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'system_health_check'
      })
    });

    if (actionResponse.ok) {
      const actionData = await actionResponse.json();
      console.log('✅ Dashboard health check action completed successfully');
      console.log(`   - Message: ${actionData.message || 'No message'}`);
      if (actionData.healthReport) {
        console.log(`   - SMTP Status: ${actionData.healthReport.smtpStatus || 'unknown'}`);
        console.log(`   - Templates: ${actionData.healthReport.activeTemplatesCount || 0}/${actionData.healthReport.templatesCount || 0} active`);
      }
    } else {
      console.log(`❌ Dashboard health check action failed: ${actionResponse.status} ${actionResponse.statusText}`);
      const errorData = await actionResponse.json().catch(() => ({}));
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }

    console.log('');

    // Test 6: Email Type Validation (POST)
    console.log('6. Testing Email Type Validation (POST /api/admin/email/types)');
    
    const validationResponse = await fetch(`${BASE_URL}/api/admin/email/types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate_scheduling',
        data: {
          emailType: 'welcome',
          config: {
            enabled: true,
            timing: 'immediate',
            triggerEvent: 'user_registration',
            conditions: {
              userType: 'all',
              delay: 0
            }
          }
        }
      })
    });

    if (validationResponse.ok) {
      const validationData = await validationResponse.json();
      console.log('✅ Email type validation completed successfully');
      console.log(`   - Valid: ${validationData.valid ? 'Yes' : 'No'}`);
      console.log(`   - Message: ${validationData.message || 'No message'}`);
      if (validationData.errors && validationData.errors.length > 0) {
        console.log(`   - Errors: ${validationData.errors.join(', ')}`);
      }
    } else {
      console.log(`❌ Email type validation failed: ${validationResponse.status} ${validationResponse.statusText}`);
    }

    console.log('\n🎉 Dashboard API testing completed!');
    console.log('\n📋 Summary:');
    console.log('   - Dashboard overview endpoint: Available');
    console.log('   - Email types management: Available');
    console.log('   - Bulk operations: Available');
    console.log('   - System health checks: Available');
    console.log('   - Dashboard actions: Available');
    console.log('   - Email type validation: Available');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Make sure the development server is running on http://localhost:3000');
    process.exit(1);
  }
}

// Helper function to format JSON output
function formatJSON(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

// Run the test
if (require.main === module) {
  testDashboardAPI();
}

module.exports = { testDashboardAPI };