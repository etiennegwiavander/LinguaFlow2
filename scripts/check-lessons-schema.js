const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking lessons table schema...\n');

  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Available columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\nSample lesson:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No lessons found');
  }
}

checkSchema().catch(console.error);
