const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function extractAndRestoreUsers() {
  console.log('=== EXTRACTING USER DATA FROM BACKUP ===\n');
  
  const content = fs.readFileSync('temp_complete_original.sql', 'utf8');
  
  // Extract tutors data
  const tutorsMatch = content.match(/INSERT INTO "public"\."tutors"[^;]+;/gs);
  const studentsMatch = content.match(/INSERT INTO "public"\."students"[^;]+;/gs);
  
  console.log(`Found ${tutorsMatch ? tutorsMatch.length : 0} tutor INSERT statements`);
  console.log(`Found ${studentsMatch ? studentsMatch.length : 0} student INSERT statements\n`);
  
  if (tutorsMatch) {
    console.log('Sample tutor data:');
    console.log(tutorsMatch[0].substring(0, 200) + '...\n');
  }
  
  if (studentsMatch) {
    console.log('Sample student data:');
    console.log(studentsMatch[0].substring(0, 200) + '...\n');
  }
  
  // Extract auth.users data
  const authUsersMatch = content.match(/INSERT INTO "auth"\."users"[^;]+;/gs);
  console.log(`Found ${authUsersMatch ? authUsersMatch.length : 0} auth.users INSERT statements\n`);
  
  // Create a restore SQL file with just the essential data
  let restoreSQL = `
-- Restore essential user data
-- Generated from temp_complete_original.sql

SET session_replication_role = replica;

-- Clear existing data (except the 15 users we want to keep)
-- We'll merge the data instead

`;
  
  if (tutorsMatch) {
    restoreSQL += '\n-- Restore tutors\n';
    tutorsMatch.forEach(stmt => {
      restoreSQL += stmt + '\n';
    });
  }
  
  if (studentsMatch) {
    restoreSQL += '\n-- Restore students\n';
    studentsMatch.forEach(stmt => {
      restoreSQL += stmt + '\n';
    });
  }
  
  restoreSQL += '\nSET session_replication_role = DEFAULT;\n';
  
  fs.writeFileSync('restore-users-only.sql', restoreSQL);
  console.log('✅ Created restore-users-only.sql with essential data\n');
  console.log('📝 File size:', (fs.statSync('restore-users-only.sql').size / 1024).toFixed(2), 'KB\n');
  
  console.log('🚀 TO RESTORE:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Create new query');
  console.log('3. Copy contents of restore-users-only.sql');
  console.log('4. Run the query');
  console.log('\nOR use psql:');
  console.log('psql [connection-string] < restore-users-only.sql');
}

extractAndRestoreUsers().catch(console.error);
