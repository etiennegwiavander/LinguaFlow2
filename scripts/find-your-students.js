require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findYourStudents() {
  console.log('🔍 Finding where your students are now located...\n');

  try {
    // The original problematic tutor was vanshidy@gmail.com
    // Let's see where those students went
    
    console.log('📚 Students that were originally under vanshidy@gmail.com:');
    const { data: originalStudents, error: originalError } = await supabase
      .from('students')
      .select(`
        id, 
        name, 
        tutor_id,
        tutors!inner(email, name)
      `)
      .in('name', ['Ula', 'Pawel', 'Julia']); // These were shown as vanshidy@gmail.com students

    if (originalError) {
      console.error('❌ Error:', originalError);
    } else {
      originalStudents.forEach(student => {
        console.log(`  - ${student.name} -> Now under: ${student.tutors.email}`);
      });
    }

    // Find the tutor with the most students (likely where your students went)
    console.log('\n👥 Tutors with the most students:');
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select(`
        tutor_id,
        tutors!inner(email, name)
      `);

    if (studentsError) {
      console.error('❌ Error:', studentsError);
      return;
    }

    const tutorCounts = {};
    allStudents.forEach(student => {
      const tutorEmail = student.tutors.email;
      tutorCounts[tutorEmail] = (tutorCounts[tutorEmail] || 0) + 1;
    });

    const sortedTutors = Object.entries(tutorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    sortedTutors.forEach(([email, count]) => {
      console.log(`  ${email}: ${count} students`);
    });

    console.log('\n🎯 RECOMMENDATION:');
    console.log(`Log in as: ${sortedTutors[0][0]} (has ${sortedTutors[0][1]} students)`);
    console.log('This is likely where most of your students are now located.');

    // Show some student names under the top tutor
    const topTutorEmail = sortedTutors[0][0];
    const { data: topTutorStudents, error: topError } = await supabase
      .from('students')
      .select(`
        name,
        tutors!inner(email)
      `)
      .eq('tutors.email', topTutorEmail)
      .limit(10);

    if (!topError && topTutorStudents.length > 0) {
      console.log(`\n📋 Students under ${topTutorEmail}:`);
      topTutorStudents.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.name}`);
      });
      if (topTutorStudents.length === 10) {
        console.log('  ... and more');
      }
    }

    console.log('\n🔧 If you want to restore the original ownership:');
    console.log('I can create a script to move all students back to your preferred tutor account.');
    console.log('Just let me know which email address you want to use as the main tutor.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

findYourStudents();