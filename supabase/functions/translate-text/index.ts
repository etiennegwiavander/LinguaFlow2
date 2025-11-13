import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TranslateTextRequest {
  text_to_translate: string;
  target_language_code: string;
}

const languageMap: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ru': 'Russian',
  'pt': 'Portuguese',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Parse request body
    const { text_to_translate, target_language_code }: TranslateTextRequest = await req.json()

    if (!text_to_translate || !target_language_code) {
      throw new Error('Missing required parameters: text_to_translate and target_language_code are required')
    }

    // Get language name from code
    const targetLanguageName = languageMap[target_language_code] || target_language_code;

    // Get OpenRouter API key for DeepSeek
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    // Construct the prompt for translation
    const prompt = `Translate the following text into ${targetLanguageName}. Return ONLY the translated text without any additional explanations, notes, or formatting:

"${text_to_translate}"`;

    // Call DeepSeek API via OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.online',
        'X-Title': 'LinguaFlow'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate text accurately into ${targetLanguageName}. Return ONLY the translated text without any additional explanations, notes, or formatting.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      throw new Error(`DeepSeek API error: ${errorData}`)
    }

    const aiData = await aiResponse.json()
    const translatedText = aiData.choices[0]?.message?.content.trim()

    if (!translatedText) {
      throw new Error('No translation generated')
    }

    // Clean up the response to ensure it's just the translated text
    // Remove any markdown formatting, quotes, or explanatory text
    const cleanedTranslation = translatedText
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Translation: /i, '') // Remove "Translation:" prefix
      .replace(/^Here's the translation: /i, '') // Remove "Here's the translation:" prefix
      .replace(/^Translated text: /i, '') // Remove "Translated text:" prefix
      .trim();

    return new Response(
      JSON.stringify({ 
        success: true, 
        translated_text: cleanedTranslation,
        source_language: 'auto-detected',
        target_language: targetLanguageName,
        original_text: text_to_translate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Translation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})