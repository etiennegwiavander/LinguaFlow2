/**
 * List available Gemini models
 */

const GEMINI_API_KEY = 'AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8';

async function listModels() {
  console.log('📋 LISTING AVAILABLE GEMINI MODELS');
  console.log('================================\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      console.log('❌ API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    
    console.log(`✅ Found ${data.models?.length || 0} models\n`);
    
    if (data.models) {
      // Filter for generation models
      const generationModels = data.models.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log('🤖 MODELS THAT SUPPORT generateContent:');
      console.log('');
      
      generationModels.forEach(model => {
        console.log(`   📦 ${model.name}`);
        console.log(`      Display Name: ${model.displayName}`);
        console.log(`      Description: ${model.description}`);
        console.log(`      Input Token Limit: ${model.inputTokenLimit}`);
        console.log(`      Output Token Limit: ${model.outputTokenLimit}`);
        console.log('');
      });
      
      console.log('================================');
      console.log('💡 RECOMMENDED MODELS FOR LESSON GENERATION:');
      console.log('');
      
      const recommended = generationModels.filter(m => 
        m.name.includes('flash') || m.name.includes('pro')
      );
      
      recommended.forEach(model => {
        const modelId = model.name.replace('models/', '');
        console.log(`   ✅ ${modelId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
