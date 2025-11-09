/**
 * Test to see the full DeepSeek response
 */

require('dotenv').config({ path: '.env.local' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testDeepSeekFullResponse() {
  console.log('🧪 Testing DeepSeek - Full Response View\n');

  const testPrompt = `Generate 2 English vocabulary words for B1 level.

Return ONLY a valid JSON array. No markdown, no explanations.

Format:
[
  {
    "word": "example",
    "pronunciation": "/ɪɡˈzæmpəl/",
    "partOfSpeech": "noun",
    "definition": "A thing that shows what others are like",
    "exampleSentences": {
      "present": "This is an **example**.",
      "past": "That was an **example**.",
      "future": "This will be an **example**.",
      "presentPerfect": "I have seen this **example**.",
      "pastPerfect": "I had seen that **example**.",
      "futurePerfect": "I will have seen the **example**."
    }
  }
]`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [{ role: 'user', content: testPrompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('📄 FULL RESPONSE:');
    console.log('═'.repeat(80));
    console.log(content);
    console.log('═'.repeat(80));
    console.log('');
    
    // Show character codes at the end
    console.log('🔍 Last 100 characters (with codes):');
    const last100 = content.slice(-100);
    for (let i = 0; i < last100.length; i++) {
      const char = last100[i];
      const code = char.charCodeAt(0);
      if (code < 32 || code > 126) {
        console.log(`Position ${i}: [${code}] (non-printable)`);
      }
    }
    
    // Try different cleaning approaches
    console.log('\n🧹 Trying different cleaning methods:\n');
    
    // Method 1: Remove markdown
    let cleaned1 = content.trim();
    if (cleaned1.startsWith('```json')) {
      cleaned1 = cleaned1.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned1.startsWith('```')) {
      cleaned1 = cleaned1.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Method 1 (remove markdown):');
    try {
      const parsed1 = JSON.parse(cleaned1);
      console.log(`✅ SUCCESS! Parsed ${parsed1.length} words`);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
    
    // Method 2: Extract array with regex
    console.log('\nMethod 2 (regex extract):');
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed2 = JSON.parse(arrayMatch[0]);
        console.log(`✅ SUCCESS! Parsed ${parsed2.length} words`);
        console.log('\n📋 Extracted words:');
        parsed2.forEach((word, i) => {
          console.log(`   ${i + 1}. ${word.word} (${word.partOfSpeech})`);
        });
      } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
      }
    } else {
      console.log('❌ No array found in response');
    }
    
    // Method 3: Find first [ and last ]
    console.log('\nMethod 3 (bracket extraction):');
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      const extracted = content.substring(firstBracket, lastBracket + 1);
      try {
        const parsed3 = JSON.parse(extracted);
        console.log(`✅ SUCCESS! Parsed ${parsed3.length} words`);
      } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        console.log(`Extracted length: ${extracted.length}`);
        console.log(`Last 50 chars: ${extracted.slice(-50)}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDeepSeekFullResponse();
