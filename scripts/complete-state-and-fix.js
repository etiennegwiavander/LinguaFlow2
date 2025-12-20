require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AUTHORITATIVE LIST: Students that SHOULD belong to vanshidy@gmail.com
const vanshidyStudentNames = [
  'Ayako',
  'Mine',
  'Blondel',
  'Zuzia',
  'Radek',
  'Heloise',
  'Oana',
  'Bartek', // Not in database
  'Natalia',
  'Jevgenij',
  'Loisel', // Also known as Hervé
  'Hervé',  // Also known as Loisel
  'Rafal',
  'Fausta',
  'Etienne',
  'Pawel',
  'Julia',
  'Ewa',
  'Ula',
  'test 2',
  'test',
  'Krzysztof'
];

const vanshidyTutorId = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689';

async function completeStateAndFix() {
  console.log('🔍 PART 1: COMPLETE CURRENT STATE OF ALL STUDENTS\n');
  console.log('='.repeat(70) + '\n');

  // Get all students
  const { data: allStudents, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      tutor_id,
      created_at,
      tutors!inner(email)
    `)
    .order('tutors(email)', { ascending: true });

  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
    return;
  }

  console.log(`📊 TOTAL STUDENTS IN DATABASE: ${allStudents.length}\n`);

  // Group by tutor
  const tutorGroups = {};
  allStudents.forEach(student => {
    const tutorEmail = student.tutors.email;
    if (!tutorGroups[tutorEmail]) {
      tutorGroups[tutorEmail] = [];
    }
    tutorGroups[tutorEmail].push(student.name);
  });

  console.log('📋 STUDENTS BY TUTOR:\n');
  Object.entries(tutorGroups)
    .sort(([,a], [,b]) => b.length - a.length)
    .forEach(([email, students]) => {
      console.log(`${email}: ${students.length} students`);
      students.forEach(name => console.log(`  - ${name}`));
      console.log('');
    });

  console.log('\n' + '='.repeat(70));
  console.log('🔧 PART 2: FIXING VANSHIDY STUDENT ASSIGNMENTS\n');
  console.log('='.repeat(70) + '\n');

  // Normalize names for comparison
  const normalizedVanshidyNames = vanshidyStudentNames.map(n => n.toLowerCase().trim());

  // Find students that should be with vanshidy
  const shouldBeVanshidy = [];
  const alreadyCorrect = [];
  const notFound = [];

  normalizedVanshidyNames.forEach(normalizedName => {
    const student = allStudents.find(s => 
      s.name.toLowerCase().trim() === normalizedName
    );

    if (student) {
      if (student.tutor_id === vanshidyTutorId) {
        alreadyCorrect.push(student.name);
      } else {
        shouldBeVanshidy.push({
          id: student.id,
          name: student.name,
          currentTutor: student.tutors.email,
          currentTutorId: student.tutor_id
        });
      }
    } else {
      notFound.push(normalizedName);
    }
  });

  console.log(`✅ Already correctly assigned to vanshidy: ${alreadyCorrect.length}`);
  alreadyCorrect.forEach(name => console.log(`  - ${name}`));

  console.log(`\n⚠️  Need to move TO vanshidy: ${shouldBeVanshidy.length}`);
  shouldBeVanshidy.forEach(s => console.log(`  - ${s.name} (currently with ${s.currentTutor})`));

  console.log(`\n❌ Not found in database: ${notFound.length}`);
  notFound.forEach(name => console.log(`  - ${name}`));

  // Move students to vanshidy
  if (shouldBeVanshidy.length > 0) {
    console.log('\n🔄 MOVING STUDENTS TO VANSHIDY...\n');

    let movedCount = 0;
    for (const student of shouldBeVanshidy) {
      const { error: updateError } = await supabase
        .from('students')
        .update({ tutor_id: vanshidyTutorId })
        .eq('id', student.id);

      if (updateError) {
        console.error(`❌ Failed to move ${student.name}:`, updateError.message);
      } else {
        console.log(`✅ Moved ${student.name} from ${student.currentTutor} → vanshidy@gmail.com`);
        movedCount++;

        // Update lessons too
        await supabase
          .from('lessons')
          .update({ tutor_id: vanshidyTutorId })
          .eq('student_id', student.id);
      }
    }

    console.log(`\n📊 Moved ${movedCount} students to vanshidy@gmail.com`);
  }

  // Final verification
  console.log('\n' + '='.repeat(70));
  console.log('✅ FINAL VERIFICATION\n');
  console.log('='.repeat(70) + '\n');

  const { data: finalStudents, error: finalError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      tutor_id,
      tutors!inner(email)
    `)
    .eq('tutor_id', vanshidyTutorId)
    .order('name', { ascending: true });

  if (finalError) {
    console.error('❌ Verification failed:', finalError);
    return;
  }

  console.log(`📋 vanshidy@gmail.com now has ${finalStudents.length} students:\n`);
  finalStudents.forEach((student, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${student.name}`);
  });

  const expectedCount = vanshidyStudentNames.length - notFound.length;
  console.log(`\n${finalStudents.length === expectedCount ? '✅' : '⚠️'} Expected: ${expectedCount} students (${notFound.length} not found in database)`);
  console.log(`${finalStudents.length === expectedCount ? '✅' : '⚠️'} Actual: ${finalStudents.length} students`);

  if (finalStudents.length === expectedCount) {
    console.log('\n🎉 SUCCESS! All available students are now correctly assigned to vanshidy@gmail.com');
  }
}

completeStateAndFix();
