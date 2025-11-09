require('dotenv').config({ path: '.env.local' });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

console.log('🧪 TESTING FREE DEEPSEEK V3.1 MODEL\n');

async function testFreeModel() {
  const modelName = 'deepseek/deepseek-chat-v3.1:free';
  
  console.log(`Testing: ${modelName}\n`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow Test'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{
          role: 'user',
          content: 'Generate 2 simple English vocabulary words for B1 level. Return ONLY a JSON array with this exact format: [{"word": "example", "pronunciation": "/ɪɡˈzæmpəl/", "partOfSpeech": "noun", "definition": "a thing characteristic of its kind", "exampleSentences": {"present": "This is an example.", "past": "That was an example.", "future": "This will be an example.", "presentPerfect": "This has been an example.", "pastPerfect": "This had been an example.", "futurePerfect": "This will have been an example."}}]'
        }],
        max_tokens: 1000
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Error Response:');
      console.error(responseText);
      return;
    }

    const data = JSON.parse(responseText);
    console.log('✅ SUCCESS!');
    console.log('\n📦 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n📝 Content:');
      console.log(data.choices[0].message.content);
      
      // Try to parse the content
      try {
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);
        console.log('\n✅ Content is valid JSON!');
        console.log('Parsed:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('\n⚠️  Content is not valid JSON, might need cleaning');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFreeModel();
