const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing API Route for Vocabulary Generation...\n');

async function testAPIRoute() {
  // Create a Supabase client to get auth token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get a real student
  console.log('📝 Fetching a student from database...');
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, name, level')
    .limit(1);

  if (studentError || !students || students.length === 0) {
    console.error('❌ Could not fetch student:', studentError);
    return;
  }

  const student = students[0];
  console.log('✅ Found student:', student.name);
  console.log('   Student ID:', student.id);

  // Get auth session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log('⚠️  No active session - trying without auth...');
  } else {
    console.log('✅ Auth session found');
  }

  console.log('\n📝 Testing API route at http://localhost:3000/api/supabase/functions/generate-vocabulary-words');

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('http://localhost:3000/api/supabase/functions/generate-vocabulary-words', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        student_id: student.id,
        count: 5,
        exclude_words: [],
        difficulty: student.level,
        focus_areas: []
      })
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2));

    if (data.success && data.words) {
      console.log('\n✅ API route working! Generated', data.words.length, 'words');
      if (data.words.length > 0) {
        console.log('\nFirst word:', data.words[0].word);
      }
    } else {
      console.log('\n❌ API route returned error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testAPIRoute();
