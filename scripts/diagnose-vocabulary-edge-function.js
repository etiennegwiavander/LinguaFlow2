const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DIAGNOSING VOCABULARY EDGE FUNCTION\n');

console.log('Environment Check:');
console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('✓ SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function testEdgeFunction() {
  console.log('📞 Calling Edge Function directly...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const testPayload = {
    student_id: '5dd0d10c-b984-47bf-bcfa-f2f8245f60a5',
    count: 5, // Small count for testing
    exclude_words: [],
    difficulty: 'B1',
    focus_areas: ['Travel vocabularies']
  };
  
  console.log('Request payload:', JSON.stringify(testPayload, null, 2));
  console.log('');
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-vocabulary-words', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Edge Function Error:');
      console.error('Message:', error.message);
      console.error('Name:', error.name);
      console.error('Context:', error.context);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Code:', error.code);
      console.error('');
      
      // Try to read the response body
      if (error.context && error.context.body) {
        try {
          const reader = error.context.body.getReader();
          const { value } = await reader.read();
          if (value) {
            const errorBody = new TextDecoder().decode(value);
            console.error('📄 Edge Function Response Body:', errorBody);
            console.error('');
          }
        } catch (readError) {
          console.error('Could not read response body:', readError);
        }
      }
      
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Check if it's a function not found error
      if (error.message && error.message.includes('not found')) {
        console.log('');
        console.log('💡 DIAGNOSIS: Edge Function not deployed');
        console.log('');
        console.log('TO FIX:');
        console.log('1. Deploy the Edge Function:');
        console.log('   supabase functions deploy generate-vocabulary-words');
        console.log('');
        console.log('2. Set the required secrets:');
        console.log('   supabase secrets set OPENROUTER_API_KEY=your_key_here');
      }
      
      // Check if it's an auth error
      if (error.message && error.message.includes('auth')) {
        console.log('');
        console.log('💡 DIAGNOSIS: Authentication issue');
        console.log('');
        console.log('TO FIX:');
        console.log('1. Verify your service role key is correct');
        console.log('2. Check Supabase project settings');
      }
      
      return;
    }
    
    console.log('✅ Edge Function Response:');
    console.log('Success:', data?.success);
    console.log('Words count:', data?.words?.length || 0);
    
    if (data?.words && data.words.length > 0) {
      console.log('');
      console.log('Sample word:', JSON.stringify(data.words[0], null, 2));
    }
    
    if (data?.error) {
      console.log('');
      console.log('❌ Edge Function returned error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
  }
}

testEdgeFunction();
