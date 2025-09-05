#!/usr/bin/env node

/**
 * Test script for email integration system
 * Tests the integration between existing application features and the email management system
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'test@example.com';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmailIntegration() {
  console.log('🧪 Testing Email Integration System...\n');

  try {
    // Test 1: Check if email management tables exist
    console.log('1️⃣ Testing database schema...');
    
    const tables = [
      'email_smtp_configs',
      'email_templates', 
      'email_logs',
      'email_settings',
      'password_reset_tokens',
      'user_notification_preferences'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
          throw error;
        }
        console.log(`   ✅ Table ${table} exists`);
      } catch (error) {
        console.log(`   ❌ Table ${table} missing or inaccessible: ${error.message}`);
      }
    }

    // Test 2: Check if default email templates exist
    console.log('\n2️⃣ Testing default email templates...');
    
    const templateTypes = ['welcome', 'lesson_reminder', 'password_reset'];
    
    for (const type of templateTypes) {
      try {
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', type)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          console.log(`   ✅ ${type} template exists (ID: ${data.id})`);
        } else {
          console.log(`   ⚠️  ${type} template not found or inactive`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${type} template: ${error.message}`);
      }
    }

    // Test 3: Check SMTP configuration
    console.log('\n3️⃣ Testing SMTP configuration...');
    
    try {
      const { data, error } = await supabase
        .from('email_smtp_configs')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        console.log(`   ✅ Active SMTP config found (Provider: ${data.provider})`);
      } else {
        console.log('   ⚠️  No active SMTP configuration found');
        console.log('   💡 Create an SMTP config in the admin portal to enable email sending');
      }
    } catch (error) {
      console.log(`   ❌ Error checking SMTP config: ${error.message}`);
    }

    // Test 4: Test password reset API
    console.log('\n4️⃣ Testing password reset API...');
    
    try {
      const response = await fetch(`${SUPABASE_URL.replace('54321', '3000')}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: TEST_EMAIL }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('   ✅ Password reset API is working');
        console.log(`   📧 Response: ${result.message}`);
      } else {
        console.log(`   ⚠️  Password reset API returned error: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing password reset API: ${error.message}`);
      console.log('   💡 Make sure the Next.js server is running on port 3000');
    }

    // Test 5: Test notification preferences API
    console.log('\n5️⃣ Testing notification preferences API...');
    
    try {
      const response = await fetch(`${SUPABASE_URL.replace('54321', '3000')}/api/user/notification-preferences`);
      
      if (response.status === 401) {
        console.log('   ✅ Notification preferences API is protected (401 Unauthorized)');
      } else {
        const result = await response.json();
        console.log(`   ⚠️  Unexpected response: ${response.status} - ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing notification preferences API: ${error.message}`);
    }

    // Test 6: Check cron jobs
    console.log('\n6️⃣ Testing cron job configuration...');
    
    try {
      const { data, error } = await supabase
        .from('cron_job_status')
        .select('*');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log('   ✅ Cron jobs configured:');
        data.forEach(job => {
          console.log(`      - ${job.jobname}: ${job.schedule} (${job.active ? 'Active' : 'Inactive'})`);
        });
      } else {
        console.log('   ⚠️  No cron jobs found');
      }
    } catch (error) {
      console.log(`   ❌ Error checking cron jobs: ${error.message}`);
    }

    // Test 7: Test Edge Functions
    console.log('\n7️⃣ Testing Edge Functions...');
    
    const functions = ['send-integrated-email', 'schedule-lesson-reminders'];
    
    for (const funcName of functions) {
      try {
        const { error } = await supabase.functions.invoke(funcName, {
          body: { test: true }
        });

        if (error) {
          if (error.message.includes('not found')) {
            console.log(`   ⚠️  Function ${funcName} not deployed`);
          } else {
            console.log(`   ✅ Function ${funcName} is accessible`);
          }
        } else {
          console.log(`   ✅ Function ${funcName} is working`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing function ${funcName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Email integration testing complete!');
    console.log('\n📋 Summary:');
    console.log('   - Database schema: Check individual table results above');
    console.log('   - Email templates: Check if all required templates exist');
    console.log('   - SMTP config: Configure in admin portal if missing');
    console.log('   - APIs: Should be working if Next.js server is running');
    console.log('   - Cron jobs: Should be active for automated reminders');
    console.log('   - Edge functions: Deploy if missing');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEmailIntegration().catch(console.error);