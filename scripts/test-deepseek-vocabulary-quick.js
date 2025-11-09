/**
 * Quick test script to verify DeepSeek AI model via OpenRouter
 * Tests vocabulary generation functionality
 */

require('dotenv').config({ path: '.env.local' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testDeepSeekVocabulary() {
  console.log('🧪 Testing DeepSeek AI Model via OpenRouter...\n');

  // Check if API key exists
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in .env.local');
    console.error('Please ensure your .env.local file contains OPENROUTER_API_KEY');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`   Key preview: ${OPENROUTER_API_KEY.substring(0, 10)}...${OPENROUTER_API_KEY.substring(OPENROUTER_API_KEY.length - 4)}\n`);

  // Create a simple test prompt
  const testPrompt = `Generate 3 personalized English vocabulary words for a B1 level English learner.

Student Profile:
- Native Language: Spanish
- Learning Goals: Business communication
- Vocabulary Gaps: Professional terminology
- Level: B1

Requirements:
1. Generate words appropriate for B1 level
2. Focus on business communication
3. Make words relevant to professional settings

For each word, provide:
- word: the English word
- pronunciation: IPA phonetic notation
- partOfSpeech: noun, verb, adjective, adverb, etc.
- definition: clear, level-appropriate definition
- exampleSentences: 6 natural example sentences in different tenses (present, past, future, present perfect, past perfect, future perfect)

CRITICAL: Return ONLY a valid JSON array. No markdown, no explanations. Just the raw JSON array.

Example format:
[
  {
    "word": "opportunity",
    "pronunciation": "/ˌɑːpərˈtuːnəti/",
    "partOfSpeech": "noun",
    "definition": "A chance to do something good or beneficial",
    "exampleSentences": {
      "present": "Every job interview presents a new **opportunity**.",
      "past": "She recognized the **opportunity** immediately.",
      "future": "This will provide valuable **opportunity**.",
      "presentPerfect": "Many have found **opportunity** here.",
      "pastPerfect": "He had missed several **opportunity** before.",
      "futurePerfect": "By graduation, you will have explored every **opportunity**."
    }
  }
]`;

  console.log('📤 Sending request to OpenRouter API...');
  console.log('   Model: deepseek/deepseek-chat-v3.1:free');
  console.log('   Endpoint: https://openrouter.ai/api/v1/chat/completions\n');

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
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const responseTime = Date.now() - startTime;

    console.log(`📥 Response received in ${responseTime}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('📦 Response structure:');
    console.log(`   Keys: ${Object.keys(data).join(', ')}`);
    
    if (data.choices && data.choices.length > 0) {
      console.log(`   Choices: ${data.choices.length}`);
      console.log(`   Model used: ${data.model || 'N/A'}`);
      
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        console.log(`   Content length: ${content.length} characters\n`);
        
        console.log('📝 Raw AI Response (first 500 chars):');
        console.log('─'.repeat(60));
        console.log(content.substring(0, 500));
        if (content.length > 500) {
          console.log('...(truncated)');
        }
        console.log('─'.repeat(60));
        console.log('');
        
        // Try to parse the JSON
        console.log('🔍 Attempting to parse JSON...');
        
        try {
          // Clean the content
          let cleanedContent = content.trim();
          if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          const vocabularyWords = JSON.parse(cleanedContent);
          
          if (Array.isArray(vocabularyWords)) {
            console.log(`✅ Successfully parsed ${vocabularyWords.length} vocabulary words\n`);
            
            // Validate structure
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
                console.log(`✅ Word ${index + 1}: "${word.word}" (${word.partOfSpeech})`);
                console.log(`   Pronunciation: ${word.pronunciation}`);
                console.log(`   Definition: ${word.definition.substring(0, 60)}...`);
                console.log(`   Example sentences: ${Object.keys(word.exampleSentences).length} tenses`);
              } else {
                console.log(`❌ Word ${index + 1}: Invalid structure`);
              }
            });
            
            console.log(`\n📊 Validation Summary:`);
            console.log(`   Total words: ${vocabularyWords.length}`);
            console.log(`   Valid words: ${validCount}`);
            console.log(`   Invalid words: ${vocabularyWords.length - validCount}`);
            
            if (validCount === vocabularyWords.length) {
              console.log('\n🎉 SUCCESS! DeepSeek AI model is working perfectly!');
              console.log('   ✓ API connection successful');
              console.log('   ✓ Model responding correctly');
              console.log('   ✓ JSON format valid');
              console.log('   ✓ All vocabulary structures valid');
              console.log(`   ✓ Response time: ${responseTime}ms`);
            } else {
              console.log('\n⚠️  PARTIAL SUCCESS: Some words have invalid structure');
            }
            
          } else {
            console.log('❌ Parsed content is not an array');
          }
          
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError.message);
          console.error('\nThis might indicate the AI returned text instead of JSON.');
        }
        
      } else {
        console.error('❌ No content in response');
      }
      
    } else {
      console.error('❌ No choices in response');
      console.error('Full response:', JSON.stringify(data, null, 2));
    }
    
    // Check for usage/cost information
    if (data.usage) {
      console.log('\n💰 Token Usage:');
      console.log(`   Prompt tokens: ${data.usage.prompt_tokens || 'N/A'}`);
      console.log(`   Completion tokens: ${data.usage.completion_tokens || 'N/A'}`);
      console.log(`   Total tokens: ${data.usage.total_tokens || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('\n   This appears to be a network error.');
      console.error('   Please check your internet connection.');
    }
    
    process.exit(1);
  }
}

// Run the test
testDeepSeekVocabulary().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
