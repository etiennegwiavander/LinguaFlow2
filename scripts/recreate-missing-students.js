require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const vanshidyTutorId = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689';

// Missing students to recreate (based on your authoritative list)
const missingStudents = [
  { name: 'Ayako', level: 'b2', target_language: 'en', native_language: 'ja' },
  { name: 'Mine', level: 'b2', target_language: 'en', native_language: 'tr' },
  { name: 'Blondel', level: 'b2', target_language: 'en', native_language: 'fr' },
  { name: 'Zuzia', level: 'b1', target_language: 'en', native_language: 'pl' },
  { name: 'Radek', level: 'a1', target_language: 'en', native_language: 'pl' },
  { name: 'Heloise', level: 'b2', target_language: 'en', native_language: 'fr' },
  { name: 'Oana', level: 'b1', target_language: 'en', native_language: 'ro' },
  { name: 'Bartek', level: 'b1', target_language: 'en', native_language: 'pl' },
  { name: 'Natalia', level: 'b2', target_language: 'en', native_language: 'pl' },
  { name: 'Jevgenij', level: 'b1', target_language: 'en', native_language: 'ru' }
];

async function recreateMissingStudents() {
  console.log('🔧 RECREATING MISSING STUDENTS...\n');
  console.log(`Creating ${missingStudents.length} students for vanshidy@gmail.com\n`);

  let createdCount = 0;
  let errorCount = 0;

  for (const student of missingStudents) {
    const studentData = {
      id: uuidv4(),
      tutor_id: vanshidyTutorId,
      name: student.name,
      target_language: student.target_language,
      level: student.level,
      native_language: student.native_language,
      age_group: 'adult', // Required field
      end_goals: 'To improve English fluency and communication skills',
      grammar_weaknesses: '',
      vocabulary_gaps: '',
      pronunciation_challenges: '',
      conversational_fluency_barriers: '',
      learning_styles: ['visual', 'auditory'],
      notes: 'Student recreated after data loss',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select();

    if (error) {
      console.error(`❌ Failed to create ${student.name}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Created ${student.name} (${student.level}, ${student.target_language})`);
      createdCount++;
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Successfully created: ${createdCount} students`);
  console.log(`❌ Failed: ${errorCount} students`);

  // Final verification
  const { data: finalStudents, error: finalError } = await supabase
    .from('students')
    .select('id, name')
    .eq('tutor_id', vanshidyTutorId)
    .order('name', { ascending: true });

  if (finalError) {
    console.error('\n❌ Verification failed:', finalError);
    return;
  }

  console.log(`\n✅ vanshidy@gmail.com now has ${finalStudents.length} students:\n`);
  finalStudents.forEach((student, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${student.name}`);
  });

  console.log('\n🎉 RECREATION COMPLETE!');
}

recreateMissingStudents();
