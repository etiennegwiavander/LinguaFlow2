import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateLessonRequest {
  lesson_id?: string;
  student_id?: string;
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

interface Lesson {
  id: string;
  student_id: string;
  tutor_id: string;
  date: string;
  status: string;
  materials: string[];
  notes: string | null;
  generated_lessons: string[] | null;
  sub_topics: any[] | null;
  lesson_template_id: string | null;
  student?: Student;
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
  
  return `You are an expert language tutor creating personalized lesson plans with detailed sub-topics. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

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
      "title": "Main Lesson Title Here",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "materials": ["Material 1", "Material 2", "Material 3"],
      "assessment": ["Assessment method 1", "Assessment method 2"],
      "sub_topics": [
        {
          "id": "subtopic_1",
          "title": "Grammar: Present Simple Tense",
          "category": "Grammar",
          "level": "${student.level}",
          "description": "Focus on forming and using present simple tense"
        },
        {
          "id": "subtopic_2", 
          "title": "Vocabulary: Daily Routines",
          "category": "Vocabulary",
          "level": "${student.level}",
          "description": "Learn vocabulary related to daily activities"
        },
        {
          "id": "subtopic_3",
          "title": "Conversation: Talking About Hobbies",
          "category": "Conversation", 
          "level": "${student.level}",
          "description": "Practice discussing personal interests and hobbies"
        }
      ]
    },
    {
      "title": "Second Main Lesson Title",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "materials": ["Material 1", "Material 2", "Material 3"],
      "assessment": ["Assessment method 1", "Assessment method 2"],
      "sub_topics": [
        {
          "id": "subtopic_4",
          "title": "Grammar: Past Tense Verbs",
          "category": "Grammar",
          "level": "${student.level}",
          "description": "Learn regular and irregular past tense forms"
        },
        {
          "id": "subtopic_5",
          "title": "Vocabulary: Travel and Transportation",
          "category": "Vocabulary", 
          "level": "${student.level}",
          "description": "Essential travel vocabulary and phrases"
        },
        {
          "id": "subtopic_6",
          "title": "Conversation: Making Plans",
          "category": "Conversation",
          "level": "${student.level}",
          "description": "Practice discussing future plans and arrangements"
        }
      ]
    },
    {
      "title": "Third Main Lesson Title",
      "objectives": ["Objective 1", "Objective 2", "Objective 3"],
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "materials": ["Material 1", "Material 2", "Material 3"],
      "assessment": ["Assessment method 1", "Assessment method 2"],
      "sub_topics": [
        {
          "id": "subtopic_7",
          "title": "Grammar: Question Formation",
          "category": "Grammar",
          "level": "${student.level}",
          "description": "Learn to form different types of questions"
        },
        {
          "id": "subtopic_8",
          "title": "Vocabulary: Food and Dining",
          "category": "Vocabulary",
          "level": "${student.level}",
          "description": "Food vocabulary and restaurant expressions"
        },
        {
          "id": "subtopic_9",
          "title": "Conversation: Ordering Food",
          "category": "Conversation",
          "level": "${student.level}",
          "description": "Practice ordering food and drinks in restaurants"
        }
      ]
    }
  ]
}

Requirements for each lesson and sub-topic:
1. Tailor to ${student.level.toUpperCase()} level ${languageName}
2. Address specific weaknesses and gaps mentioned
3. Incorporate preferred learning styles
4. Be practical for 45-60 minute sessions
5. Generate 3-6 sub-topics per lesson covering different skill areas
6. Sub-topics should be specific, focused, and teachable in 15-20 minutes each
7. Categories should match available lesson templates: Grammar, Conversation, Business English, English for Kids, Vocabulary, Pronunciation, Picture Description, English for Travel

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;
}

function cleanJsonResponse(content: string): string {
  // Remove any markdown code block formatting
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Remove trailing commas before closing brackets/braces (common AI mistake)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove any text before the first { or after the last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // Additional cleanup for common JSON formatting issues
  cleaned = cleaned
    // Fix the above fix if it was too aggressive
    .replace(/\\\\"/g, '\\"')
    // Remove any remaining non-JSON text
    .replace(/^[^{]*/, '')
    .replace(/[^}]*$/, '');
  
  return cleaned;
}

function validateAndFixJson(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.log('🔧 Initial JSON parse failed, attempting fixes...');
    
    // Try more aggressive cleaning
    let fixed = jsonString
      // Remove any control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Fix common quote issues
      .replace(/'/g, '"')
      // Fix trailing commas more aggressively
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix missing commas between array elements
      .replace(/}(\s*){/g, '},$1{')
      .replace(/](\s*)\[/g, '],$1[');
    
    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log('🔧 Second attempt failed, trying manual extraction...');
      
      // Try to extract just the lessons array if the full object is malformed
      const lessonsMatch = fixed.match(/"lessons"\s*:\s*\[([\s\S]*)\]/);
      if (lessonsMatch) {
        try {
          const lessonsArray = JSON.parse(`[${lessonsMatch[1]}]`);
          return { lessons: lessonsArray };
        } catch (thirdError) {
          console.log('🔧 Manual extraction failed');
        }
      }
      
      throw new Error(`Unable to parse JSON after multiple attempts. Original: ${jsonString.substring(0, 200)}...`);
    }
  }
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
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔐 Checking authorization...');
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    let user;
    
    // Check if this is a service role token (for automated calls)
    if (token === Deno.env.get('SERVICE_ROLE_KEY')) {
      console.log('🤖 Service role authentication detected');
      user = { id: 'service-role' }; // We'll get the actual tutor_id from the lesson record
    } else {
      // Regular user authentication
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token)
      
      if (authError || !authUser) {
        console.error('❌ Auth error:', authError)
        throw new Error('Invalid token')
      }
      user = authUser;
      console.log('✅ User authenticated:', user.id);
    }

    console.log('📦 Parsing request body...');
    const { lesson_id, student_id }: GenerateLessonRequest = await req.json()

    if (!lesson_id && !student_id) {
      throw new Error('Either lesson_id or student_id is required')
    }

    let lesson: Lesson;
    let student: Student;
    let lessonTemplateId: string | null = null;

    // Get the A1 Conversation template ID (we'll use this as default for now)
    console.log('🎯 Fetching lesson template...');
    const { data: templateData, error: templateError } = await supabaseClient
      .from('lesson_templates')
      .select('id')
      .eq('name', 'A1 Conversation Lesson')
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('⚠️ Could not fetch lesson template:', templateError);
    } else {
      lessonTemplateId = templateData.id;
      console.log('✅ Found lesson template ID:', lessonTemplateId);
    }

    if (lesson_id) {
      console.log('🔍 Fetching lesson details for ID:', lesson_id);
      
      // Fetch lesson with student details
      const { data: lessonData, error: lessonError } = await supabaseClient
        .from('lessons')
        .select(`
          *,
          student:students(*)
        `)
        .eq('id', lesson_id)
        .single()

      if (lessonError || !lessonData) {
        console.error('❌ Lesson fetch error:', lessonError);
        throw new Error('Lesson not found')
      }

      lesson = lessonData as Lesson;
      student = lesson.student as Student;

      // For non-service role calls, verify ownership
      if (user.id !== 'service-role' && lesson.tutor_id !== user.id) {
        throw new Error('Access denied - lesson does not belong to authenticated tutor')
      }

      console.log('✅ Lesson found:', lesson.id, 'for student:', student.name);
    } else {
      // Legacy mode: student_id provided, create new lesson
      console.log('🔍 Fetching student details for ID:', student_id);
      
      if (user.id === 'service-role') {
        throw new Error('Service role calls must provide lesson_id')
      }

      const { data: studentData, error: studentError } = await supabaseClient
        .from('students')
        .select('*')
        .eq('id', student_id)
        .eq('tutor_id', user.id)
        .single()

      if (studentError || !studentData) {
        console.error('❌ Student fetch error:', studentError);
        throw new Error('Student not found or access denied')
      }

      student = studentData as Student;
      console.log('✅ Student found:', student.name);
    }

    // Construct the prompt
    const prompt = constructPrompt(student)
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
        temperature: 0.1,
        max_tokens: 3000,
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
    
    // 🔍 DEBUG: Log the full AI response
    console.log('🔍 DEBUG: Full Gemini API response:');
    console.log(JSON.stringify(geminiData, null, 2));
    
    const generatedContent = geminiData.choices[0]?.message?.content

    if (!generatedContent) {
      throw new Error('No content generated from Gemini')
    }

    // 🔍 DEBUG: Log the extracted content
    console.log('🔍 DEBUG: Extracted content from AI:');
    console.log('---START EXTRACTED CONTENT---');
    console.log(generatedContent);
    console.log('---END EXTRACTED CONTENT---');
    console.log('📏 Generated content length:', generatedContent.length);

    // Clean the JSON response
    const cleanedContent = cleanJsonResponse(generatedContent);
    
    // 🔍 DEBUG: Log the cleaned content
    console.log('🔍 DEBUG: Cleaned content:');
    console.log('---START CLEANED CONTENT---');
    console.log(cleanedContent);
    console.log('---END CLEANED CONTENT---');

    // Parse the JSON response with improved error handling
    let parsedLessons;
    try {
      parsedLessons = validateAndFixJson(cleanedContent);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed content:', cleanedContent);
      
      // Fallback: create a basic lesson structure
      console.log('🔄 Creating fallback lesson structure...');
      parsedLessons = {
        lessons: [
          {
            title: `${student.target_language.toUpperCase()} Lesson for ${student.name}`,
            objectives: [
              `Practice ${student.level} level ${student.target_language}`,
              "Improve conversational skills",
              "Review grammar fundamentals"
            ],
            activities: [
              "Warm-up conversation",
              "Grammar practice exercises",
              "Vocabulary building",
              "Speaking practice"
            ],
            materials: [
              "Textbook exercises",
              "Audio recordings",
              "Conversation prompts"
            ],
            assessment: [
              "Oral assessment",
              "Grammar quiz"
            ],
            sub_topics: [
              {
                id: "subtopic_1",
                title: "Basic Conversation",
                category: "Conversation",
                level: student.level,
                description: "Practice basic conversational skills"
              },
              {
                id: "subtopic_2",
                title: "Essential Grammar",
                category: "Grammar",
                level: student.level,
                description: "Review fundamental grammar concepts"
              }
            ]
          }
        ]
      };
    }

    // 🔍 DEBUG: Log the parsed lessons object
    console.log('🔍 DEBUG: Parsed lessons object:');
    console.log(JSON.stringify(parsedLessons, null, 2));

    if (!parsedLessons.lessons || !Array.isArray(parsedLessons.lessons)) {
      console.error('❌ Invalid lesson format:', parsedLessons);
      throw new Error('Invalid lesson format from Gemini - missing lessons array')
    }

    console.log('✅ Lessons parsed successfully, count:', parsedLessons.lessons.length);

    // Validate lesson structure and extract sub-topics
    let allSubTopics: any[] = [];
    for (let i = 0; i < parsedLessons.lessons.length; i++) {
      const lessonPlan = parsedLessons.lessons[i];
      
      // 🔍 DEBUG: Log each lesson plan structure
      console.log(`🔍 DEBUG: Lesson ${i + 1} structure:`, JSON.stringify(lessonPlan, null, 2));
      
      if (!lessonPlan.title || !lessonPlan.objectives || !lessonPlan.activities || !lessonPlan.materials || !lessonPlan.assessment) {
        console.error(`❌ Invalid lesson structure at index ${i}:`, lessonPlan);
        throw new Error(`Lesson ${i + 1} is missing required fields`);
      }
      
      // Collect sub-topics from all lessons
      if (lessonPlan.sub_topics && Array.isArray(lessonPlan.sub_topics)) {
        console.log(`🔍 DEBUG: Found ${lessonPlan.sub_topics.length} sub-topics in lesson ${i + 1}:`, lessonPlan.sub_topics);
        allSubTopics = allSubTopics.concat(lessonPlan.sub_topics);
      } else {
        console.log(`⚠️ DEBUG: No sub-topics found in lesson ${i + 1} or invalid format:`, lessonPlan.sub_topics);
      }
    }

    // 🔍 DEBUG: Log the final allSubTopics array before database operation
    console.log('🔍 DEBUG: Final allSubTopics array before database operation:');
    console.log('  - Length:', allSubTopics.length);
    console.log('  - Content:', JSON.stringify(allSubTopics, null, 2));

    console.log('✅ Total sub-topics extracted:', allSubTopics.length);

    if (lesson_id) {
      // Update existing lesson
      console.log('💾 Updating existing lesson with generated content...');
      const updateData: any = {
        generated_lessons: parsedLessons.lessons.map((lessonPlan: any) => JSON.stringify(lessonPlan)),
        sub_topics: allSubTopics,
        notes: `AI-generated lesson plans updated on ${new Date().toLocaleDateString()}`
      };

      // Add lesson template ID if we found one
      if (lessonTemplateId) {
        updateData.lesson_template_id = lessonTemplateId;
        console.log('📎 Adding lesson template ID to update:', lessonTemplateId);
      }

      // 🔍 DEBUG: Log the update data being sent to database
      console.log('🔍 DEBUG: Update data being sent to database:');
      console.log('  - generated_lessons count:', updateData.generated_lessons.length);
      console.log('  - sub_topics:', JSON.stringify(updateData.sub_topics, null, 2));
      console.log('  - lesson_template_id:', updateData.lesson_template_id);

      const { data: updatedLesson, error: updateError } = await supabaseClient
        .from('lessons')
        .update(updateData)
        .eq('id', lesson_id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw new Error(`Failed to update lesson: ${updateError.message}`)
      }

      // 🔍 DEBUG: Log the updated lesson data returned from database
      console.log('🔍 DEBUG: Updated lesson data returned from database:');
      console.log('  - sub_topics in returned data:', JSON.stringify(updatedLesson.sub_topics, null, 2));

      console.log('✅ Lesson updated successfully with ID:', updatedLesson.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          lessons: parsedLessons.lessons,
          sub_topics: allSubTopics,
          lesson_id: updatedLesson.id,
          lesson_template_id: lessonTemplateId,
          message: 'Lesson plans updated successfully',
          updated: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      // Create new lesson (legacy mode)
      console.log('💾 Creating new lesson with generated content...');
      const insertData: any = {
        student_id: student_id,
        tutor_id: user.id,
        date: new Date().toISOString(),
        status: 'upcoming',
        materials: ['AI Generated Lesson Plans'],
        notes: `AI-generated lesson plans created on ${new Date().toLocaleDateString()}`,
        generated_lessons: parsedLessons.lessons.map((lessonPlan: any) => JSON.stringify(lessonPlan)),
        sub_topics: allSubTopics
      };

      // Add lesson template ID if we found one
      if (lessonTemplateId) {
        insertData.lesson_template_id = lessonTemplateId;
        console.log('📎 Adding lesson template ID to new lesson:', lessonTemplateId);
      }

      // 🔍 DEBUG: Log the insert data being sent to database
      console.log('🔍 DEBUG: Insert data being sent to database:');
      console.log('  - generated_lessons count:', insertData.generated_lessons.length);
      console.log('  - sub_topics:', JSON.stringify(insertData.sub_topics, null, 2));
      console.log('  - lesson_template_id:', insertData.lesson_template_id);

      const { data: lessonData, error: lessonError } = await supabaseClient
        .from('lessons')
        .insert(insertData)
        .select()
        .single()

      if (lessonError) {
        console.error('❌ Database save error:', lessonError);
        throw new Error(`Failed to save lesson: ${lessonError.message}`)
      }

      // 🔍 DEBUG: Log the created lesson data returned from database
      console.log('🔍 DEBUG: Created lesson data returned from database:');
      console.log('  - sub_topics in returned data:', JSON.stringify(lessonData.sub_topics, null, 2));

      console.log('✅ Lesson saved successfully with ID:', lessonData.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          lessons: parsedLessons.lessons,
          sub_topics: allSubTopics,
          lesson_id: lessonData.id,
          lesson_template_id: lessonTemplateId,
          message: 'Lesson plans generated successfully',
          created: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

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