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

// Personalized questions generator using student profile
function generatePersonalizedQuestions(student: Student, topicTitle: string) {
  const nativeLanguage = student.native_language || "your native language";
  const targetLanguage =
    student.target_language === "en" ? "English" : student.target_language;
  const ageGroup = student.age_group || "adult";
  const goals = student.end_goals || "language learning";
  const studentName = student.name;

  // Create highly personalized questions based on student profile
  const personalizedQuestions = [];

  // Personal connection questions (always include)
  personalizedQuestions.push(
    `${studentName}, what interests you most about ${topicTitle}?`,
    `How is ${topicTitle} different in your country compared to ${targetLanguage}-speaking countries?`,
    `What would you tell someone from your ${nativeLanguage}-speaking background about ${topicTitle}?`,
    `${studentName}, share your personal experience with ${topicTitle}.`
  );

  // Goal-oriented questions based on student's specific goals
  if (goals.includes("business") || goals.includes("professional")) {
    personalizedQuestions.push(
      `How could ${topicTitle} impact your professional career?`,
      `What business opportunities do you see related to ${topicTitle}?`,
      `How would you present ${topicTitle} in a professional meeting?`
    );
  } else if (goals.includes("travel") || goals.includes("tourism")) {
    personalizedQuestions.push(
      `How would ${topicTitle} enhance your travel experiences?`,
      `What would you want to know about ${topicTitle} when visiting ${targetLanguage}-speaking countries?`,
      `How would you ask about ${topicTitle} when traveling abroad?`
    );
  } else if (goals.includes("academic") || goals.includes("study")) {
    personalizedQuestions.push(
      `How would you research ${topicTitle} for an academic project?`,
      `What academic questions would you ask about ${topicTitle}?`,
      `How would you explain ${topicTitle} in an academic presentation?`
    );
  } else {
    personalizedQuestions.push(
      `How does understanding ${topicTitle} help you achieve your goal of ${goals}?`,
      `What vocabulary related to ${topicTitle} do you find most challenging in ${targetLanguage}?`,
      `How would discussing ${topicTitle} help you in real-life ${targetLanguage} conversations?`
    );
  }

  // Level-appropriate questions with personalization
  if (student.level === "a1" || student.level === "a2") {
    personalizedQuestions.push(
      `${studentName}, can you name three things related to ${topicTitle}?`,
      `Do you like ${topicTitle}? Please tell me why.`,
      `Is ${topicTitle} popular in your country? Yes or no?`,
      `What do you usually do with ${topicTitle}?`,
      `${studentName}, describe ${topicTitle} in simple words.`,
      `When do you think about ${topicTitle}?`
    );
  } else if (student.level === "b1" || student.level === "b2") {
    personalizedQuestions.push(
      `${studentName}, what are the advantages and disadvantages of ${topicTitle}?`,
      `How has your opinion about ${topicTitle} changed over time?`,
      `What would you recommend to someone new to ${topicTitle}?`,
      `How do you think ${topicTitle} will change in the next 10 years?`,
      `Compare ${topicTitle} in your country with other countries you know.`,
      `What problems might people face with ${topicTitle}?`
    );
  } else {
    personalizedQuestions.push(
      `${studentName}, analyze the cultural significance of ${topicTitle} in different societies.`,
      `What ethical considerations should we keep in mind regarding ${topicTitle}?`,
      `How does ${topicTitle} reflect broader social and economic trends?`,
      `What role should governments play in regulating ${topicTitle}?`,
      `Critically evaluate the impact of ${topicTitle} on modern society.`,
      `What philosophical questions does ${topicTitle} raise?`
    );
  }

  // Grammar-focused questions based on specific weaknesses
  if (student.grammar_weaknesses?.includes("past tense")) {
    personalizedQuestions.push(
      `${studentName}, tell me about a time when ${topicTitle} was important to you.`,
      `How did you first encounter ${topicTitle}?`,
      `What happened the last time you experienced ${topicTitle}?`
    );
  }

  if (student.grammar_weaknesses?.includes("future")) {
    personalizedQuestions.push(
      `What will ${topicTitle} be like in the future?`,
      `${studentName}, how are you going to use ${topicTitle} in your life?`,
      `What do you predict will happen with ${topicTitle} next year?`
    );
  }

  if (student.grammar_weaknesses?.includes("conditionals")) {
    personalizedQuestions.push(
      `If you could change one thing about ${topicTitle}, what would it be?`,
      `What would happen if ${topicTitle} didn't exist?`,
      `${studentName}, if you were an expert on ${topicTitle}, what would you do?`
    );
  }

  // Age-appropriate questions with personalization
  if (ageGroup === "teenager") {
    personalizedQuestions.push(
      `How do young people in your generation view ${topicTitle}?`,
      `${studentName}, what would your friends think about ${topicTitle}?`,
      `How is ${topicTitle} different for teenagers compared to adults?`
    );
  } else if (ageGroup === "senior") {
    personalizedQuestions.push(
      `How has ${topicTitle} evolved since you were younger?`,
      `${studentName}, what wisdom would you share about ${topicTitle}?`,
      `What changes have you seen in ${topicTitle} over the years?`
    );
  } else {
    personalizedQuestions.push(
      `How does ${topicTitle} fit into your professional life?`,
      `What role does ${topicTitle} play in your family?`,
      `${studentName}, how do you balance ${topicTitle} with your other responsibilities?`
    );
  }

  // Conversation fluency barriers - specific practice
  if (student.conversational_fluency_barriers?.includes("confidence")) {
    personalizedQuestions.push(
      `${studentName}, what's one simple thing you could say about ${topicTitle} to start a conversation?`,
      `How would you politely disagree with someone about ${topicTitle}?`,
      `Practice introducing ${topicTitle} to someone who doesn't know about it.`
    );
  }

  if (student.conversational_fluency_barriers?.includes("vocabulary")) {
    personalizedQuestions.push(
      `What are the most important words related to ${topicTitle}?`,
      `${studentName}, explain ${topicTitle} using only simple words.`,
      `What synonyms can you think of for words related to ${topicTitle}?`
    );
  }

  // Learning style adaptations
  if (student.learning_styles?.includes("visual")) {
    personalizedQuestions.push(
      `${studentName}, describe what ${topicTitle} looks like.`,
      `If you could draw ${topicTitle}, what would you include?`
    );
  }

  if (student.learning_styles?.includes("kinesthetic")) {
    personalizedQuestions.push(
      `How do you physically interact with ${topicTitle}?`,
      `${studentName}, what actions are involved in ${topicTitle}?`
    );
  }

  // Pronunciation challenges
  if (student.pronunciation_challenges) {
    personalizedQuestions.push(
      `${studentName}, practice saying words related to ${topicTitle} clearly.`,
      `What sounds in ${topicTitle} vocabulary are difficult for you?`
    );
  }

  // Vocabulary gaps
  if (student.vocabulary_gaps) {
    personalizedQuestions.push(
      `What new words about ${topicTitle} would you like to learn?`,
      `${studentName}, use ${topicTitle} vocabulary in different sentences.`
    );
  }

  // Generic but personalized fallbacks
  personalizedQuestions.push(
    `From your perspective as a ${targetLanguage} learner, what's challenging about discussing ${topicTitle}?`,
    `${studentName}, how would you explain ${topicTitle} to someone who speaks ${nativeLanguage}?`,
    `What questions would you ask a native ${targetLanguage} speaker about ${topicTitle}?`,
    `How does ${topicTitle} help you practice the ${targetLanguage} skills you want to improve?`,
    `${studentName}, what's the most interesting thing about ${topicTitle} for you?`,
    `How would you teach someone else about ${topicTitle}?`
  );

  // Shuffle and select 20 questions for variety
  const shuffled = personalizedQuestions.sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(0, 20);

  return selectedQuestions.map((question, index) => ({
    question_text: question,
    difficulty_level: student.level,
    question_order: index + 1,
  }));
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
    const questions = generatePersonalizedQuestions(student, topic_title);

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
