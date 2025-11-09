require('dotenv').config({ path: '.env.local' });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

console.log('📋 LISTING AVAILABLE OPENROUTER MODELS\n');

async function listModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter for DeepSeek models
    const deepseekModels = data.data.filter(model => 
      model.id.toLowerCase().includes('deepseek')
    );

    console.log(`Found ${deepseekModels.length} DeepSeek models:\n`);
    
    deepseekModels.forEach(model => {
      console.log(`🤖 ${model.id}`);
      console.log(`   Name: ${model.name}`);
      console.log(`   Context: ${model.context_length} tokens`);
      console.log(`   Pricing:`);
      console.log(`      Prompt: $${model.pricing.prompt} per token`);
      console.log(`      Completion: $${model.pricing.completion} per token`);
      
      // Check if it's free
      const isFree = model.pricing.prompt === '0' && model.pricing.completion === '0';
      if (isFree) {
        console.log(`   ✅ FREE MODEL`);
      }
      console.log('');
    });

    // Show which ones are free
    const freeModels = deepseekModels.filter(m => 
      m.pricing.prompt === '0' && m.pricing.completion === '0'
    );

    if (freeModels.length > 0) {
      console.log('\n💡 FREE DEEPSEEK MODELS:');
      freeModels.forEach(m => console.log(`   - ${m.id}`));
    }

  } catch (error) {
    console.error('❌ Failed to list models:', error.message);
  }
}

listModels();
