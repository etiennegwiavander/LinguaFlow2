require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!resendApiKey) {
  console.error('❌ Missing RESEND_API_KEY in .env.local');
  console.log('Please add your Resend API key to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSMTP() {
  console.log('🔧 Setting up SMTP configuration...\n');

  try {
    // Check if table exists
    const { data: tables, error: tableError } = await supabase
      .from('smtp_configurations')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('⚠️  smtp_configurations table does not exist');
      console.log('Please run the migration first:');
      console.log('  supabase db push\n');
      process.exit(1);
    }

    // Check for existing active config
    const { data: existingActive } = await supabase
      .from('smtp_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (existingActive) {
      console.log('✅ Active SMTP configuration already exists:');
      console.log(`   Name: ${existingActive.name}`);
      console.log(`   Provider: ${existingActive.provider}`);
      console.log(`   From: ${existingActive.from_email}\n`);
      return;
    }

    // Create or update Resend configuration
    const { data: existing } = await supabase
      .from('smtp_configurations')
      .select('*')
      .eq('provider', 'resend')
      .single();

    const smtpConfig = {
      name: 'Resend SMTP',
      provider: 'resend',
      host: 'smtp.resend.com',
      port: 587,
      username: 'resend',
      password_encrypted: resendApiKey, // In production, this should be encrypted
      from_email: 'onboarding@resend.dev',
      from_name: 'LinguaFlow',
      use_tls: true,
      use_ssl: false,
      is_active: true,
      is_default: true
    };

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('smtp_configurations')
        .update(smtpConfig)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      console.log('✅ Updated existing Resend SMTP configuration');
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('smtp_configurations')
        .insert([smtpConfig]);

      if (insertError) throw insertError;
      console.log('✅ Created new Resend SMTP configuration');
    }

    console.log('\n📧 SMTP Configuration Details:');
    console.log('   Provider: Resend');
    console.log('   Host: smtp.resend.com');
    console.log('   Port: 587');
    console.log('   From: onboarding@resend.dev');
    console.log('   Status: Active ✓\n');

    console.log('🎉 SMTP setup complete! Welcome emails will now be sent.\n');

  } catch (error) {
    console.error('❌ Error setting up SMTP:', error.message);
    process.exit(1);
  }
}

setupSMTP();
