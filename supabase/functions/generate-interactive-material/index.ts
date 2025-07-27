import { serve } from "jsr:@std/http@0.224.0/server"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateInteractiveMaterialRequest {
  lesson_id: string;
  selected_sub_topic: {
    id: string;
    title: string;
    category: string;
    level: string;
    description?: string;
  };
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

interface LessonTemplate {
  id: string;
  name: string;
  category: string;
  level: string;
  template_json: any;
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

function constructInteractiveMaterialPrompt(
  student: Student, 
  subTopic: any,
  template: LessonTemplate | null
): string {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  if (template) {
    // Use template-based prompt
    return `You are an expert language tutor creating interactive lesson materials. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

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

Sub-Topic to Focus On:
- Title: ${subTopic.title}
- Category: ${subTopic.category}
- Level: ${subTopic.level}
- Description: ${subTopic.description || 'No description provided'}

Template Structure to Fill:
${JSON.stringify(template.template_json, null, 2)}

CRITICAL INSTRUCTIONS:
1. You must fill ALL "ai_placeholder" fields in the template with appropriate content based on the student profile and sub-topic
2. Replace placeholder content like "Lesson Title Here" with the actual sub-topic title: "${subTopic.title}"
3. Generate specific, detailed content for each section that matches the student's level and needs
4. For vocabulary_items arrays, create 4-6 relevant vocabulary words with definitions
5. For dialogue_lines arrays, create realistic conversations appropriate for the level. Each dialogue line MUST be an object with "character" and "text" properties:
   Example: [
     {"character": "Teacher", "text": "Hello! How are you today?"},
     {"character": "Student", "text": "I'm fine, thank you. How are you?"},
     {"character": "Teacher", "text": "I'm very well, thanks for asking."}
   ]
6. For matching_pairs arrays, create 3-5 question-answer pairs
7. For list items, create 3-5 relevant items
8. Ensure all content is appropriate for ${student.level.toUpperCase()} level ${languageName}
9. Address the student's specific weaknesses and learning goals
10. Make the content engaging and practical
11. Focus specifically on the sub-topic: ${subTopic.title}
12. NEVER leave any dialogue_lines empty - always populate both "character" and "text" fields with meaningful content
13. For dialogue_elements in fill_in_the_blanks_dialogue, ensure each dialogue element has proper "character" and "text" fields

RESPOND ONLY WITH THE FILLED TEMPLATE JSON - NO OTHER TEXT.`;
  } else {
    // Use basic prompt for fallback
    return `You are an expert language tutor creating basic interactive lesson content. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

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

Sub-Topic to Focus On:
- Title: ${subTopic.title}
- Category: ${subTopic.category}
- Level: ${subTopic.level}
- Description: ${subTopic.description || 'No description provided'}

Create a basic interactive lesson focused on this sub-topic. Respond with this JSON structure:

{
  "name": "${subTopic.title}",
  "category": "${subTopic.category}",
  "level": "${subTopic.level}",
  "content": {
    "title": "${subTopic.title}",
    "introduction": "Brief introduction to the topic",
    "main_content": "Detailed explanation and examples",
    "practice_exercises": [
      "Exercise 1 description",
      "Exercise 2 description",
      "Exercise 3 description"
    ],
    "vocabulary": [
      {"word": "word1", "definition": "definition1"},
      {"word": "word2", "definition": "definition2"},
      {"word": "word3", "definition": "definition3"}
    ],
    "dialogue_example": [
      {"character": "Teacher", "text": "Example dialogue line 1"},
      {"character": "Student", "text": "Example dialogue line 2"}
    ],
    "wrap_up": "Summary and key takeaways"
  }
}

CRITICAL INSTRUCTIONS:
1. Focus specifically on the sub-topic: ${subTopic.title}
2. Make content appropriate for ${student.level.toUpperCase()} level ${languageName}
3. Address the student's specific learning needs
4. Create practical, engaging content
5. Include vocabulary, examples, and practice exercises
6. ALWAYS populate dialogue arrays with objects containing "character" and "text" properties
7. NEVER leave dialogue text empty - always provide meaningful conversation content

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;
  }
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
      console.log('🔧 Second attempt failed');
      throw new Error(`Unable to parse JSON after multiple attempts. Original: ${jsonString.substring(0, 200)}...`);
    }
  }
}

function selectAppropriateTemplate(subTopic: any, templates: LessonTemplate[]): LessonTemplate | null {
  // First, try to find a template that matches the sub-topic's level and category exactly
  const exactMatches = templates.filter(t => 
    t.level === subTopic.level && t.category === subTopic.category
  );
  
  if (exactMatches.length > 0) {
    console.log(`✅ Found exact match template: ${exactMatches[0].name}`);
    return exactMatches[0];
  }
  
  // Try to match by category only (any level)
  const categoryMatches = templates.filter(t => t.category === subTopic.category);
  
  if (categoryMatches.length > 0) {
    console.log(`✅ Found category match template: ${categoryMatches[0].name}`);
    return categoryMatches[0];
  }
  
  // Try to match by level only (any category)
  const levelMatches = templates.filter(t => t.level === subTopic.level);
  
  if (levelMatches.length > 0) {
    // Prefer Conversation templates as they're most generic
    const conversationTemplate = levelMatches.find(t => t.category === 'Conversation');
    if (conversationTemplate) {
      console.log(`✅ Using Conversation template for level ${subTopic.level}: ${conversationTemplate.name}`);
      return conversationTemplate;
    }
    
    console.log(`✅ Using first available template for level ${subTopic.level}: ${levelMatches[0].name}`);
    return levelMatches[0];
  }
  
  console.log(`⚠️ No suitable template found for category: ${subTopic.category}, level: ${subTopic.level}`);
  return null;
}

serve(async (req) => {
  console.log('🚀 Generate Interactive Material function called:', req.method, req.url);

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      throw new Error('Invalid token')
    }

    console.log('✅ User authenticated:', user.id);

    console.log('📦 Parsing request body...');
    const { lesson_id, selected_sub_topic }: GenerateInteractiveMaterialRequest = await req.json()

    if (!lesson_id || !selected_sub_topic) {
      throw new Error('lesson_id and selected_sub_topic are required')
    }

    console.log('🔍 Fetching lesson details for ID:', lesson_id);
    
    // Fetch lesson with student details
    const { data: lessonData, error: lessonError } = await supabaseClient
      .from('lessons')
      .select(`
        *,
        student:students(*)
      `)
      .eq('id', lesson_id)
      .eq('tutor_id', user.id)
      .single()

    if (lessonError || !lessonData) {
      console.error('❌ Lesson fetch error:', lessonError);
      throw new Error('Lesson not found or access denied')
    }

    const lesson = lessonData as Lesson;
    const student = lesson.student as Student;

    console.log('✅ Lesson found:', lesson.id, 'for student:', student.name);
    console.log('🎯 Selected sub-topic:', selected_sub_topic.title);

    // Fetch available lesson templates
    console.log('🎯 Fetching lesson templates...');
    const { data: templatesData, error: templatesError } = await supabaseClient
      .from('lesson_templates')
      .select('*')
      .eq('is_active', true);

    if (templatesError) {
      console.error('❌ Templates fetch error:', templatesError);
      throw new Error('Failed to fetch lesson templates')
    }

    const templates = templatesData as LessonTemplate[];
    console.log(`✅ Found ${templates.length} active templates`);

    // Select the most appropriate template
    const selectedTemplate = selectAppropriateTemplate(selected_sub_topic, templates);
    
    let templateName = 'Basic Interactive Lesson';
    if (selectedTemplate) {
      templateName = selectedTemplate.name;
      console.log('🎯 Using template:', selectedTemplate.name);
    } else {
      console.log('🎯 No specific template found, using basic interactive format');
    }

    // Construct the prompt for AI
    const prompt = constructInteractiveMaterialPrompt(student, selected_sub_topic, selectedTemplate);
    console.log('📝 Prompt constructed, length:', prompt.length);

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('🤖 Calling Gemini API...');
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
            content: 'You are an expert language tutor creating interactive lesson materials. You must respond ONLY with valid JSON in the exact format requested. Do not include any explanations, markdown formatting, or additional text outside the JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
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
    
    const generatedContent = geminiData.choices[0]?.message?.content

    if (!generatedContent) {
      throw new Error('No content generated from Gemini')
    }

    console.log('📄 Raw generated content length:', generatedContent.length);

    // Clean and parse the JSON response
    const cleanedContent = cleanJsonResponse(generatedContent);
    console.log('🧹 Cleaned content length:', cleanedContent.length);

    let filledTemplate;
    try {
      filledTemplate = validateAndFixJson(cleanedContent);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Failed to parse AI-generated interactive material')
    }

    console.log('✅ Interactive material parsed successfully');

    // Update the lesson with the interactive content
    console.log('💾 Updating lesson with interactive content...');
    const { data: updatedLesson, error: updateError } = await supabaseClient
      .from('lessons')
      .update({
        interactive_lesson_content: {
          ...filledTemplate,
          selected_sub_topic: selected_sub_topic,
          created_at: new Date().toISOString()
        },
        lesson_template_id: selectedTemplate?.id || null
      })
      .eq('id', lesson_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw new Error(`Failed to update lesson: ${updateError.message}`)
    }

    console.log('✅ Lesson updated successfully with interactive content');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Interactive lesson material generated successfully',
        lesson_id: updatedLesson.id,
        lesson_template_id: selectedTemplate?.id || null,
        template_name: templateName,
        sub_topic: selected_sub_topic,
        interactive_content: filledTemplate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Generate interactive material error:', error)
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