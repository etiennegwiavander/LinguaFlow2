const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Detailed API Route Test for Vocabulary Generation...\n');

async function testAPIRouteDetailed() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get a real student
  console.log('📝 Fetching student...');
  const { data: students } = await supabase
    .from('students')
    .select('id, name, level, target_language, native_language, end_goals, vocabulary_gaps')
    .limit(1);

  if (!students || students.length === 0) {
    console.error('❌ No students found');
    return;
  }

  const student = students[0];
  console.log('✅ Student:', student.name, '(ID:', student.id, ')');
  console.log('   Level:', student.level);
  console.log('   Goals:', student.end_goals);
  console.log('   Vocab gaps:', student.vocabulary_gaps);

  const requestBody = {
    student_id: student.id,
    count: 5,
    exclude_words: [],
    difficulty: student.level,
    focus_areas: []
  };

  console.log('\n📤 Request body:', JSON.stringify(requestBody, null, 2));

  try {
    console.log('\n🌐 Calling API route...');
    const response = await fetch('http://localhost:3000/api/supabase/functions/generate-vocabulary-words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('\n📥 Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('\n📄 Raw response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('\n✅ Parsed JSON successfully');
      console.log('Response keys:', Object.keys(data));
      console.log('Full response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('\n❌ Failed to parse JSON:', parseError.message);
      return;
    }

    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log('Words count:', data.words ? data.words.length : 0);
      if (data.words && data.words.length > 0) {
        console.log('\nFirst word:');
        console.log(JSON.stringify(data.words[0], null, 2));
      }
    } else {
      console.log('\n❌ API returned error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    console.error('Full error:', error);
  }
}

testAPIRouteDetailed();
