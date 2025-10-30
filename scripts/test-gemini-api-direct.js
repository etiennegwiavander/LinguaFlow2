/**
 * Direct test of Gemini API to verify it's working
 */

// Hardcoded API key for testing (from .env.local)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || require('dotenv').config({ path: '.env.local' }) && process.env.GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🔍 TESTING GEMINI API DIRECTLY');
  console.log('================================\n');

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    console.log('   Please add: GEMINI_API_KEY=your_key_here');
    return;
  }

  console.log('✅ GEMINI_API_KEY found:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('');

  const testPrompt = `You are an expert English tutor. Generate a simple lesson plan for a student named "Test Student".

Return ONLY a JSON object with this structure:
{
  "title": "lesson title",
  "objectives": ["objective 1", "objective 2"],
  "activities": ["activity 1", "activity 2"],
  "materials": ["material 1", "material 2"],
  "assessment": ["assessment 1"],
  "sub_topics": [
    {
      "id": "subtopic_1",
      "title": "subtopic title",
      "category": "Grammar",
      "level": "b1",
      "description": "detailed description"
    }
  ]
}`;

  try {
    console.log('📋 Making API call to Gemini...');
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
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

    const duration = Date.now() - startTime;

    console.log(`✅ API responded in ${duration}ms`);
    console.log('   Status:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      console.log('');
      console.log('💡 Common issues:');
      console.log('   - 400: Invalid API key format');
      console.log('   - 403: API key not authorized or billing not enabled');
      console.log('   - 429: Rate limit exceeded');
      console.log('   - 500: Google server error');
      return;
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure from Gemini API');
      console.error('   Response:', JSON.stringify(data, null, 2));
      return;
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('✅ Generated text received');
    console.log('   Length:', generatedText.length, 'characters');
    console.log('');

    // Try to parse JSON
    console.log('📋 Parsing JSON response...');
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.log('   Raw response:');
      console.log(generatedText);
      return;
    }

    const parsedLesson = JSON.parse(jsonMatch[0]);
    console.log('✅ JSON parsed successfully');
    console.log('');

    console.log('📝 Generated Lesson:');
    console.log('   Title:', parsedLesson.title);
    console.log('   Objectives:', parsedLesson.objectives?.length || 0);
    console.log('   Activities:', parsedLesson.activities?.length || 0);
    console.log('   Materials:', parsedLesson.materials?.length || 0);
    console.log('   Assessment:', parsedLesson.assessment?.length || 0);
    console.log('   Sub-topics:', parsedLesson.sub_topics?.length || 0);
    console.log('');

    console.log('================================');
    console.log('✅ Gemini API is working correctly!');
    console.log('');
    console.log('💡 If lesson generation is still using fallback:');
    console.log('   The issue is likely that GEMINI_API_KEY is not set');
    console.log('   in Supabase Edge Function secrets.');
    console.log('');
    console.log('🔧 To fix:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Navigate to Edge Functions');
    console.log('   3. Click on "generate-lesson-plan" function');
    console.log('   4. Go to Secrets tab');
    console.log('   5. Add secret: GEMINI_API_KEY = ' + GEMINI_API_KEY);
    console.log('   6. Redeploy the function');

  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testGeminiAPI();
