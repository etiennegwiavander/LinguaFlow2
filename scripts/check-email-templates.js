require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplates() {
  console.log('Checking email templates...\n');
  
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No templates found in database.');
    return;
  }

  console.log(`Found ${data.length} templates:\n`);
  data.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   Type: ${template.type}`);
    console.log(`   Subject: ${template.subject}`);
    console.log(`   Active: ${template.is_active}`);
    console.log(`   Default: ${template.is_default}`);
    console.log(`   ID: ${template.id}`);
    console.log('');
  });
}

checkTemplates();
