// Test if email_logs table exists and what columns it has
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailLogsTable() {
  console.log('🔍 Testing email_logs table...\n');
  
  // Try to select all columns
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nThe email_logs table might not exist or have permission issues.');
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Table exists with data!');
    console.log('\nColumns found:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}`);
    });
    console.log('\nSample record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('✅ Table exists but is empty');
    console.log('\nTrying to insert a test record to see what columns are expected...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('email_logs')
      .insert({
        template_type: 'test',
        recipient_email: 'test@example.com',
        subject: 'Test Email',
        status: 'pending'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
    } else if (insertData && insertData.length > 0) {
      console.log('✅ Test record inserted successfully!');
      console.log('\nColumns in table:');
      Object.keys(insertData[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Clean up test record
      await supabase
        .from('email_logs')
        .delete()
        .eq('id', insertData[0].id);
      console.log('\n✅ Test record cleaned up');
    }
  }
}

testEmailLogsTable().catch(console.error);
