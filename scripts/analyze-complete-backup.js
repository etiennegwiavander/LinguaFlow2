const fs = require('fs');

console.log('=== ANALYZING COMPLETE BACKUP FILE ===\n');

const content = fs.readFileSync('temp_complete_original.sql', 'utf8');

// Extract all tutor emails
const tutorMatches = content.match(/INSERT INTO "public"\."tutors"[^;]+;/gs);
if (tutorMatches) {
  console.log(`Found ${tutorMatches.length} tutor INSERT statement(s)\n`);
  
  // Parse the tutor data
  const tutorData = tutorMatches[0];
  const tutorEmails = tutorData.match(/'([^']+@[^']+)'/g);
  
  if (tutorEmails) {
    const emails = tutorEmails.map(e => e.replace(/'/g, ''));
    console.log(`TOTAL TUTORS: ${emails.length}\n`);
    console.log('All tutor emails:');
    emails.forEach((email, i) => {
      console.log(`  ${i + 1}. ${email}`);
    });
  }
}

console.log('\n' + '='.repeat(60) + '\n');

// Extract all student names
const studentMatches = content.match(/INSERT INTO "public"\."students"[^;]+;/gs);
if (studentMatches) {
  console.log(`Found ${studentMatches.length} student INSERT statement(s)\n`);
  
  // Parse student data - look for student names
  const studentData = studentMatches[0];
  // Match pattern: UUID, UUID, 'Name'
  const studentPattern = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',/g;
  const students = [];
  let match;
  
  while ((match = studentPattern.exec(studentData)) !== null) {
    students.push({
      id: match[1],
      tutor_id: match[2],
      name: match[3]
    });
  }
  
  console.log(`TOTAL STUDENTS: ${students.length}\n`);
  console.log('All students:');
  students.forEach((student, i) => {
    console.log(`  ${i + 1}. ${student.name} (tutor: ${student.tutor_id.substring(0, 8)}...)`);
  });
}

console.log('\n' + '='.repeat(60) + '\n');

// Check auth.users
const authUsersMatch = content.match(/INSERT INTO "auth"\."users"[^;]+;/gs);
if (authUsersMatch) {
  console.log(`Found ${authUsersMatch.length} auth.users INSERT statement(s)\n`);
  
  const authData = authUsersMatch[0];
  const authEmails = authData.match(/"email":"([^"]+)"/g);
  
  if (authEmails) {
    const emails = authEmails.map(e => e.match(/"email":"([^"]+)"/)[1]);
    console.log(`TOTAL AUTH USERS: ${emails.length}\n`);
    console.log('All auth.users emails:');
    emails.forEach((email, i) => {
      console.log(`  ${i + 1}. ${email}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('\nSUMMARY:');
console.log(`  - Tutors in backup: ${tutorMatches ? 'checking...' : 0}`);
console.log(`  - Students in backup: ${studentMatches ? 'checking...' : 0}`);
console.log(`  - Auth users in backup: ${authUsersMatch ? 'checking...' : 0}`);
