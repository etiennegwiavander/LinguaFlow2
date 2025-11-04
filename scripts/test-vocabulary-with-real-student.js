const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Vocabulary Generation with Real Student...\n');

async function testWithRealStudent() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // First, get a real student from the database
  console.log('📝 Fetching a student from database...');
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name, level, target_language, native_language, end_goals, vocabulary_gaps')
    .limit(1);

  if (studentError || !students || students.length === 0) {
    console.error('❌ Could not fetch student:', studentError);
    return;
  }

  const student = students[0];
  console.log('✅ Found student:', student.name);
  console.log('   Level:', student.level);
  console.log('   Student ID:', student.id);

  console.log('\n📝 Testing vocabulary generation with real student...');

  try {
    const { data, error } = await supabase.functions.invoke('generate-vocabulary-words', {
      body: {
        student_id: student.id,
        count: 5,
        exclude_words: [],
        difficulty: student.level,
        focus_areas: []
      }
    });

    if (error) {
      console.error('\n❌ Edge Function Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a 404
      if (error.context && error.context.status === 404) {
        console.log('\n🔍 This is a 404 error - the function endpoint might not be accessible');
        console.log('Trying direct URL...');
        
        // Try direct fetch
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-vocabulary-words`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            student_id: student.id,
            count: 5,
            exclude_words: [],
            difficulty: student.level,
            focus_areas: []
          })
        });
        
        console.log('Direct fetch status:', response.status);
        const text = await response.text();
        console.log('Direct fetch response:', text);
      }
      return;
    }

    console.log('\n✅ Vocabulary generation successful!');
    console.log('Generated words:', data.words ? data.words.length : 0);
    if (data.words && data.words.length > 0) {
      console.log('\nFirst word example:');
      console.log(JSON.stringify(data.words[0], null, 2));
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testWithRealStudent();
