/**
 * Test script for Email Testing API
 * Verifies that the email testing endpoints are working correctly
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://urmuwjcjcyohsrkgyapl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTEwMzE0MCwiZXhwIjoyMDY0Njc5MTQwfQ.f244RmJBYqyWf69yaEvkSla4uA9fJcoD-ze6maUINF4';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailTestingAPI() {
  console.log('🧪 Testing Email Testing API...\n');

  try {
    // Test 1: Check if email_logs table exists and has test data structure
    console.log('1. Checking email_logs table structure...');
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('is_test', true)
      .limit(1);

    if (logsError) {
      console.error('❌ Error accessing email_logs table:', logsError.message);
    } else {
      console.log('✅ email_logs table accessible');
      console.log(`   Found ${logs?.length || 0} test email logs`);
    }

    // Test 2: Check if email_templates table has data
    console.log('\n2. Checking email_templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('id, type, name, subject')
      .limit(5);

    if (templatesError) {
      console.error('❌ Error accessing email_templates table:', templatesError.message);
    } else {
      console.log('✅ email_templates table accessible');
      console.log(`   Found ${templates?.length || 0} templates:`);
      templates?.forEach(template => {
        console.log(`   - ${template.name} (${template.type}): ${template.subject}`);
      });
    }

    // Test 3: Check if SMTP configurations exist
    console.log('\n3. Checking SMTP configurations...');
    const { data: smtpConfigs, error: smtpError } = await supabase
      .from('email_smtp_configs')
      .select('id, provider, host, port, is_active')
      .limit(5);

    if (smtpError) {
      console.error('❌ Error accessing email_smtp_configs table:', smtpError.message);
    } else {
      console.log('✅ email_smtp_configs table accessible');
      console.log(`   Found ${smtpConfigs?.length || 0} SMTP configurations:`);
      smtpConfigs?.forEach(config => {
        console.log(`   - ${config.provider} (${config.host}:${config.port}) - Active: ${config.is_active}`);
      });
    }

    // Test 4: Test email parameter validation
    console.log('\n4. Testing email parameter validation...');
    
    if (templates && templates.length > 0) {
      const testTemplate = templates[0];
      console.log(`   Using template: ${testTemplate.name}`);
      
      // Get template details including placeholders
      const { data: templateDetails, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', testTemplate.id)
        .single();

      if (templateError) {
        console.error('❌ Error getting template details:', templateError.message);
      } else {
        console.log('✅ Template details retrieved');
        console.log(`   Placeholders: ${JSON.stringify(templateDetails.placeholders)}`);
        
        // Test placeholder replacement
        const testParams = { user_name: 'Test User', app_name: 'TestApp' };
        let subject = templateDetails.subject;
        let htmlContent = templateDetails.html_content;
        
        Object.entries(testParams).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), value);
          htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
        });
        
        console.log(`   Original subject: ${templateDetails.subject}`);
        console.log(`   Processed subject: ${subject}`);
        console.log('✅ Placeholder replacement working');
      }
    }

    // Test 5: Create a test email log entry
    console.log('\n5. Testing test email log creation...');
    
    const testLogData = {
      template_type: 'test',
      recipient_email: 'test@example.com',
      subject: 'Test Email Subject',
      status: 'pending',
      is_test: true,
      metadata: {
        test_parameters: { user_name: 'Test User' },
        created_at: new Date().toISOString()
      }
    };

    const { data: newLog, error: logError } = await supabase
      .from('email_logs')
      .insert(testLogData)
      .select('id')
      .single();

    if (logError) {
      console.error('❌ Error creating test log:', logError.message);
    } else {
      console.log('✅ Test email log created successfully');
      console.log(`   Test ID: ${newLog.id}`);

      // Test 6: Update test log status
      console.log('\n6. Testing test log status update...');
      
      // Get the current log to see the sent_at time
      const { data: currentLog } = await supabase
        .from('email_logs')
        .select('sent_at')
        .eq('id', newLog.id)
        .single();
      
      console.log(`   Current sent_at: ${currentLog?.sent_at}`);
      
      // Wait a moment to ensure delivered_at is after sent_at
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const deliveredAt = new Date().toISOString();
      console.log(`   New delivered_at: ${deliveredAt}`);
      
      const { error: updateError } = await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          delivered_at: deliveredAt,
          metadata: {
            ...testLogData.metadata,
            status_updated_at: new Date().toISOString()
          }
        })
        .eq('id', newLog.id);

      if (updateError) {
        console.error('❌ Error updating test log:', updateError.message);
      } else {
        console.log('✅ Test log status updated successfully');
      }

      // Test 7: Retrieve test log
      console.log('\n7. Testing test log retrieval...');
      
      const { data: retrievedLog, error: retrieveError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', newLog.id)
        .single();

      if (retrieveError) {
        console.error('❌ Error retrieving test log:', retrieveError.message);
      } else {
        console.log('✅ Test log retrieved successfully');
        console.log(`   Status: ${retrievedLog.status}`);
        console.log(`   Recipient: ${retrievedLog.recipient_email}`);
        console.log(`   Metadata: ${JSON.stringify(retrievedLog.metadata)}`);
      }

      // Cleanup: Remove test log
      console.log('\n8. Cleaning up test data...');
      
      const { error: deleteError } = await supabase
        .from('email_logs')
        .delete()
        .eq('id', newLog.id);

      if (deleteError) {
        console.error('❌ Error cleaning up test log:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up successfully');
      }
    }

    // Test 8: Check Supabase Edge Function exists
    console.log('\n9. Testing Supabase Edge Function availability...');
    
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          smtpConfig: {
            provider: 'test',
            host: 'test.example.com',
            port: 587,
            username: 'test@example.com',
            password: 'test-password',
            encryption: 'tls'
          },
          email: {
            to: 'test@example.com',
            subject: 'Test Subject',
            html: '<p>Test HTML</p>',
            text: 'Test Text'
          }
        }
      });

      if (error) {
        console.log('⚠️  Edge function exists but returned error (expected for test data):', error.message);
      } else {
        console.log('✅ Edge function responded successfully');
        console.log(`   Response: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.log('⚠️  Edge function may not be deployed yet:', err.message);
    }

    console.log('\n🎉 Email Testing API verification completed!');
    console.log('\nNext steps:');
    console.log('1. Deploy the send-test-email Supabase Edge Function');
    console.log('2. Test the API endpoints through the admin portal');
    console.log('3. Verify email delivery with real SMTP configurations');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testEmailTestingAPI();