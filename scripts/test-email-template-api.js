/**
 * Test script for Email Template Management API
 * This script tests all the email template endpoints
 */

const BASE_URL = 'http://localhost:3000';

// Mock admin token (in real implementation, this would be a valid JWT)
const ADMIN_TOKEN = 'admin-test-token';

async function testEmailTemplateAPI() {
  console.log('🧪 Testing Email Template Management API...\n');

  try {
    // Test 1: List templates (should work even if empty)
    console.log('1️⃣ Testing GET /api/admin/email/templates');
    const listResponse = await fetch(`${BASE_URL}/api/admin/email/templates`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ List templates successful');
      console.log(`   Found ${listData.templates?.length || 0} templates`);
    } else {
      console.log('❌ List templates failed:', listResponse.status);
    }

    // Test 2: Create a new template
    console.log('\n2️⃣ Testing POST /api/admin/email/templates');
    const newTemplate = {
      type: 'welcome',
      name: 'Test Welcome Email',
      subject: 'Welcome {{user_name}} to {{app_name}}!',
      htmlContent: '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{app_name}}.</p>',
      textContent: 'Welcome {{user_name}}! Thank you for joining {{app_name}}.',
      placeholders: ['user_name', 'app_name'],
      isActive: true
    };

    const createResponse = await fetch(`${BASE_URL}/api/admin/email/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify(newTemplate)
    });

    let templateId = null;
    if (createResponse.ok) {
      const createData = await createResponse.json();
      templateId = createData.template?.id;
      console.log('✅ Create template successful');
      console.log(`   Template ID: ${templateId}`);
    } else {
      const error = await createResponse.json();
      console.log('❌ Create template failed:', createResponse.status);
      console.log('   Error:', error.error);
    }

    if (templateId) {
      // Test 3: Get specific template
      console.log('\n3️⃣ Testing GET /api/admin/email/templates/[id]');
      const getResponse = await fetch(`${BASE_URL}/api/admin/email/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('✅ Get template successful');
        console.log(`   Template name: ${getData.template?.name}`);
      } else {
        console.log('❌ Get template failed:', getResponse.status);
      }

      // Test 4: Generate preview
      console.log('\n4️⃣ Testing GET /api/admin/email/templates/[id]/preview');
      const previewResponse = await fetch(`${BASE_URL}/api/admin/email/templates/${templateId}/preview`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (previewResponse.ok) {
        const previewData = await previewResponse.json();
        console.log('✅ Generate preview successful');
        console.log(`   Preview subject: ${previewData.preview?.subject}`);
        console.log(`   Unresolved placeholders: ${previewData.unresolvedPlaceholders?.length || 0}`);
      } else {
        console.log('❌ Generate preview failed:', previewResponse.status);
      }

      // Test 5: Update template
      console.log('\n5️⃣ Testing PUT /api/admin/email/templates/[id]');
      const updateData = {
        name: 'Updated Test Welcome Email',
        subject: 'Welcome {{user_name}} to our amazing {{app_name}}!'
      };

      const updateResponse = await fetch(`${BASE_URL}/api/admin/email/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Update template successful');
        console.log(`   New name: ${updateResult.template?.name}`);
        console.log(`   New version: ${updateResult.template?.version}`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Update template failed:', updateResponse.status);
        console.log('   Error:', error.error);
      }

      // Test 6: Get template history
      console.log('\n6️⃣ Testing GET /api/admin/email/templates/[id]/history');
      const historyResponse = await fetch(`${BASE_URL}/api/admin/email/templates/${templateId}/history`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('✅ Get template history successful');
        console.log(`   History entries: ${historyData.history?.length || 0}`);
      } else {
        console.log('❌ Get template history failed:', historyResponse.status);
      }

      // Test 7: Custom preview with data
      console.log('\n7️⃣ Testing POST /api/admin/email/templates/[id]/preview');
      const customPreviewData = {
        customData: {
          user_name: 'John Doe',
          app_name: 'LinguaFlow Test'
        }
      };

      const customPreviewResponse = await fetch(`${BASE_URL}/api/admin/email/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(customPreviewData)
      });

      if (customPreviewResponse.ok) {
        const customPreviewResult = await customPreviewResponse.json();
        console.log('✅ Custom preview successful');
        console.log(`   Custom subject: ${customPreviewResult.preview?.subject}`);
      } else {
        console.log('❌ Custom preview failed:', customPreviewResponse.status);
      }

      // Test 8: Delete template (cleanup)
      console.log('\n8️⃣ Testing DELETE /api/admin/email/templates/[id]');
      const deleteResponse = await fetch(`${BASE_URL}/api/admin/email/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });

      if (deleteResponse.ok) {
        console.log('✅ Delete template successful');
      } else {
        const error = await deleteResponse.json();
        console.log('❌ Delete template failed:', deleteResponse.status);
        console.log('   Error:', error.error);
      }
    }

    console.log('\n🎉 Email Template API testing completed!');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Test validation functions
function testValidationFunctions() {
  console.log('\n🔍 Testing validation functions...\n');

  // Test placeholder validation
  console.log('Testing placeholder validation:');
  
  const testCases = [
    {
      content: 'Hello {{user_name}}, welcome to {{app_name}}!',
      placeholders: ['user_name', 'app_name'],
      expected: true
    },
    {
      content: 'Hello {{user_name}}, your {{unknown_field}} is ready!',
      placeholders: ['user_name', 'app_name'],
      expected: false
    },
    {
      content: 'No placeholders here',
      placeholders: ['user_name'],
      expected: true
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = validatePlaceholders(testCase.content, testCase.placeholders);
    const passed = result.isValid === testCase.expected;
    console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} ${testCase.content.substring(0, 30)}...`);
    if (!passed) {
      console.log(`    Expected: ${testCase.expected}, Got: ${result.isValid}`);
      console.log(`    Errors: ${result.errors.join(', ')}`);
    }
  });
}

function validatePlaceholders(content, placeholders) {
  const errors = [];
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const foundPlaceholders = new Set();
  
  let match;
  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = match[1].trim();
    foundPlaceholders.add(placeholder);
    
    if (!placeholders.includes(placeholder)) {
      errors.push(`Unknown placeholder: {{${placeholder}}}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Run tests
if (require.main === module) {
  testValidationFunctions();
  testEmailTemplateAPI();
}

module.exports = {
  testEmailTemplateAPI,
  testValidationFunctions
};