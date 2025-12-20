const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreFromBackup() {
  console.log('=== RESTORING DATABASE FROM BACKUP ===\n');
  console.log('⚠️  This will restore ALL data from temp_complete_original.sql');
  console.log('⚠️  Including users, students, lessons, and all other data\n');
  
  // Check if backup file exists
  if (!fs.existsSync('temp_complete_original.sql')) {
    console.error('❌ Backup file not found: temp_complete_original.sql');
    return;
  }
  
  const fileSize = fs.statSync('temp_complete_original.sql').size;
  console.log(`✓ Backup file found: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log('To restore this backup, you need to use psql or Supabase CLI:');
  console.log('\nOption 1: Using psql (if you have PostgreSQL installed)');
  console.log('----------------------------------------------------------');
  console.log('psql -h [your-supabase-host] -U postgres -d postgres < temp_complete_original.sql');
  console.log('\nYou can find your connection details in Supabase Dashboard:');
  console.log('Settings → Database → Connection string\n');
  
  console.log('Option 2: Using Supabase CLI');
  console.log('----------------------------------------------------------');
  console.log('supabase db push --db-url "postgresql://postgres:[password]@[host]:5432/postgres" --file temp_complete_original.sql');
  console.log('\nOR restore via SQL Editor in Supabase Dashboard:');
  console.log('1. Go to SQL Editor in Supabase Dashboard');
  console.log('2. Create new query');
  console.log('3. Copy contents of temp_complete_original.sql');
  console.log('4. Run the query (may need to run in chunks)\n');
  
  console.log('Checking what data is in the backup...\n');
  
  // Read first part of file to show what's in it
  const content = fs.readFileSync('temp_complete_original.sql', 'utf8');
  
  // Count INSERT statements for different tables
  const tutorsCount = (content.match(/INSERT INTO "public"\."tutors"/g) || []).length;
  const studentsCount = (content.match(/INSERT INTO "public"\."students"/g) || []).length;
  const lessonsCount = (content.match(/INSERT INTO "public"\."lessons"/g) || []).length;
  const authUsersCount = (content.match(/INSERT INTO "auth"\."users"/g) || []).length;
  
  console.log('📊 Backup contains:');
  console.log(`   - Auth users: ~${authUsersCount} INSERT statements`);
  console.log(`   - Tutors: ~${tutorsCount} INSERT statements`);
  console.log(`   - Students: ~${studentsCount} INSERT statements`);
  console.log(`   - Lessons: ~${lessonsCount} INSERT statements`);
  console.log('\n✅ This backup contains your complete database!');
  console.log('\n🚀 NEXT STEP: Restore using one of the methods above');
}

restoreFromBackup().catch(console.error);
