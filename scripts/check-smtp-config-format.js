require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSMTPConfig() {
  console.log('🔍 Checking SMTP Configuration Format\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: configs, error } = await supabase
    .from('email_smtp_configs')
    .select('*')
    .eq('is_active', true);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📧 Active SMTP Configurations:\n');
  configs.forEach((config, index) => {
    console.log(`Config ${index + 1}:`);
    console.log(`  ID: ${config.id}`);
    console.log(`  Provider: ${config.provider}`);
    console.log(`  Username/From: "${config.username}"`);
    console.log(`  Is Active: ${config.is_active}`);
    console.log('');
    
    // Check format
    if (config.username) {
      if (config.username.includes('<') && config.username.includes('>')) {
        console.log('  ✅ Format: "Name <email@domain.com>" - CORRECT');
      } else if (config.username.includes('@')) {
        console.log('  ⚠️  Format: "email@domain.com" - NEEDS NAME');
      } else {
        console.log('  ❌ Format: Invalid');
      }
    }
    console.log('');
  });
}

checkSMTPConfig();
