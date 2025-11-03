// Check email logs for errors
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmailErrors() {
  console.log('📬 Checking email logs for errors...\n');
  
  const { data: logs, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching logs:', error.message);
    return;
  }
  
  if (!logs || logs.length === 0) {
    console.log('📭 No email logs found');
    return;
  }
  
  console.log(`Found ${logs.length} email log(s):\n`);
  
  logs.forEach((log, index) => {
    console.log(`Log ${index + 1}:`);
    console.log(`  ID: ${log.id}`);
    console.log(`  Type: ${log.template_type}`);
    console.log(`  To: ${log.recipient_email}`);
    console.log(`  Subject: ${log.subject}`);
    console.log(`  Status: ${log.status}`);
    console.log(`  Created: ${new Date(log.created_at).toLocaleString()}`);
    if (log.sent_at) {
      console.log(`  Sent: ${new Date(log.sent_at).toLocaleString()}`);
    }
    if (log.error_message) {
      console.log(`  ❌ Error: ${log.error_message}`);
    }
    if (log.error_code) {
      console.log(`  Error Code: ${log.error_code}`);
    }
    if (log.metadata) {
      console.log(`  Metadata:`, JSON.stringify(log.metadata, null, 2));
    }
    console.log('');
  });
}

checkEmailErrors().catch(console.error);
