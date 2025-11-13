require('dotenv').config({ path: '.env.local' });

const openrouterKey = process.env.OPENROUTER_API_KEY;

async function testWithRealPrompt() {
  console.log('🧪 Testing Interactive Material with REAL Prompt\n');

  // This is closer to what the actual function sends
  const realPrompt = `You are an expert English tutor creating hyper-personalized interactive lesson materials for test 2. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

CRITICAL INSTRUCTIONS:
1. Generate ALL lesson content in English (target language)
2. Make this lesson feel like it was created specifically for test 2
3. RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT

Student Profile:
- Name: test 2
- Target Language: English
- Proficiency Level: B2
- End Goals: Travel to USA

Sub-Topic: Perfect Tense Mastery for French Speakers
Category: Grammar
Level: B2

Create a basic interactive lesson. Respond with this JSON structure:

{
  "name": "Perfect Tense Mastery for French Speakers",
  "category": "Grammar",
  "level": "B2",
  "content": {
    "title": "Perfect Tense Mastery for French Speakers",
    "introduction": "Brief introduction",
    "main_content": "Main content here",
    "practice_exercises": ["Exercise 1", "Exercise 2"],
    "vocabulary": [
      {
        "word": "example",
        "definition": "definition here",
        "part_of_speech": "noun",
        "examples": [
          "Example sentence 1",
          "Example sentence 2",
          "Example sentence 3"
        ]
      }
    ],
    "example_sentences": [
      "Sentence 1",
      "Sentence 2"
    ],
    "dialogue_example": [
      {"character": "Teacher", "text": "Hello!"},
      {"character": "Student", "text": "Hi!"}
    ],
    "wrap_up": "Summary here"
  }
}

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;

  try {
    console.log('📤 Sending request to DeepSeek...\n');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Interactive Materials'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language tutor creating interactive lesson materials. You must respond ONLY with valid JSON in the exact format requested. Do not include any explanations, markdown formatting, or additional text outside the JSON object.'
          },
          {
            role: 'user',
            content: realPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status}`);
      console.error(errorText);
      return;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log('📝 RAW RESPONSE (showing special characters):');
    console.log('='.repeat(80));
    // Show the raw content with special characters visible
    console.log(JSON.stringify(content).substring(0, 2000));
    console.log('='.repeat(80));
    console.log('');

    console.log('📝 ACTUAL RESPONSE:');
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));
    console.log('');

    // Test the cleaning logic
    console.log('🧹 Testing cleaning logic...\n');

    let cleanedText = content
      // Remove DeepSeek special tokens
      .replace(/<｜begin▁of▁sentence｜>/g, '')
      .replace(/<｜end▁of▁sentence｜>/g, '')
      .replace(/<｜[^｜]+｜>/g, '')
      // Remove any text after the last closing brace
      .replace(/\}[\s\S]*$/, '}')
      .trim();

    console.log('✅ Cleaned text length:', cleanedText.length);
    console.log('✅ Original length:', content.length);
    console.log('✅ Removed:', content.length - cleanedText.length, 'characters');
    console.log('');

    // Try to parse
    console.log('🔍 Attempting to parse...\n');

    // Strategy: Extract between first { and last }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const extracted = cleanedText.substring(firstBrace, lastBrace + 1);
      console.log('📦 Extracted JSON length:', extracted.length);
      
      try {
        const parsed = JSON.parse(extracted);
        console.log('✅ SUCCESS! JSON parsed correctly');
        console.log('📊 Structure:', Object.keys(parsed));
        if (parsed.content) {
          console.log('📊 Content keys:', Object.keys(parsed.content));
        }
      } catch (e) {
        console.error('❌ PARSE FAILED:', e.message);
        console.log('\n🔍 Showing problematic area:');
        const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
        console.log('Around error position:');
        console.log(extracted.substring(Math.max(0, errorPos - 100), errorPos + 100));
      }
    } else {
      console.error('❌ Could not find braces');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testWithRealPrompt();
