import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateLessonRequest {
  student_id: string;
}

interface Student {
  id: string;
  name: string;
  target_language: string;
  level: string;
  end_goals: string | null;
  grammar_weaknesses: string | null;
  vocabulary_gaps: string | null;
  pronunciation_challenges: string | null;
  conversational_fluency_barriers: string | null;
  learning_styles: string[] | null;
  notes: string | null;
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

function constructPrompt(student: Student): string {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  return `You are an expert language tutor creating personalized lesson plans. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

Student Profile:
- Name: ${student.name}
- Target Language: ${languageName}
- Proficiency Level: ${student.level.toUpperCase()}
- End Goals: ${student.end_goals || 'General language improvement'}
- Grammar Weaknesses: ${student.grammar_weaknesses || 'None specified'}
- Vocabulary Gaps: ${student.vocabulary_gaps || 'None specified'}
- Pronunciation Challenges: ${student.pronunciation_challenges || 'None specified'}
- Conversational Fluency Barriers: ${student.conversational_fluency_barriers || 'None specified'}
- Learning Styles: ${student.learning_styles?.join(', ') || 'Not specified'}
- Additional Notes: ${student.notes || 'None'}

CRITICAL: Respond with ONLY the JSON object below. Do not include any other text, explanations, or formatting:

{
  "lessons": [
    {
      "title": "Lesson Title Here",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "materials": ["Material 1", "Material 2", "Material 3"],
      "assessment": ["Assessment method 1", "Assessment method 2"]
    },
    {
      "title": "Second Lesson Title",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "materials": ["Material 1", "Material 2", "Material 3"],
      "assessment": ["Assessment method 1", "Assessment method 2"]
    },
    {
      "title": "Third Lesson Title",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "materials": ["Material 1", "Material 2", "Material 3"],
      "assessment": ["Assessment method 1", "Assessment method 2"]
    }
  ]
}

Requirements for each lesson:
1. Tailor to ${student.level.toUpperCase()} level ${languageName}
2. Address specific weaknesses and gaps mentioned
3. Incorporate preferred learning styles
4. Be practical for 45-60 minute sessions
5. Include mix of speaking, listening, reading, writing

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;
}

function cleanJsonResponse(content: string): string {
  // Remove any markdown code block formatting
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Find the first { and last } to extract just the JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

serve(async (req) => {
  console.log('🚀 Edge function called:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔐 Checking authorization...');
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      throw new Error('Invalid token')
    }

    console.log('✅ User authenticated:', user.id);

    console.log('📦 Parsing request body...');
    const { student_id }: GenerateLessonRequest = await req.json()

    if (!student_id) {
      throw new Error('Student ID is required')
    }

    console.log('🔍 Fetching student details for ID:', student_id);
    // Fetch student details
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', student_id)
      .eq('tutor_id', user.id) // Ensure the student belongs to the authenticated tutor
      .single()

    if (studentError || !student) {
      console.error('❌ Student fetch error:', studentError);
      throw new Error('Student not found or access denied')
    }

    console.log('✅ Student found:', student.name);

    // Construct the prompt
    const prompt = constructPrompt(student as Student)
    console.log('📝 Prompt constructed, length:', prompt.length);

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('🤖 Calling Gemini API...');
    // Call Gemini API using the OpenAI-compatible endpoint
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
            content: 'You are an expert language tutor. You must respond ONLY with valid JSON in the exact format requested. Do not include any explanations, markdown formatting, or additional text outside the JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent JSON output
        max_tokens: 2000,
      }),
    })

    console.log('📡 Gemini API response status:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('❌ Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData}`)
    }

    const geminiData = await geminiResponse.json()
    console.log('✅ Gemini API response received');
    console.log('🔍 Full Gemini response:', JSON.stringify(geminiData, null, 2));
    
    const generatedContent = geminiData.choices[0]?.message?.content

    if (!generatedContent) {
      throw new Error('No content generated from Gemini')
    }

    console.log('📄 Raw generated content:');
    console.log('---START RAW CONTENT---');
    console.log(generatedContent);
    console.log('---END RAW CONTENT---');
    console.log('📏 Generated content length:', generatedContent.length);

    // Clean the JSON response
    const cleanedContent = cleanJsonResponse(generatedContent);
    console.log('🧹 Cleaned content:');
    console.log('---START CLEANED CONTENT---');
    console.log(cleanedContent);
    console.log('---END CLEANED CONTENT---');

    // Parse the JSON response
    let parsedLessons
    try {
      parsedLessons = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed to parse content:', cleanedContent);
      console.error('❌ Content type:', typeof cleanedContent);
      console.error('❌ Content starts with:', cleanedContent.substring(0, 100));
      console.error('❌ Content ends with:', cleanedContent.substring(cleanedContent.length - 100));
      
      // Try to extract JSON from the content more aggressively
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔧 Attempting to parse extracted JSON...');
        try {
          parsedLessons = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed extracted JSON');
        } catch (secondParseError) {
          console.error('❌ Second parse attempt failed:', secondParseError);
          throw new Error(`Failed to parse Gemini response as JSON. Raw content: ${cleanedContent.substring(0, 500)}...`)
        }
      } else {
        throw new Error(`No valid JSON found in Gemini response. Raw content: ${cleanedContent.substring(0, 500)}...`)
      }
    }

    if (!parsedLessons.lessons || !Array.isArray(parsedLessons.lessons)) {
      console.error('❌ Invalid lesson format:', parsedLessons);
      throw new Error('Invalid lesson format from Gemini - missing lessons array')
    }

    console.log('✅ Lessons parsed successfully, count:', parsedLessons.lessons.length);

    // Validate lesson structure
    for (let i = 0; i < parsedLessons.lessons.length; i++) {
      const lesson = parsedLessons.lessons[i];
      if (!lesson.title || !lesson.objectives || !lesson.activities || !lesson.materials || !lesson.assessment) {
        console.error(`❌ Invalid lesson structure at index ${i}:`, lesson);
        throw new Error(`Lesson ${i + 1} is missing required fields`);
      }
    }

    // Create a new lesson entry with the generated content
    console.log('💾 Saving lesson to database...');
    const { data: lessonData, error: lessonError } = await supabaseClient
      .from('lessons')
      .insert({
        student_id: student_id,
        tutor_id: user.id,
        date: new Date().toISOString(),
        status: 'upcoming',
        materials: ['AI Generated Lesson Plans'],
        notes: `AI-generated lesson plans created on ${new Date().toLocaleDateString()}`,
        generated_lessons: parsedLessons.lessons.map((lesson: any) => JSON.stringify(lesson))
      })
      .select()
      .single()

    if (lessonError) {
      console.error('❌ Database save error:', lessonError);
      throw new Error(`Failed to save lesson: ${lessonError.message}`)
    }

    console.log('✅ Lesson saved successfully with ID:', lessonData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lessons: parsedLessons.lessons,
        lesson_id: lessonData.id,
        message: 'Lesson plans generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
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