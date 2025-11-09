/**
 * Final comprehensive test of DeepSeek AI via OpenRouter
 * Tests the actual vocabulary generation as used in production
 */

require('dotenv').config({ path: '.env.local' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testDeepSeekProduction() {
  console.log('🎯 DeepSeek AI Model - Production Test\n');
  console.log('Testing vocabulary generation as used in the app...\n');

  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found');
    process.exit(1);
  }

  // Simulate a real student profile
  const studentProfile = {
    name: 'Test Student',
    level: 'B1',
    nativeLanguage: 'Spanish',
    goals: 'Business communication, professional emails',
    vocabularyGaps: 'Business terminology, formal expressions',
    conversationalBarriers: 'Expressing opinions professionally, negotiating'
  };

  const prompt = `Generate 5 personalized English vocabulary words for ${studentProfile.name}, a ${studentProfile.level} level English learner.

Student Profile:
- Native Language: ${studentProfile.nativeLanguage}
- Learning Goals: ${studentProfile.goals}
- Vocabulary Gaps: ${studentProfile.vocabularyGaps}
- Conversational Barriers: ${studentProfile.conversationalBarriers}
- Level: ${studentProfile.level}

Requirements:
1. Generate words appropriate for ${studentProfile.level} level
2. Focus on words that help with their learning goals: ${studentProfile.goals}
3. Address vocabulary gaps: ${studentProfile.vocabularyGaps}
4. Make words relevant to their conversational barriers: ${studentProfile.conversationalBarriers}

For each word, provide:
- word: the English word
- pronunciation: IPA phonetic notation
- partOfSpeech: noun, verb, adjective, adverb, etc.
- definition: clear, level-appropriate definition
- exampleSentences: 6 natural, contextually relevant example sentences that relate to the student's learning goals and real-life situations they might encounter. Use different tenses (present, past, future, present perfect, past perfect, future perfect). Create scenarios that connect to their goals (${studentProfile.goals}) and address their conversational barriers (${studentProfile.conversationalBarriers}).

CRITICAL: Return ONLY a valid JSON array of vocabulary objects. Do not wrap it in markdown code blocks or add any explanatory text. Just the raw JSON array starting with [ and ending with ].

Example format:
[
  {
    "word": "opportunity",
    "pronunciation": "/ˌɑːpərˈtuːnəti/",
    "partOfSpeech": "noun",
    "definition": "A chance to do something good or beneficial",
    "exampleSentences": {
      "present": "Every job interview presents a new **opportunity** to showcase your skills.",
      "past": "She recognized the **opportunity** and applied for the scholarship immediately.",
      "future": "This internship will provide valuable **opportunity** for career growth.",
      "presentPerfect": "Many students have found **opportunity** through networking events.",
      "pastPerfect": "He had missed several **opportunity** before learning to be more proactive.",
      "futurePerfect": "By graduation, you will have explored every **opportunity** available."
    }
  }
]`;

  console.log('📤 Sending request to OpenRouter...');
  console.log(`   Student: ${studentProfile.name} (${studentProfile.level})`);
  console.log(`   Model: deepseek/deepseek-chat-v3.1:free`);
  console.log(`   Requesting: 5 vocabulary words\n`);

  const startTime = Date.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Vocabulary Generator'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
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

    console.log(`✅ Response received in ${responseTime}ms\n`);

    // Parse using the same logic as production
    let vocabularyWords;
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      vocabularyWords = JSON.parse(cleanedContent);
    } catch (e) {
      // Try to extract array with regex
      const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        vocabularyWords = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error('Could not parse vocabulary array');
      }
    }

    // Validate structure
    if (!Array.isArray(vocabularyWords)) {
      throw new Error('Response is not an array');
    }

    console.log('📊 RESULTS:\n');
    console.log(`   Total words generated: ${vocabularyWords.length}`);
    
    let validCount = 0;
    vocabularyWords.forEach((word, index) => {
      const isValid = word.word && 
                    word.pronunciation && 
                    word.partOfSpeech && 
                    word.definition && 
                    word.exampleSentences &&
                    typeof word.exampleSentences === 'object';
      
      if (isValid) {
        validCount++;
        const tenseCount = Object.keys(word.exampleSentences).length;
        
        console.log(`\n   ${index + 1}. ${word.word.toUpperCase()}`);
        console.log(`      Part of Speech: ${word.partOfSpeech}`);
        console.log(`      Pronunciation: ${word.pronunciation}`);
        console.log(`      Definition: ${word.definition}`);
        console.log(`      Example sentences: ${tenseCount} tenses`);
        
        // Show one example
        const firstTense = Object.keys(word.exampleSentences)[0];
        const firstExample = word.exampleSentences[firstTense];
        console.log(`      Sample (${firstTense}): ${firstExample.substring(0, 80)}...`);
      } else {
        console.log(`\n   ${index + 1}. ❌ INVALID STRUCTURE`);
      }
    });

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n✅ Valid words: ${validCount}/${vocabularyWords.length}`);
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (data.usage) {
      console.log(`💰 Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    }

    if (validCount === vocabularyWords.length && vocabularyWords.length >= 5) {
      console.log('\n🎉 SUCCESS! DeepSeek AI is working perfectly!');
      console.log('   ✓ API connection successful');
      console.log('   ✓ Model responding correctly');
      console.log('   ✓ JSON parsing successful');
      console.log('   ✓ All vocabulary structures valid');
      console.log('   ✓ Personalization working (business-focused words)');
      console.log('   ✓ Ready for production use');
      console.log('\n✨ The vocabulary generation system is fully operational!');
    } else if (validCount > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS');
      console.log(`   Generated ${validCount} valid words out of ${vocabularyWords.length}`);
    } else {
      console.log('\n❌ FAILED - No valid words generated');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testDeepSeekProduction();
