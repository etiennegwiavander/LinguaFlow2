/**
 * Test script to check what the AI is generating for interactive materials
 */

require('dotenv').config({ path: '.env.local' });

async function testInteractiveMaterialGeneration() {
  console.log('🧪 Testing Interactive Material Generation');
  console.log('==========================================\n');

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }

  // Simple test template with info_card sections
  const testTemplate = {
    name: "Test Lesson",
    sections: [
      {
        id: "introduction_overview",
        type: "info_card",
        title: "Introduction/Overview",
        content_type: "text",
        ai_placeholder: "introduction_overview",
        background_color_var: "primary_bg"
      },
      {
        id: "wrap_up_reflection",
        type: "info_card",
        title: "Wrap-up & Reflection",
        content_type: "text",
        ai_placeholder: "wrap_up_reflection",
        background_color_var: "primary_bg"
      }
    ]
  };

  const prompt = `You are an expert English tutor creating interactive lesson materials. You must respond ONLY with valid JSON.

Template Structure to Fill:
${JSON.stringify(testTemplate, null, 2)}

CRITICAL INSTRUCTIONS:
1. You must fill ALL "ai_placeholder" fields in the template
2. For each section with an "ai_placeholder", ADD a new field to that section with the SAME NAME as the ai_placeholder value
3. For example, if ai_placeholder="introduction_overview", add a field called "introduction_overview" with the content

Example of what you should return:
{
  "name": "Test Lesson",
  "sections": [
    {
      "id": "introduction_overview",
      "type": "info_card",
      "title": "Introduction/Overview",
      "content_type": "text",
      "ai_placeholder": "introduction_overview",
      "background_color_var": "primary_bg",
      "introduction_overview": "This is the personalized introduction content that the AI generated..."
    },
    {
      "id": "wrap_up_reflection",
      "type": "info_card",
      "title": "Wrap-up & Reflection",
      "content_type": "text",
      "ai_placeholder": "wrap_up_reflection",
      "background_color_var": "primary_bg",
      "wrap_up_reflection": "This is the personalized wrap-up content that the AI generated..."
    }
  ]
}

Generate personalized content for a B1 level English student learning about "Family Relationships".

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;

  console.log('📝 Sending request to DeepSeek...\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language tutor creating interactive lesson materials. You must respond ONLY with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content;

    if (!generatedContent) {
      console.error('❌ No content generated');
      return;
    }

    console.log('✅ AI Response received\n');
    console.log('📄 Raw Response:');
    console.log('================');
    console.log(generatedContent);
    console.log('\n');

    // Try to parse it
    try {
      const cleaned = generatedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      console.log('✅ Successfully parsed JSON\n');
      console.log('📊 Parsed Structure:');
      console.log('===================');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\n');

      // Check if AI filled the placeholder fields
      console.log('🔍 Checking AI-filled fields:');
      console.log('============================');
      
      parsed.sections.forEach((section, index) => {
        const placeholderKey = section.ai_placeholder;
        if (placeholderKey) {
          const hasContent = section[placeholderKey];
          console.log(`Section ${index + 1} (${section.title}):`);
          console.log(`  - ai_placeholder: "${placeholderKey}"`);
          console.log(`  - Has field "${placeholderKey}": ${!!hasContent}`);
          if (hasContent) {
            console.log(`  - Content preview: "${hasContent.substring(0, 100)}..."`);
          }
          console.log('');
        }
      });

    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testInteractiveMaterialGeneration();
