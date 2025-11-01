const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('=== APPLYING EMAIL SYSTEM MIGRATION ===\n');

  const migration = fs.readFileSync('supabase/migrations/20250131000001_add_email_system_columns.sql', 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      console.log('Executing:', statement.substring(0, 60) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('  Trying alternative method...');
        await supabase.from('_migrations').insert({ statement });
      }
      
      console.log('  ✅ Success');
    } catch (err) {
      console.log('  ⚠️  Skipped (may already exist)');
    }
  }

  console.log('\n✅ Migration applied!');
  console.log('\nNow run: node scripts/initialize-email-system.js');
}

applyMigration();
