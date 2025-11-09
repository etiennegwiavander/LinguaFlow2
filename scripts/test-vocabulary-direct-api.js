require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 TESTING VOCABULARY GENERATION DIRECTLY\n');

async function testVocabularyGeneration() {
  try {
    // First, get a student
    console.log('📝 Fetching student...');
    const studentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!studentsResponse.ok) {
      throw new Error(`Failed to fetch students: ${studentsResponse.status}`);
    }

    const students = await studentsResponse.json();
    if (students.length === 0) {
      throw new Error('No students found');
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.name} (${student.level})`);
    console.log(`   ID: ${student.id}\n`);

    // Test vocabulary generation
    console.log('🤖 Calling vocabulary generation Edge Function...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-vocabulary-words`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: student.id,
        count: 3  // Small count for testing
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`   Response length: ${responseText.length} bytes\n`);

    if (!response.ok) {
      console.error('❌ ERROR RESPONSE:');
      console.error(responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('\n📋 Parsed error:');
        console.error(JSON.stringify(errorData, null, 2));
      } catch (e) {
        // Response is not JSON
      }
      return;
    }

    const data = JSON.parse(responseText);
    console.log('✅ SUCCESS!');
    console.log(`   Generated ${data.words?.length || 0} vocabulary words\n`);

    if (data.words && data.words.length > 0) {
      console.log('📚 Sample word:');
      console.log(JSON.stringify(data.words[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

testVocabularyGeneration();
