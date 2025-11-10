import { serve } from "jsr:@std/http@0.224.0/server";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenerateQuestionsRequest {
  student_id: string;
  topic_title: string;
  custom_topic?: boolean;
}

interface Student {
  id: string;
  name: string;
  target_language: string;
  native_language: string | null;
  level: string;
  age_group?: string;
  end_goals: string | null;
  grammar_weaknesses: string | null;
  vocabulary_gaps: string | null;
  pronunciation_challenges: string | null;
  conversational_fluency_barriers: string | null;
  learning_styles: string[] | null;
  notes: string | null;
}

// Create highly contextual, topic-specific prompts
function createTopicSpecificPrompt(topicTitle: string, student: Student): string {
  const topicLower = topicTitle.toLowerCase();
  const studentName = student.name;
  const level = student.level.toUpperCase();
  
  // Base requirements for all topics
  const baseRequirements = `
Student: ${studentName} (${level} level ${student.target_language})
Generate 15-18 unique, contextual discussion questions.

CRITICAL REQUIREMENTS:
- Each question must be completely different in structure and approach
- NO formulaic patterns like "Tell me about a time when..." repeated
- NO generic question starters across multiple questions
- Make each question feel like it comes from a different conversation
- Use ${studentName}'s name in questions naturally, not forced
- Focus on specific, concrete scenarios rather than abstract concepts

Format: JSON array only:
[{"question_text": "...", "difficulty_level": "${student.level}", "question_order": 1}]
`;

  // Topic-specific prompts with completely different approaches
  if (topicLower.includes('food') || topicLower.includes('cooking') || topicLower.includes('restaurant')) {
    return `${baseRequirements}

FOOD & COOKING - Create questions that explore:
- Specific cooking disasters and kitchen adventures
- Sensory memories (smells, tastes, textures)
- Cultural food traditions and family recipes
- Restaurant experiences and food discoveries
- Emotional connections to specific dishes
- Food-related travel memories
- Cooking skills and kitchen confidence
- Food preferences and dietary choices

Example variety (use different structures):
- "What's the worst cooking disaster you've ever had, ${studentName}?"
- "If you could smell one food cooking right now, what would instantly make you hungry?"
- "Which dish from your childhood could your mother/grandmother make that no restaurant has ever matched?"
- "Have you ever tried to recreate a dish you had while traveling? How did it go?"
- "What's a food combination that sounds weird but you absolutely love?"

Make each question completely unique in structure and focus.`;
  }
  
  if (topicLower.includes('travel') || topicLower.includes('vacation') || topicLower.includes('trip')) {
    return `${baseRequirements}

TRAVEL & ADVENTURE - Create questions about:
- Specific travel mishaps and unexpected adventures
- Cultural shock moments and discoveries
- Transportation experiences (flights, trains, buses)
- Meeting locals and language barriers
- Travel planning vs spontaneous adventures
- Solo travel vs group travel experiences
- Budget travel vs luxury experiences
- Travel photography and memories
- Getting lost and finding hidden gems

Example variety (use different structures):
- "What's the most embarrassing thing that happened to you while traveling, ${studentName}?"
- "Have you ever missed a flight or train? What happened next?"
- "Which local person you met while traveling left the biggest impression on you?"
- "What's the strangest place you've ever slept during your travels?"
- "If you could relive one travel day exactly as it happened, which would it be?"

Each question should explore different aspects with unique phrasing.`;
  }
  
  if (topicLower.includes('technology') || topicLower.includes('social media') || topicLower.includes('internet')) {
    return `${baseRequirements}

TECHNOLOGY & DIGITAL LIFE - Create questions about:
- Specific tech failures and digital disasters
- Social media habits and online relationships
- Smartphone addiction and digital detox
- Online shopping and digital payments
- Video calls and remote communication
- Apps that changed their life
- Tech generational differences
- Privacy concerns and digital footprint
- Gaming and entertainment technology

Example variety (use different structures):
- "What's the most frustrating tech problem you've ever dealt with, ${studentName}?"
- "Have you ever posted something online that you immediately regretted?"
- "Which app on your phone would be hardest to give up for a month?"
- "What's the weirdest thing you've ever bought online?"
- "Do you remember your first email address or social media account?"

Focus on specific scenarios and personal tech experiences.`;
  }
  
  if (topicLower.includes('work') || topicLower.includes('job') || topicLower.includes('career')) {
    return `${baseRequirements}

WORK & CAREER - Create questions about:
- Specific workplace situations and office dynamics
- Career changes and professional growth
- Work-life balance challenges
- Memorable colleagues and bosses
- Job interviews and career mistakes
- Remote work and office culture
- Professional achievements and failures
- Workplace communication and conflicts
- Industry changes and future of work

Example variety (use different structures):
- "What's the most awkward situation you've experienced at work, ${studentName}?"
- "Have you ever had a boss who completely changed how you think about leadership?"
- "What's the biggest professional risk you've ever taken?"
- "If you could go back and give your first-day-at-work self one piece of advice, what would it be?"
- "What's a work skill you wish you'd learned earlier in your career?"

Each question should target specific workplace scenarios.`;
  }
  
  if (topicLower.includes('health') || topicLower.includes('fitness') || topicLower.includes('exercise')) {
    return `${baseRequirements}

HEALTH & FITNESS - Create questions about:
- Specific fitness challenges and achievements
- Health scares and medical experiences
- Exercise routines and workout preferences
- Mental health and stress management
- Sleep habits and energy levels
- Injury recovery and physical limitations
- Healthy eating and diet experiments
- Body image and self-confidence
- Wellness trends and health fads

Example variety (use different structures):
- "What's the most physically challenging thing you've ever accomplished, ${studentName}?"
- "Have you ever tried a fitness trend that was completely wrong for you?"
- "What's your relationship with sleep like - are you a morning person or night owl?"
- "If you could change one thing about how you take care of your health, what would it be?"
- "What's the best piece of health advice someone ever gave you?"

Focus on personal health journeys and specific experiences.`;
  }
  
  // Generic but still contextual for other topics
  return `${baseRequirements}

TOPIC: ${topicTitle} - Create questions that explore:
- Personal experiences and memorable moments
- Emotional connections and meaningful stories
- Practical challenges and learning experiences
- Cultural differences and perspectives
- Future aspirations and past reflections
- Specific scenarios and concrete examples
- Problem-solving and decision-making
- Relationships and social aspects

Example variety for any topic:
- "What's something about ${topicTitle} that completely surprised you, ${studentName}?"
- "Have you ever had to make a difficult decision related to ${topicTitle}?"
- "What's the biggest misconception people have about ${topicTitle}?"
- "If you could teach someone one important thing about ${topicTitle}, what would it be?"
- "What's changed the most about ${topicTitle} since you were younger?"

Make each question explore different angles with unique structures.`;
}

