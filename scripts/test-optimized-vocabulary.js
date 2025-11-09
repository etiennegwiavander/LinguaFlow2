/**
 * Test optimized vocabulary generation for speed
 */

require('dotenv').config({ path: '.env.local' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testOptimizedGeneration() {
  console.log('🚀 Testing Optimized Vocabulary Generation\n');

  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found');
    process.exit(1);
  }

  // Optimized prompt (same as production)
  const prompt = `Generate 5 B1 English vocabulary words for Test Student.

Profile: Spanish speaker | Goals: Business communication | Gaps: Professional terminology

Return ONLY valid JSON array. No markdown, no text.

Format:
[{"word":"example","pronunciation":"/ɪɡˈzæmpəl/","partOfSpeech":"noun","definition":"A thing showing what others are like","exampleSentences":{"present":"This is an example.","past":"That was an example.","future":"This will be an example.","presentPerfect":"I have seen this example.","pastPerfect":"I had seen that example.","futurePerfect":"I will have seen the example."}}]

Generate 5 words now:`;

  console.log('📊 Prompt Statistics:');
  console.log(`   Characters: ${prompt.length}`);
  console.log(`   Estimated tokens: ~${Math.ceil(prompt.length / 4)}`);
  console.log('');

  console.log('⏱️  Starting generation...');
  const startTime = Date.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Vocabulary Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'system',
            content: 'You are a vocabulary generator. Return only valid JSON arrays. Be concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 3000,
        top_p: 0.9
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log(`✅ Response received in ${(responseTime / 1000).toFixed(1)}s\n`);

    // Parse response with enhanced extraction
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any text before the first [ and after the last ]
    const firstBracket = cleanedContent.indexOf('[');
    const lastBracket = cleanedContent.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanedContent = cleanedContent.substring(firstBracket, lastBracket + 1);
    }
    
    let vocabularyWords;
    try {
      vocabularyWords = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log('⚠️  Direct parse failed, trying regex extraction...');
      // Fallback: extract array with regex
      const arrayMatch = content.match(/\[[\s\S]*?\]/g);
      if (arrayMatch && arrayMatch.length > 0) {
        const largestArray = arrayMatch.reduce((a, b) => a.length > b.length ? a : b);
        vocabularyWords = JSON.parse(largestArray);
      } else {
        throw new Error(`Failed to parse vocabulary response: ${parseError.message}`);
      }
    }

    console.log('📋 Results:');
    console.log(`   Words generated: ${vocabularyWords.length}`);
    console.log(`   Generation time: ${(responseTime / 1000).toFixed(1)}s`);
    console.log(`   Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
    console.log('');

    // Validate structure
    let validCount = 0;
    vocabularyWords.forEach((word, i) => {
      const isValid = word.word && 
                    word.pronunciation && 
                    word.partOfSpeech && 
                    word.definition && 
                    word.exampleSentences;
      
      if (isValid) {
        validCount++;
        console.log(`   ${i + 1}. ${word.word} (${word.partOfSpeech}) - ✅`);
      } else {
        console.log(`   ${i + 1}. Invalid structure - ❌`);
      }
    });

    console.log('');
    console.log('📊 Performance Analysis:');
    console.log(`   Valid words: ${validCount}/${vocabularyWords.length}`);
    console.log(`   Time per word: ${(responseTime / vocabularyWords.length / 1000).toFixed(1)}s`);
    console.log(`   Tokens per word: ${Math.ceil((data.usage?.total_tokens || 0) / vocabularyWords.length)}`);
    
    // Extrapolate to 20 words
    const estimated20Words = (responseTime / vocabularyWords.length) * 20;
    console.log('');
    console.log('🎯 Estimated for 20 words:');
    console.log(`   Generation time: ${(estimated20Words / 1000).toFixed(1)}s`);
    console.log(`   Tokens needed: ~${Math.ceil((data.usage?.total_tokens || 0) / vocabularyWords.length * 20)}`);
    
    if (estimated20Words < 50000) {
      console.log('\n🎉 SUCCESS! Generation time is under 50 seconds!');
      console.log('   ✓ Will work in production (Netlify timeout: 26s max, but Edge Function: 150s)');
      console.log('   ✓ Significantly faster than before (120s → ~' + (estimated20Words / 1000).toFixed(0) + 's)');
    } else {
      console.log('\n⚠️  WARNING: Still might timeout in production');
      console.log('   Consider further optimizations');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
  }
}

testOptimizedGeneration();
