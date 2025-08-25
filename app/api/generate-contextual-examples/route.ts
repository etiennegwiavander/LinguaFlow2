import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GenerateExamplesRequest {
  word: string;
  partOfSpeech: string;
  definition: string;
  count: number;
  level: string;
  lessonContext: string;
  studentId?: string;
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const { word, partOfSpeech, definition, count, level, lessonContext, studentId }: GenerateExamplesRequest = await request.json();

    if (!word || !partOfSpeech || !count || !level || !lessonContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get student info if provided
    let studentInfo = null;
    if (studentId) {
      const { data: student } = await supabase
        .from('students')
        .select('name, target_language, level, grammar_weaknesses, vocabulary_gaps')
        .eq('id', studentId)
        .single();
      
      studentInfo = student;
    }

    // Construct AI prompt for generating contextual examples
    const prompt = `You are an expert language tutor creating contextual example sentences. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

Generate ${count} diverse, contextual example sentences for the word "${word}" that:

Word Details:
- Word: ${word}
- Part of Speech: ${partOfSpeech}
- Definition: ${definition}
- Student Level: ${level.toUpperCase()}
- Lesson Context: ${lessonContext}
${studentInfo ? `- Student Name: ${studentInfo.name}` : ''}
${studentInfo ? `- Target Language: ${studentInfo.target_language}` : ''}
${studentInfo ? `- Grammar Weaknesses: ${studentInfo.grammar_weaknesses || 'None specified'}` : ''}
${studentInfo ? `- Vocabulary Gaps: ${studentInfo.vocabulary_gaps || 'None specified'}` : ''}

CRITICAL REQUIREMENTS:
1. All examples must be contextually relevant to "${lessonContext}"
2. Use the word "${word}" naturally in each sentence
3. Show different grammatical uses and contexts
4. Appropriate for ${level.toUpperCase()} level learners
5. Use varied sentence structures (simple, compound, complex)
6. Include different contexts (formal, informal, personal, professional)
7. Demonstrate real-world usage
8. Each sentence must be unique and non-repetitive

PART OF SPEECH SPECIFIC REQUIREMENTS:
${partOfSpeech.toLowerCase().includes('noun') ? `
- Use with appropriate articles (a/an/the)
- Show singular/plural forms where applicable
- Use as subject, object, and in prepositional phrases
` : ''}
${partOfSpeech.toLowerCase().includes('verb') ? `
- Show different tenses and conjugations
- Use in active and passive voice where appropriate
- Include modal verbs and auxiliary verbs
` : ''}
${partOfSpeech.toLowerCase().includes('adjective') ? `
- Use to modify nouns in different positions
- Show comparative and superlative forms where applicable
- Use in predicative and attributive positions
` : ''}
${partOfSpeech.toLowerCase().includes('adverb') ? `
- Use to modify verbs, adjectives, and other adverbs
- Show different positions in sentences
- Demonstrate intensity and manner
` : ''}

Respond with this exact JSON structure:
{
  "examples": [
    "Example sentence 1 using ${word} in the context of ${lessonContext}",
    "Example sentence 2 using ${word} in the context of ${lessonContext}",
    "Example sentence 3 using ${word} in the context of ${lessonContext}"
  ]
}

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language tutor creating contextual example sentences. You must respond ONLY with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate examples' }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    const generatedContent = geminiData.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    // Clean and parse JSON response
    let cleanedContent = generatedContent.trim();
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    if (!parsedResponse.examples || !Array.isArray(parsedResponse.examples)) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      examples: parsedResponse.examples.slice(0, count),
      word,
      context: lessonContext
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Generate contextual examples error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}