// AI-powered question generator using DeepSeek via OpenRouter
async function generatePersonalizedQuestions(student: Student, topicTitle: string) {
  console.log('🤖 Generating questions using DeepSeek 3.1 via OpenRouter');
  
  try {
    // Get OpenRouter API key from environment (securely stored in Supabase)
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not found in environment variables");
    }

    // Create highly specific, contextual prompts based on the topic
    const topicSpecificPrompt = createTopicSpecificPrompt(topicTitle, student);
    
    // Call OpenRouter API with DeepSeek 3.1
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguaflow.app',
        'X-Title': 'LinguaFlow Discussion Questions'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [{
          role: 'user',
          content: topicSpecificPrompt
        }],
        temperature: 0.9,
        max_tokens: 1500,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No content generated by DeepSeek API');
    }

    console.log('🤖 Raw DeepSeek response received');

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in DeepSeek response');
    }

    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate and format questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format from DeepSeek API');
    }

    console.log(`✅ Generated ${questions.length} questions using DeepSeek 3.1`);
    
    return questions.map((q, index) => ({
      question_text: q.question_text || q.question || '',
      difficulty_level: student.level,
      question_order: index + 1
    }));

  } catch (error) {
    console.error('❌ DeepSeek API failed:', error);
    
    // No fallback - throw error to force proper AI generation
    throw new Error(`Failed to generate AI questions: ${error instanceof Error ? error.message : 'Unknown error'}. Please check OPENROUTER_API_KEY is set correctly in Supabase secrets.`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Generate Discussion Questions function called");

    // Parse request body
    const {
      student_id,
      topic_title,
      custom_topic = false,
    }: GenerateQuestionsRequest = await req.json();

    // Validate required fields
    if (!student_id || !topic_title) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: student_id and topic_title",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student information
    console.log("📚 Fetching student information...");
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      console.error("❌ Student fetch error:", studentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Student not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Student found:", student.name);

    // Generate personalized questions based on student profile
    console.log("🎯 Generating personalized questions...");
    const questions = await generatePersonalizedQuestions(student, topic_title);

    console.log(`✅ Generated ${questions.length} questions successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        questions: questions,
        message: `Generated ${questions.length} discussion questions for "${topic_title}"`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
