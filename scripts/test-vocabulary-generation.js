const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Vocabulary Generation Connection...\n');

console.log('Environment Check:');
console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- Service Role Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('- OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing');

async function testVocabularyGeneration() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Missing required environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n📝 Testing vocabulary generation...');

  try {
    // Test with a simple request
    const { data, error } = await supabase.functions.invoke('generate-vocabulary-words', {
      body: {
        student_id: 'test-student-id',
        count: 5,
        exclude_words: [],
        difficulty: 'B1',
        focus_areas: ['business', 'technology']
      }
    });

    if (error) {
      console.error('\n❌ Edge Function Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('\n✅ Vocabulary generation successful!');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testVocabularyGeneration();
