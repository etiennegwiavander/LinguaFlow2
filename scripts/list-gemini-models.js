/**
 * List available Gemini models
 */

const GEMINI_API_KEY = 'AIzaSyCOK7Uim0JUd3Gzg0dfmhFwTSjL7NyTDJ8';

async function listModels() {
  console.log('🔍 LISTING AVAILABLE GEMINI MODELS');
  console.log('================================\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error(errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Available models:\n');
    
    if (data.models) {
      data.models.forEach(model => {
        console.log(`📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
