// Apply subscription migration directly to remote database
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
    console.log('📊 Executing SQL...\n');

    // Split the migration into individual statements
    // We'll execute them one by one to get better error messages
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and DO blocks that are just messages
      if (statement.includes('RAISE NOTICE')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sql: statement }),
          });

          if (!response.ok) {
            console.log(`⚠️  Statement ${i + 1}: Skipped (may already exist)`);
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Ignore errors for statements that might already exist
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration process complete`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped/Errors: ${errorCount}`);
    console.log('\n🧪 Running verification...\n');

    // Verify the tables were created
    const tables = [
      'subscription_plans',
      'user_subscriptions',
      'usage_tracking',
      'payment_transactions',
      'subscription_history',
    ];

    let allTablesExist = true;
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: Not found`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: Created successfully`);
      }
    }

    if (allTablesExist) {
      console.log('\n🎉 Subscription system migration applied successfully!');
    } else {
      console.log('\n⚠️  Some tables were not created. Manual intervention may be required.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
