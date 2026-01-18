const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔧 Applying interactive_content_snapshot migration...\n');

  try {
    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'shared_lessons' 
          AND column_name = 'interactive_content_snapshot';
        `
      });

    if (checkError) {
      console.log('⚠️  Could not check if column exists (this is okay, will try to add it anyway)');
    } else if (columns && columns.length > 0) {
      console.log('✅ Column already exists! No migration needed.');
      return;
    }

    // Apply the migration using raw SQL
    console.log('📝 Adding interactive_content_snapshot column...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE shared_lessons 
        ADD COLUMN IF NOT EXISTS interactive_content_snapshot JSONB;
        
        COMMENT ON COLUMN shared_lessons.interactive_content_snapshot IS 
        'Snapshot of the interactive lesson content at the time of sharing. This ensures shared links always show the correct content even if the parent lesson is regenerated with different content.';
      `
    });

    if (error) {
      console.error('❌ Error applying migration:', error);
      console.log('\n📋 Please apply this SQL manually in Supabase Dashboard > SQL Editor:\n');
      console.log('----------------------------------------');
      console.log(`
ALTER TABLE shared_lessons 
ADD COLUMN IF NOT EXISTS interactive_content_snapshot JSONB;

COMMENT ON COLUMN shared_lessons.interactive_content_snapshot IS 
'Snapshot of the interactive lesson content at the time of sharing. This ensures shared links always show the correct content even if the parent lesson is regenerated with different content.';
      `);
      console.log('----------------------------------------\n');
      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n🎉 You can now share lessons and they will store content snapshots.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📋 Please apply this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log('----------------------------------------');
    console.log(`
ALTER TABLE shared_lessons 
ADD COLUMN IF NOT EXISTS interactive_content_snapshot JSONB;

COMMENT ON COLUMN shared_lessons.interactive_content_snapshot IS 
'Snapshot of the interactive lesson content at the time of sharing. This ensures shared links always show the correct content even if the parent lesson is regenerated with different content.';
    `);
    console.log('----------------------------------------\n');
  }
}

applyMigration();
