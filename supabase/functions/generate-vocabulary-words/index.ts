/// <reference lib="deno.ns" />
import { serve } from "jsr:@std/http@0.224.0/server";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenerateVocabularyRequest {
  student_id: string;
  count?: number;
  exclude_words?: string[];
  difficulty?: string;
  focus_areas?: string[];
  specific_words?: string[];
  use_infinite_generation?: boolean;
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

interface VocabularyCardData {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  exampleSentences: {
    present: string;
    past: string;
    future: string;
    presentPerfect: string;
    pastPerfect: string;
    futurePerfect: string;
  };
}

// AI-powered personalized vocabulary generation
async function generateAIPersonalizedVocabulary(
  student: Student,
  count: number,
  excludeWords: string[] = [],
  focusAreas: string[] = []
): Promise<VocabularyCardData[]> {
  const nativeLanguage = student.native_language || "your native language";
  const targetLanguage =
    student.target_language === "en" ? "English" : student.target_language;
  const level = student.level.toUpperCase();
  const goals = student.end_goals || "general language learning";
  const vocabularyGaps = student.vocabulary_gaps || "";
  const conversationalBarriers = student.conversational_fluency_barriers || "";

  // Create AI prompt for personalized vocabulary generation
  const prompt = createVocabularyPrompt(
    student.name,
    level,
    nativeLanguage,
    goals,
    vocabularyGaps,
    conversationalBarriers,
    excludeWords,
    count
  );

  try {
    // Call DeepSeek API via OpenRouter for vocabulary generation
    const aiResponse = await callDeepSeekForVocabulary(prompt);

    if (aiResponse && aiResponse.length > 0) {
      return aiResponse;
    } else {
      throw new Error("AI service returned empty response");
    }
  } catch (error) {
    console.error("AI vocabulary generation failed:", error);
    throw new Error(
      `Failed to generate personalized vocabulary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Create AI prompt for vocabulary generation - OPTIMIZED FOR SPEED
function createVocabularyPrompt(
  studentName: string,
  level: string,
  nativeLanguage: string,
  goals: string,
  vocabularyGaps: string,
  conversationalBarriers: string,
  excludeWords: string[],
  count: number
): string {
  // Ultra-concise prompt for maximum speed
  const excludeList = excludeWords.length > 5 ? excludeWords.slice(0, 5).join(",") : excludeWords.join(",");
  
  return `Generate ${count} ${level}-level English vocabulary JSON array.
Student: ${nativeLanguage} speaker, goals: ${goals.substring(0, 50)}
${excludeList ? `Skip: ${excludeList}` : ''}

JSON only. Format: [{"word":"str","pronunciation":"str","partOfSpeech":"str","definition":"str","exampleSentences":{"present":"str","past":"str","future":"str","presentPerfect":"str","pastPerfect":"str","futurePerfect":"str"}}]`;
}

// Call OpenRouter DeepSeek API for vocabulary generation
async function callDeepSeekForVocabulary(
  prompt: string
): Promise<VocabularyCardData[]> {
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

  if (!openRouterApiKey) {
    console.error("❌ OPENROUTER_API_KEY not found in environment");
    throw new Error("OpenRouter API key not configured");
  }

  console.log("🤖 Calling OpenRouter API with DeepSeek model...");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://linguaflow.online",
        "X-Title": "LinguaFlow Vocabulary Generator",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1",
        messages: [
          {
            role: "system",
            content: "You are a vocabulary generator. Return only valid JSON arrays. Be concise."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5, // Lower temperature for faster, more focused responses
        max_tokens: 3000, // Reduced tokens for faster generation
        top_p: 0.9, // More focused sampling
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText}`
    );
  }

  console.log("✅ OpenRouter API response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ OpenRouter API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("📦 OpenRouter response data keys:", Object.keys(data));
  
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error("❌ No content in response:", JSON.stringify(data, null, 2));
    throw new Error("No content received from DeepSeek");
  }
  
  console.log("✅ Received content from DeepSeek, length:", content.length);

  try {
    // Parse the JSON response with enhanced extraction
    let vocabularyWords;
    
    // Clean the content
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any text before the first [ and after the last ]
    const firstBracket = cleanedContent.indexOf('[');
    const lastBracket = cleanedContent.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanedContent = cleanedContent.substring(firstBracket, lastBracket + 1);
    }
    
    // Try to parse the cleaned JSON
    try {
      vocabularyWords = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log('Parse failed, trying regex extraction...');
      
      // Fallback: extract array with regex
      const arrayMatch = content.match(/\[[\s\S]*?\]/g);
      if (arrayMatch && arrayMatch.length > 0) {
        const largestArray = arrayMatch.reduce((a, b) => a.length > b.length ? a : b);
        vocabularyWords = JSON.parse(largestArray);
      } else {
        throw new Error(`Failed to parse vocabulary response: ${parseError.message}`);
      }
    }

    // Validate the response format
    if (!Array.isArray(vocabularyWords)) {
      throw new Error("Invalid response format: expected array");
    }

    // Validate each word object
    const validWords = vocabularyWords.filter(
      (word) =>
        word.word &&
        word.pronunciation &&
        word.partOfSpeech &&
        word.definition &&
        word.exampleSentences &&
        typeof word.exampleSentences === "object"
    );

    console.log(`Generated ${vocabularyWords.length} words, ${validWords.length} valid`);
    
    return validWords;
  } catch (parseError) {
    console.error("Failed to parse DeepSeek response:", parseError);
    console.error("Raw content:", content);
    throw new Error("Failed to parse AI response");
  }
}

// Parse string arrays from database fields
function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    // Handle JSON array format
    if (value.startsWith("[") && value.endsWith("]")) {
      return JSON.parse(value);
    }
    // Handle comma-separated format
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch (error) {
    // Handle plain text format
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const requestData: GenerateVocabularyRequest = await req.json();
    const {
      student_id,
      count = 20,
      exclude_words = [],
      difficulty,
      focus_areas = [],
      specific_words = [],
      use_infinite_generation = false,
    } = requestData;

    if (!student_id) {
      return new Response(JSON.stringify({ error: "Student ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get student profile
    const { data: student, error: studentError } = await supabaseClient
      .from("students")
      .select("*")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Parse learning styles if they exist
    if (
      student.learning_styles &&
      typeof student.learning_styles === "string"
    ) {
      student.learning_styles = parseStringArray(student.learning_styles);
    }

    // Generate vocabulary using AI only
    try {
      const words = await generateAIPersonalizedVocabulary(
        student,
        count,
        exclude_words,
        focus_areas
      );

      return new Response(JSON.stringify({ words }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (aiError) {
      console.error("AI vocabulary generation failed:", aiError);

      return new Response(
        JSON.stringify({
          error: "Failed to generate vocabulary. Please try again later.",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Vocabulary generation error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
