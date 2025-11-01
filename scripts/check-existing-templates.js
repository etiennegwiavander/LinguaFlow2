const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingTemplates() {
  console.log('=== CHECKING EXISTING EMAIL DATA ===\n');

  // Check SMTP configs
  console.log('1. SMTP Configurations:');
  const { data: smtpConfigs } = await supabase
    .from('email_smtp_configs')
    .select('*');
  
  console.log(`   Found ${smtpConfigs?.length || 0} configs`);
  smtpConfigs?.forEach(config => {
    console.log(`   - ${config.name} (${config.provider}) - Active: ${config.is_active}`);
  });

  // Check templates
  console.log('\n2. Email Templates:');
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*');
  
  console.log(`   Found ${templates?.length || 0} templates`);
  templates?.forEach(template => {
    console.log(`   - ${template.name} (${template.type}) - Active: ${template.is_active}`);
  });

  // Check email logs
  console.log('\n3. Email Logs:');
  const { data: logs } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(5);
  
  console.log(`   Found ${logs?.length || 0} recent logs`);
  logs?.forEach(log => {
    console.log(`   - ${log.recipient_email} (${log.status}) - ${log.template_type}`);
  });

  console.log('\n=== SUMMARY ===');
  console.log(`SMTP Configs: ${smtpConfigs?.length || 0}`);
  console.log(`Templates: ${templates?.length || 0}`);
  console.log(`Email Logs: ${logs?.length || 0}`);
  
  if (templates && templates.length > 0) {
    console.log('\n⚠️  Templates already exist. The admin dashboard should show real data now!');
    console.log('Go to: http://localhost:3000/admin-portal/email');
  }
}

checkExistingTemplates();
