// Simple script to check if tutors data was restored
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey, serviceRoleKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
    if (line.startsWith('SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
  });
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

// Use service role key to bypass RLS
const keyToUse = serviceRoleKey || supabaseKey;

if (!supabaseUrl || !keyToUse) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

console.log(`Using ${serviceRoleKey ? 'SERVICE_ROLE' : 'ANON'} key for database access\n`);

const supabase = createClient(supabaseUrl, keyToUse);

async function checkTutors() {
  try {
    console.log('Checking multilingual tutor-student matching data...\n');
    
    // Get all tutors with their teaching languages
    const { data: tutors, error } = await supabase
      .from('tutors')
      .select('id, name, email, primary_teaching_language, is_admin, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tutors:', error);
      return;
    }

    console.log(`Found ${tutors.length} tutors:\n`);
    
    tutors.forEach((tutor, index) => {
      console.log(`${index + 1}. ${tutor.name || 'Unnamed'} (${tutor.email})`);
      console.log(`   Teaching Language: ${tutor.primary_teaching_language || 'Not specified'}`);
      console.log(`   Admin: ${tutor.is_admin ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Get students with their target languages
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, target_language, native_language, tutor_id, tutors(name, primary_teaching_language)')
      .order('name', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }

    console.log(`\nFound ${students.length} students:\n`);
    
    // Group by language pairs
    const languagePairs = {};
    
    students.forEach((student) => {
      const tutorTeachingLang = student.tutors?.primary_teaching_language || 'Unknown';
      const studentTargetLang = student.target_language;
      const pairKey = `${tutorTeachingLang} → ${studentTargetLang}`;
      
      if (!languagePairs[pairKey]) {
        languagePairs[pairKey] = [];
      }
      
      languagePairs[pairKey].push({
        student: student.name,
        tutor: student.tutors?.name || 'Unknown',
        native: student.native_language
      });
    });

    console.log('=== MULTILINGUAL MATCHING ANALYSIS ===\n');
    
    Object.keys(languagePairs).forEach(pair => {
      console.log(`📚 ${pair}:`);
      languagePairs[pair].forEach(match => {
        console.log(`   • ${match.student} (native: ${match.native}) ← taught by → ${match.tutor}`);
      });
      console.log('');
    });

    // Language coverage analysis
    const teachingLanguages = [...new Set(tutors.map(t => t.primary_teaching_language).filter(Boolean))];
    const targetLanguages = [...new Set(students.map(s => s.target_language))];
    
    console.log('=== LANGUAGE COVERAGE ===');
    console.log(`Teaching Languages Available: ${teachingLanguages.join(', ')}`);
    console.log(`Target Languages Requested: ${targetLanguages.join(', ')}`);
    
    // Check for mismatches
    const mismatches = students.filter(s => {
      const tutorLang = s.tutors?.primary_teaching_language;
      return tutorLang && tutorLang.toLowerCase() !== 'english' && s.target_language !== tutorLang.toLowerCase().substring(0, 2);
    });
    
    if (mismatches.length > 0) {
      console.log('\n⚠️  POTENTIAL MISMATCHES:');
      mismatches.forEach(s => {
        console.log(`   • ${s.name} wants ${s.target_language} but tutor teaches ${s.tutors?.primary_teaching_language}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTutors();