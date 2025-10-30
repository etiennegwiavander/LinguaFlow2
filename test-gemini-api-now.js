/**
 * Test Gemini API directly to see if it's working
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || require('dotenv').config({ path: '.env.local' }) && process.env.GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🧪 TESTING GEMINI API');
  console.log('================================\n');

  console.log('📋 API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('');

  try {
    console.log('🚀 Making API call to Gemini...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Generate a simple JSON object with a "title" field containing a personalized English lesson title for a student named "Test Student" at B1 level. Return ONLY the JSON object.'
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API ERROR:');
      console.log('   Status:', response.status);
      console.log('   Response:', errorText);
      console.log('');
      
      if (response.status === 404) {
        console.log('💡 ISSUE: Model not found');
        console.log('   The model "gemini-2.5-flash" might not exist or be available.');
        console.log('   Try using "gemini-1.5-flash" or "gemini-1.5-pro" instead.');
      } else if (response.status === 403) {
        console.log('💡 ISSUE: API key invalid or permissions issue');
        console.log('   - Check if the API key is correct');
        console.log('   - Verify the API is enabled in Google Cloud Console');
        console.log('   - Check if billing is enabled');
      } else if (response.status === 429) {
        console.log('💡 ISSUE: Rate limit exceeded');
        console.log('   - Too many requests in a short time');
        console.log('   - Wait a few minutes and try again');
      }
      
      return;
    }

    const data = await response.json();
    
    console.log('✅ API CALL SUCCESSFUL');
    console.log('');
    console.log('📄 Response structure:');
    console.log('   Has candidates:', !!data.candidates);
    console.log('   Candidates count:', data.candidates?.length || 0);
    
    if (data.candidates && data.candidates[0]) {
      const content = data.candidates[0].content;
      const text = content?.parts?.[0]?.text;
      
      console.log('   Has content:', !!content);
      console.log('   Has text:', !!text);
      console.log('');
      console.log('📝 Generated text:');
      console.log('---');
      console.log(text);
      console.log('---');
      console.log('');
      
      // Try to parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON PARSING SUCCESSFUL');
          console.log('   Parsed object:', JSON.stringify(parsed, null, 2));
        } else {
          console.log('⚠️  No JSON found in response');
        }
      } catch (parseError) {
        console.log('❌ JSON PARSING FAILED');
        console.log('   Error:', parseError.message);
      }
    } else {
      console.log('⚠️  No candidates in response');
      console.log('   Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testGeminiAPI();
