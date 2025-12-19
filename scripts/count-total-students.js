require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function countTotalStudents() {
  console.log('📊 Counting total students on the platform...\n');

  try {
    // Get total count of students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        name,
        level,
        target_language,
        native_language,
        created_at,
        tutors!inner(email)
      `)
      .order('created_at', { ascending: true });

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    console.log(`🎯 TOTAL STUDENTS ON PLATFORM: ${students.length}\n`);

    // Group by tutor
    const tutorGroups = {};
    students.forEach(student => {
      const tutorEmail = student.tutors.email;
      if (!tutorGroups[tutorEmail]) {
        tutorGroups[tutorEmail] = [];
      }
      tutorGroups[tutorEmail].push(student);
    });

    console.log('📋 DISTRIBUTION BY TUTOR:');
    Object.entries(tutorGroups)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([email, tutorStudents]) => {
        console.log(`  ${email}: ${tutorStudents.length} students`);
      });

    // Count by language
    console.log('\n🌍 DISTRIBUTION BY TARGET LANGUAGE:');
    const languageGroups = {};
    students.forEach(student => {
      const lang = student.target_language || 'Not specified';
      languageGroups[lang] = (languageGroups[lang] || 0) + 1;
    });

    Object.entries(languageGroups)
      .sort(([,a], [,b]) => b - a)
      .forEach(([lang, count]) => {
        console.log(`  ${lang}: ${count} students`);
      });

    // Count by level
    console.log('\n📈 DISTRIBUTION BY LEVEL:');
    const levelGroups = {};
    students.forEach(student => {
      const level = student.level || 'Not specified';
      levelGroups[level] = (levelGroups[level] || 0) + 1;
    });

    Object.entries(levelGroups)
      .sort(([,a], [,b]) => b - a)
      .forEach(([level, count]) => {
        console.log(`  ${level}: ${count} students`);
      });

    // Count lessons
    console.log('\n📚 LESSON STATISTICS:');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id');

    if (!lessonsError) {
      console.log(`  Total lessons: ${lessons.length}`);
      console.log(`  Average lessons per student: ${(lessons.length / students.length).toFixed(1)}`);
    }

    // Recent additions
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentStudents = students.filter(s => new Date(s.created_at) > oneMonthAgo);
    console.log(`\n📅 RECENT ACTIVITY:`);
    console.log(`  Students added in last 30 days: ${recentStudents.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

countTotalStudents();