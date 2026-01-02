// Apply subscription migration using Supabase SQL editor approach
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying Subscription System Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250102000001_create_subscription_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing migration via SQL...\n');

    // Execute the entire migration as one transaction
    const { data, error } = await supabase.rpc('exec_sql', { query: migrationSQL });

    if (error) {
      console.log('⚠️  RPC method not available, trying alternative approach...\n');
      
      // Alternative: Use the REST API directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal',
        },
      });

      console.log('📝 Please apply the migration manually using Supabase SQL Editor:');
      console.log('   1. Go to https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/sql');
      console.log('   2. Copy the contents of: supabase/migrations/20250102000001_create_subscription_system.sql');
      console.log('   3. Paste and run in the SQL editor\n');
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify the tables
    console.log('🧪 Verifying tables...\n');
    
    const tables = [
      'subscription_plans',
      'user_subscriptions',
      'usage_tracking',
      'payment_transactions',
      'subscription_history',
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

applyMigration();
