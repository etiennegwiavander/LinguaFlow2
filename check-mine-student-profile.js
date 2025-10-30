/**
 * Check Mine's student profile to see what data is available
 */

const SUPABASE_URL = 'https://urmuwjcjcyohsrkgyapl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTEwMzE0MCwiZXhwIjoyMDY0Njc5MTQwfQ.f244RmJBYqyWf69yaEvkSla4uA9fJcoD-ze6maUINF4';

async function checkStudentProfile() {
  console.log('🔍 CHECKING STUDENT PROFILES');
  console.log('================================\n');

  try {
    // Get all students
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
    
    console.log(`✅ Found ${students.length} matching students\n`);

    for (const student of students) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 STUDENT: ${student.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log('');
      console.log('📋 PROFILE DATA:');
      console.log(`   ID: ${student.id}`);
      console.log(`   Name: ${student.name}`);
      console.log(`   Level: ${student.level}`);
      console.log(`   Target Language: ${student.target_language}`);
      console.log(`   Native Language: ${student.native_language || 'Not set'}`);
      console.log(`   Age Group: ${student.age_group || 'Not set'}`);
      console.log('');
      console.log('🎯 LEARNING GOALS:');
      console.log(`   End Goals: ${student.end_goals || 'Not set'}`);
      console.log('');
      console.log('⚠️  WEAKNESSES:');
      console.log(`   Grammar: ${student.grammar_weaknesses || 'Not set'}`);
      console.log(`   Vocabulary: ${student.vocabulary_gaps || 'Not set'}`);
      console.log(`   Pronunciation: ${student.pronunciation_challenges || 'Not set'}`);
      console.log(`   Fluency: ${student.conversational_fluency_barriers || 'Not set'}`);
      console.log('');
      console.log('📚 LEARNING PREFERENCES:');
      console.log(`   Learning Styles: ${student.learning_styles?.join(', ') || 'Not set'}`);
      console.log(`   Notes: ${student.notes || 'Not set'}`);
      console.log('');
      
      // Check if profile is complete
      const hasGoals = !!student.end_goals;
      const hasWeaknesses = !!(student.grammar_weaknesses || student.vocabulary_gaps || 
                               student.pronunciation_challenges || student.conversational_fluency_barriers);
      const hasNativeLanguage = !!student.native_language;
      
      console.log('✅ PROFILE COMPLETENESS:');
      console.log(`   Has Goals: ${hasGoals ? '✅' : '❌'}`);
      console.log(`   Has Weaknesses: ${hasWeaknesses ? '✅' : '❌'}`);
      console.log(`   Has Native Language: ${hasNativeLanguage ? '✅' : '❌'}`);
      console.log('');
      
      if (!hasGoals || !hasWeaknesses) {
        console.log('⚠️  WARNING: Incomplete profile may result in generic lesson content!');
        console.log('   The AI needs specific goals and weaknesses to generate personalized lessons.');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkStudentProfile();
