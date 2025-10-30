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
    // Call Gemini API for vocabulary generation
    const aiResponse = await callGeminiForVocabulary(prompt);

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

// Create AI prompt for vocabulary generation
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
  return `Generate ${count} personalized English vocabulary words for ${studentName}, a ${level} level English learner.

Student Profile:
- Native Language: ${nativeLanguage}
- Learning Goals: ${goals}
- Vocabulary Gaps: ${vocabularyGaps}
- Conversational Barriers: ${conversationalBarriers}
- Level: ${level}

Requirements:
1. Generate words appropriate for ${level} level
2. Focus on words that help with their learning goals: ${goals}
3. Address vocabulary gaps: ${vocabularyGaps}
4. Avoid these words: ${excludeWords.join(", ")}
5. Make words relevant to their conversational barriers: ${conversationalBarriers}

For each word, provide:
- word: the English word
- pronunciation: IPA phonetic notation
- partOfSpeech: noun, verb, adjective, adverb, etc.
- definition: clear, level-appropriate definition
- exampleSentences: 6 natural, contextually relevant example sentences that relate to the student's learning goals and real-life situations they might encounter. Use different tenses (present, past, future, present perfect, past perfect, future perfect). Create scenarios that connect to their goals (${goals}) and address their conversational barriers (${conversationalBarriers}). Use the student's name sparingly - only in 1-2 sentences when it feels natural and personal

Return ONLY a valid JSON array of vocabulary objects. No additional text or explanation.

Example format:
[
  {
    "word": "opportunity",
    "pronunciation": "/ˌɑːpərˈtuːnəti/",
    "partOfSpeech": "noun",
    "definition": "A chance to do something good or beneficial",
    "exampleSentences": {
      "present": "Every job interview presents a new **opportunity** to showcase your skills.",
      "past": "She recognized the **opportunity** and applied for the scholarship immediately.",
      "future": "This internship will provide valuable **opportunity** for career growth.",
      "presentPerfect": "Many students have found **opportunity** through networking events.",
      "pastPerfect": "He had missed several **opportunity** before learning to be more proactive.",
      "futurePerfect": "By graduation, ${studentName} will have explored every **opportunity** available."
    }
  }
]`;
}

// Call Gemini API for vocabulary generation
async function callGeminiForVocabulary(
  prompt: string
): Promise<VocabularyCardData[]> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert English language teacher who creates personalized vocabulary lessons. Always respond with valid JSON only.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content received from Gemini");
  }

  try {
    // Parse the JSON response
    const vocabularyWords = JSON.parse(content);

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
    console.error("Failed to parse Gemini response:", parseError);
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
