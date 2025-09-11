#!/usr/bin/env node

/**
 * Setup default SMTP configuration for email system
 * This creates a mock SMTP config for development/testing
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const defaultSMTPConfig = {
  name: 'Development SMTP (Mock)',
  provider: 'mock',
  host: 'mock.smtp.server',
  port: 587,
  username: 'mock@linguaflow.com',
  password: 'mock-password-encrypted', // This would be encrypted in real implementation
  use_tls: true,
  from_email: 'noreply@linguaflow.com',
  from_name: 'LinguaFlow',
  is_active: true,
  created_by: 'system',
  settings: {
    mock: true,
    description: 'Mock SMTP configuration for development and testing',
    note: 'This configuration will simulate email sending without actually sending emails'
  }
};

async function setupDefaultSMTPConfig() {
  console.log('🔧 Setting up default SMTP configuration...\n');

  try {
    // Check if any SMTP config already exists
    const { data: existing } = await supabase
      .from('email_smtp_configs')
      .select('id, name, is_active')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('⚠️  SMTP configuration already exists:');
      existing.forEach(config => {
        console.log(`   - ${config.name} (Active: ${config.is_active})`);
      });
      
      // Check if there's an active one
      const activeConfig = existing.find(config => config.is_active);
      if (activeConfig) {
        console.log('\n✅ Active SMTP configuration found, skipping setup...');
        return;
      } else {
        console.log('\n⚠️  No active SMTP configuration found, creating default...');
      }
    }

    // Create the default SMTP configuration
    const { data, error } = await supabase
      .from('email_smtp_configs')
      .insert(defaultSMTPConfig)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Created default SMTP configuration (ID: ${data.id})`);
    console.log(`   Provider: ${data.provider}`);
    console.log(`   Host: ${data.host}:${data.port}`);
    console.log(`   From: ${data.from_name} <${data.from_email}>`);
    console.log(`   Active: ${data.is_active}`);

    // Verify the configuration
    console.log('\n📋 Verifying SMTP configuration...');
    const { data: configs, error: verifyError } = await supabase
      .from('email_smtp_configs')
      .select('id, name, provider, is_active')
      .eq('is_active', true);

    if (verifyError) {
      throw verifyError;
    }

    if (configs && configs.length > 0) {
      console.log('✅ Active SMTP configurations:');
      configs.forEach(config => {
        console.log(`   - ${config.name} (${config.provider})`);
      });
    } else {
      console.log('❌ No active SMTP configurations found after setup');
    }

    console.log('\n🎉 SMTP configuration setup complete!');
    console.log('\n💡 Note: This is a mock configuration for development.');
    console.log('   For production, configure a real SMTP provider in the admin portal.');

  } catch (error) {
    console.error('❌ Error setting up SMTP configuration:', error);
    process.exit(1);
  }
}

// Run the setup
setupDefaultSMTPConfig().catch(console.error);