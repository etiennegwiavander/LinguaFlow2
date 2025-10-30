/**
 * Check lessons for specific students (Oana and Mine)
 */

const SUPABASE_URL = 'https://urmuwjcjcyohsrkgyapl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTEwMzE0MCwiZXhwIjoyMDY0Njc5MTQwfQ.f244RmJBYqyWf69yaEvkSla4uA9fJcoD-ze6maUINF4';

async function checkStudentLessons() {
  console.log('🔍 CHECKING STUDENT LESSONS');
  console.log('================================\n');

  try {
    // Find all students
    console.log('📋 Finding students...');
    const studentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/students?select=*`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
      }
    );

    const allStudents = await studentsResponse.json();
    
    // Filter for Oana and Mine
    const students = allStudents.filter(s => 
      s.name.toLowerCase().includes('oana') || s.name.toLowerCase().includes('mine')
    );
    
    console.log(`✅ Found ${students.length} matching students (Oana/Mine)\n`);

    for (const student of students) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 STUDENT: ${student.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`   ID: ${student.id}`);
      console.log(`   Level: ${student.level}`);
      console.log(`   Language: ${student.target_language}`);
      console.log('');

      // Get their upcoming lessons
      const lessonsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/lessons?student_id=eq.${student.id}&status=eq.upcoming&select=*&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          }
        }
      );

      const lessons = await lessonsResponse.json();
      
      if (!lessons || lessons.length === 0) {
        console.log('   ⚠️  No upcoming lessons found');
        continue;
      }

      const lesson = lessons[0];
      console.log(`📅 UPCOMING LESSON:`);
      console.log(`   Lesson ID: ${lesson.id}`);
      console.log(`   Date: ${new Date(lesson.date).toLocaleDateString()}`);
      console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
      console.log('');

      if (!lesson.generated_lessons || lesson.generated_lessons.length === 0) {
        console.log('   ⚠️  No generated lessons found');
        continue;
      }

      console.log(`📚 GENERATED LESSON PLANS (${lesson.generated_lessons.length}):`);
      console.log('');

      lesson.generated_lessons.forEach((lessonStr, index) => {
        try {
          const lessonPlan = JSON.parse(lessonStr);
          const title = lessonPlan.title || 'No title';
          
          // Analyze the title
          const hasStudentName = title.includes(student.name);
          const hasColon = title.includes(':');
          const isGeneric = title.match(/^English .+ for .+$/);
          
          let type = '✅ AI GENERATED';
          if (isGeneric && !hasColon) {
            type = '❌ FALLBACK';
          }
          
          console.log(`   ${index + 1}. ${type}`);
          console.log(`      Title: "${title}"`);
          console.log(`      Has student name: ${hasStudentName ? 'Yes' : 'No'}`);
          console.log(`      Has colon separator: ${hasColon ? 'Yes' : 'No'}`);
          console.log(`      Sub-topics: ${lessonPlan.sub_topics?.length || 0}`);
          console.log('');
        } catch (error) {
          console.log(`   ${index + 1}. ❌ ERROR parsing lesson`);
          console.log(`      Error: ${error.message}`);
          console.log('');
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkStudentLessons();
