require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixSMTPConfig() {
  console.log('🔧 Fixing SMTP Configuration\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Update the Resend SMTP config with proper email format
  const { data, error } = await supabase
    .from('email_smtp_configs')
    .update({
      username: 'LinguaFlow <noreply@linguaflow.online>',
      updated_at: new Date().toISOString()
    })
    .eq('provider', 'resend')
    .eq('is_active', true)
    .select();
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ SMTP Configuration Updated Successfully!\n');
  console.log('New configuration:');
  console.log(`  Provider: ${data[0].provider}`);
  console.log(`  From: ${data[0].username}`);
  console.log(`  Format: "Name <email@domain.com>" ✅`);
  console.log('');
  console.log('🎉 Lesson reminders should now work correctly!');
}

fixSMTPConfig();
