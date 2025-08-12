import { serve } from "jsr:@std/http@0.224.0/server";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ru: "Russian",
  pt: "Portuguese",
};

function constructInteractiveMaterialPrompt(
  student: Student,
  subTopic: any,
  template: LessonTemplate | null
): string {
  const languageName =
    languageMap[student.target_language] || student.target_language;

  if (template) {
    // Use template-based prompt with hyper-personalization
    return `You are an expert ${languageName} tutor creating hyper-personalized interactive lesson materials for ${student.name}. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

CRITICAL INSTRUCTIONS:
1. Generate ALL lesson content in ${languageName} (target language)
2. Make this lesson feel like it was created specifically for ${student.name}
3. Address their specific weaknesses and learning goals
4. Use cultural references relevant to someone from ${student.native_language || 'their background'}
5. Adapt content to their exact proficiency level: ${student.level.toUpperCase()}

STUDENT PROFILE:
- Name: ${student.name}
- Target Language: ${languageName}
- Proficiency Level: ${student.level.toUpperCase()}
- Native Language: ${student.native_language || "Not specified"}
- End Goals: ${student.end_goals || "General language improvement"}
- Grammar Weaknesses: ${student.grammar_weaknesses || "None specified"}
- Vocabulary Gaps: ${student.vocabulary_gaps || "None specified"}
- Pronunciation Challenges: ${
      student.pronunciation_challenges || "None specified"
    }
- Conversational Fluency Barriers: ${
      student.conversational_fluency_barriers || "None specified"
    }
- Learning Styles: ${student.learning_styles?.join(", ") || "Not specified"}
- Additional Notes: ${student.notes || "None"}

PERSONALIZATION REQUIREMENTS:
1. Use ${student.name}'s name throughout the lesson
2. Reference their specific goals: "${student.end_goals}"
3. Address their weaknesses: "${student.grammar_weaknesses}"
4. Include examples relevant to their native language (${student.native_language}) background
5. Create content that feels personally crafted for ${student.name}

Sub-Topic to Focus On:
- Title: ${subTopic.title}
- Category: ${subTopic.category}
- Level: ${subTopic.level}
- Description: ${subTopic.description || "No description provided"}
- Category: ${subTopic.category}
- Level: ${subTopic.level}
- Description: ${subTopic.description || "No description provided"}

Template Structure to Fill:
${JSON.stringify(template.template_json, null, 2)}

CRITICAL INSTRUCTIONS:
1. You must fill ALL "ai_placeholder" fields in the template with appropriate content based on the student profile and sub-topic
2. Replace placeholder content like "Lesson Title Here" with the actual sub-topic title: "${
      subTopic.title
    }"
3. Generate specific, detailed content for each section that matches the student's level and needs
4. For vocabulary_items arrays, create 4-6 relevant vocabulary words. Each vocabulary item MUST have this exact structure with the correct number of examples based on student level:
   - A1/A2 levels: Generate 5 example sentences per vocabulary word
   - B1/B2 levels: Generate 4 example sentences per vocabulary word  
   - C1/C2 levels: Generate 3 example sentences per vocabulary word
   
   {
     "word": "vocabulary_word",
     "definition": "clear definition appropriate for ${student.level.toUpperCase()} level",
     "part_of_speech": "ACCURATE part of speech (noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection)",
     "examples": [
       "UNIQUE sentence 1 showing REAL-WORLD usage in ${
         subTopic.title
       } context",
       "DIFFERENT sentence 2 with VARIED structure and vocabulary in ${
         subTopic.title
       } context", 
       "DISTINCT sentence 3 using ALTERNATIVE sentence patterns in ${
         subTopic.title
       } context"${
      student.level.toLowerCase().startsWith("a")
        ? ',\n       "ORIGINAL sentence 4 with DIVERSE vocabulary and contexts in ${subTopic.title} context",\n       "ADDITIONAL sentence 5 with UNIQUE structure and context in ${subTopic.title} context"'
        : student.level.toLowerCase().startsWith("b")
        ? ',\n       "ORIGINAL sentence 4 with DIVERSE vocabulary and contexts in ${subTopic.title} context"'
        : ""
    }
     ]
   }
   
   PART OF SPEECH ACCURACY RULES:
   - Analyze the word's actual grammatical function, not just its ending
   - "Extended family" = NOUN (it's a thing/concept)
   - "Cohabitate" = VERB (it's an action)
   - "Nuclear family" = NOUN (it's a type of family structure)
   - "Sibling rivalry" = NOUN (it's a phenomenon/concept)
   - "Relationship status" = NOUN (it's a state/condition)
   
   EXAMPLE DIVERSITY REQUIREMENTS:
   - Use DIFFERENT sentence structures (simple, compound, complex)
   - Include VARIED contexts (formal, informal, personal, professional)
   - Show MULTIPLE uses (as subject, object, in phrases, with modifiers)
   - Avoid REPETITIVE patterns or templates
   - Create REALISTIC, natural-sounding sentences
   
   GRAMMATICAL CORRECTNESS:
   - NOUNS: Use with appropriate articles (a/an/the), show singular/plural forms
   - VERBS: Show different tenses and conjugations (I walk, she walks, they walked, will walk)
   - ADJECTIVES: Use to modify nouns (the happy child, a difficult situation)
   - ADVERBS: Use to modify verbs, adjectives, or other adverbs (speaks quickly, very important)
5. For dialogue_lines arrays, create realistic conversations appropriate for the level. Each dialogue line MUST be an object with "character" and "text" properties:
   Example: [
     {"character": "Teacher", "text": "Hello! How are you today?"},
     {"character": "Student", "text": "I'm fine, thank you. How are you?"},
     {"character": "Teacher", "text": "I'm very well, thanks for asking."}
   ]
6. For matching_pairs arrays, create 3-5 question-answer pairs
7. For list items, create 3-5 relevant items
8. For example_sentences arrays, create contextual sentences that directly relate to the lesson topic "${
      subTopic.title
    }" and use vocabulary from the lesson
9. Ensure all content is appropriate for ${student.level.toUpperCase()} level ${languageName}
10. Address the student's specific weaknesses and learning goals
11. Focus specifically on the sub-topic: ${subTopic.title}
12. NEVER leave any dialogue_lines empty - always populate both "character" and "text" fields with meaningful content
13. For dialogue_elements in fill_in_the_blanks_dialogue, ensure each dialogue element has proper "character" and "text" fields
14. IMPORTANT: All example sentences must be contextually relevant to "${
      subTopic.title
    }" and incorporate lesson vocabulary - NO generic sentences
15. Each vocabulary word must have 3-5 example sentences that demonstrate its use in the context of "${
      subTopic.title
    }"

RESPOND ONLY WITH THE FILLED TEMPLATE JSON - NO OTHER TEXT.`;
  } else {
    // Use basic prompt for fallback
    return `You are an expert language tutor creating basic interactive lesson content. You must respond ONLY with valid JSON - no explanations, no additional text, no markdown formatting.

Student Profile:
- Name: ${student.name}
- Target Language: ${languageName}
- Proficiency Level: ${student.level.toUpperCase()}
- End Goals: ${student.end_goals || "General language improvement"}
- Grammar Weaknesses: ${student.grammar_weaknesses || "None specified"}
- Vocabulary Gaps: ${student.vocabulary_gaps || "None specified"}
- Pronunciation Challenges: ${
      student.pronunciation_challenges || "None specified"
    }
- Conversational Fluency Barriers: ${
      student.conversational_fluency_barriers || "None specified"
    }
- Learning Styles: ${student.learning_styles?.join(", ") || "Not specified"}
- Additional Notes: ${student.notes || "None"}

Sub-Topic to Focus On:
- Title: ${subTopic.title}
- Category: ${subTopic.category}
- Level: ${subTopic.level}
- Description: ${subTopic.description || "No description provided"}

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
      {
        "word": "word1", 
        "definition": "definition1",
        "examples": [
          "Contextual sentence 1 using word1 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 2 using word1 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 3 using word1 in the context of ${
            subTopic.title
          }"
        ]
      },
      {
        "word": "word2", 
        "definition": "definition2",
        "examples": [
          "Contextual sentence 1 using word2 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 2 using word2 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 3 using word2 in the context of ${
            subTopic.title
          }"
        ]
      }
    ],
    "example_sentences": [
      "Sentence 1 that directly relates to ${
        subTopic.title
      } and uses lesson vocabulary",
      "Sentence 2 that directly relates to ${
        subTopic.title
      } and uses lesson vocabulary",
      "Sentence 3 that directly relates to ${
        subTopic.title
      } and uses lesson vocabulary"
    ],
    "dialogue_example": [
      {"character": "Teacher", "text": "Example dialogue line 1 related to ${
        subTopic.title
      }"},
      {"character": "Student", "text": "Example dialogue line 2 related to ${
        subTopic.title
      }"}
    ],
    "wrap_up": "Summary and key takeaways"
  }
}

CRITICAL INSTRUCTIONS FOR CONTEXTUAL EXAMPLE SENTENCES:
1. Focus specifically on the sub-topic: ${subTopic.title}
2. Make content appropriate for ${student.level.toUpperCase()} level ${languageName}
3. Address the student's specific learning needs: ${
      student.grammar_weaknesses || "general improvement"
    }, ${student.vocabulary_gaps || "general vocabulary"}, ${
      student.conversational_fluency_barriers || "general fluency"
    }
4. Create practical, engaging content that relates directly to ${subTopic.title}
5. For vocabulary items, each word MUST have the correct number of example sentences based on student level:
   - A1/A2 levels: Generate 5 example sentences per vocabulary word
   - B1/B2 levels: Generate 4 example sentences per vocabulary word  
   - C1/C2 levels: Generate 3 example sentences per vocabulary word
   
   Each example sentence must:
   - Use the word in the specific context of ${subTopic.title}
   - Be appropriate for ${student.level.toUpperCase()} level
   - Show practical, real-world usage related to the lesson topic
   - Be contextually relevant to the lesson (NOT generic sentences)
6. For example_sentences arrays, create sentences that:
   - Directly relate to and demonstrate concepts from ${subTopic.title}
   - Incorporate vocabulary words from the lesson
   - Are contextually coherent with the lesson theme
   - Provide meaningful practice for the student's level
7. ALWAYS populate dialogue arrays with objects containing "character" and "text" properties
8. NEVER create generic example sentences - all examples must be contextually relevant to ${
      subTopic.title
    }
9. Ensure all example sentences work together to reinforce the lesson's main concepts

RESPOND ONLY WITH THE JSON OBJECT - NO OTHER TEXT.`;
  }
}

function cleanJsonResponse(content: string): string {
  // Remove any markdown code block formatting
  let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // Remove trailing commas before closing brackets/braces (common AI mistake)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Remove any text before the first { or after the last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function validateAndFixJson(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.log("🔧 Initial JSON parse failed, attempting fixes...");

    // Try more aggressive cleaning
    let fixed = jsonString
      // Remove any control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
      // Fix common quote issues
      .replace(/'/g, '"')
      // Fix trailing commas more aggressively
      .replace(/,(\s*[}\]])/g, "$1")
      // Fix missing commas between array elements
      .replace(/}(\s*){/g, "},$1{")
      .replace(/](\s*)\[/g, "],$1[");

    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log("🔧 Second attempt failed");
      throw new Error(
        `Unable to parse JSON after multiple attempts. Original: ${jsonString.substring(
          0,
          200
        )}...`
      );
    }
  }
}

function validateAndEnsureExamples(
  template: any,
  subTopic: any,
  student: Student
): any {
  console.log("🔍 Validating and ensuring vocabulary examples...");

  // Helper function to generate diverse, word-specific contextual examples
  const generateContextualExamples = (
    word: string,
    definition: string,
    partOfSpeech: string
  ): string[] => {
    const examples = [];
    const level = student.level.toLowerCase();
    const wordLower = word.toLowerCase();
    const pos = partOfSpeech.toLowerCase();

    // Word-specific examples for common vocabulary (prevents repetition)
    if (wordLower === "extended family") {
      examples.push(
        `My extended family includes grandparents, aunts, uncles, and cousins.`,
        `We have a large extended family reunion every summer.`,
        `Extended family members often provide support during difficult times.`,
        `Children benefit from close relationships with their extended family.`
      );
    } else if (wordLower === "nuclear family") {
      examples.push(
        `A nuclear family typically consists of parents and their children.`,
        `The nuclear family is the most common family structure in many countries.`,
        `Our nuclear family includes mom, dad, and two children.`,
        `Nuclear family dynamics can vary greatly between cultures.`
      );
    } else if (wordLower === "sibling rivalry") {
      examples.push(
        `Sibling rivalry is common between brothers and sisters.`,
        `Parents should address sibling rivalry with patience and fairness.`,
        `Healthy competition can reduce sibling rivalry over time.`,
        `Sibling rivalry often decreases as children grow older.`
      );
    } else if (wordLower === "relationship status") {
      examples.push(
        `Social media profiles often display your relationship status.`,
        `Her relationship status changed from single to married.`,
        `Some people prefer to keep their relationship status private.`,
        `Relationship status can affect tax filing and insurance benefits.`
      );
    } else if (wordLower === "cohabitate") {
      examples.push(
        `Many couples choose to cohabitate before getting married.`,
        `They decided to cohabitate after dating for two years.`,
        `Some people cohabitate to test their compatibility.`,
        `Legal rights differ for couples who cohabitate versus marry.`
      );
    } else if (wordLower === "in-laws") {
      examples.push(
        `My in-laws are very welcoming and kind people.`,
        `Building good relationships with in-laws takes time and effort.`,
        `We visit my in-laws every holiday season.`,
        `Some couples struggle with in-laws who are too involved.`
      );
    }
    // Generate diverse examples based on part of speech
    else if (pos.includes("noun")) {
      examples.push(
        `The ${word} is an important concept in family relationships.`,
        `Understanding different types of ${word} helps with communication.`,
        `Every ${word} has its own unique characteristics and challenges.`,
        `A healthy ${word} requires mutual respect and understanding.`
      );
    } else if (pos.includes("verb")) {
      examples.push(
        `Many people ${word} to strengthen their relationships.`,
        `She ${word}s naturally in social situations.`,
        `We should ${word} with respect and consideration.`,
        `They ${word}ed successfully after years of practice.`
      );
    } else if (pos.includes("adjective")) {
      examples.push(
        `The relationship was very ${word} and supportive.`,
        `A ${word} approach works better in family situations.`,
        `This method is ${word} for building strong connections.`,
        `The ${word} nature of the interaction impressed everyone.`
      );
    } else {
      // Generic fallback with variety
      examples.push(
        `The concept of "${word}" is important in family dynamics.`,
        `Understanding "${word}" helps improve relationships.`,
        `People often discuss "${word}" in social contexts.`,
        `Learning about "${word}" enhances communication skills.`
      );
    }

    return examples;
  };

  // Recursively process the template to find and validate vocabulary items
  const processObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(processObject);
    } else if (obj && typeof obj === "object") {
      const processed: any = {};

      for (const [key, value] of Object.entries(obj)) {
        if (key === "vocabulary_items" && Array.isArray(value)) {
          // Process vocabulary items to ensure they have examples
          processed[key] = value.map((item: any) => {
            if (
              !item.examples ||
              !Array.isArray(item.examples) ||
              item.examples.length === 0
            ) {
              console.log(
                `⚠️ Missing examples for vocabulary word: ${item.word}, generating contextual examples...`
              );

              const word = item.word || "word";
              const definition = item.definition || "definition";
              const partOfSpeech = item.part_of_speech || "noun";

              item.examples = generateContextualExamples(
                word,
                definition,
                partOfSpeech
              );
            }

            // Ensure we have the right number of examples based on level
            const levelLower = student.level.toLowerCase();
            const targetCount = levelLower.startsWith("a")
              ? 5
              : levelLower.startsWith("b")
              ? 4
              : 3;

            if (item.examples.length > targetCount) {
              item.examples = item.examples.slice(0, targetCount);
            } else if (item.examples.length < targetCount) {
              // Add more examples if needed
              const word = item.word || "word";
              const definition = item.definition || "definition";
              const partOfSpeech = item.part_of_speech || "noun";
              const additionalExamples = generateContextualExamples(
                word,
                definition,
                partOfSpeech
              );

              while (
                item.examples.length < targetCount &&
                additionalExamples.length > 0
              ) {
                const newExample = additionalExamples.pop();
                if (newExample && !item.examples.includes(newExample)) {
                  item.examples.push(newExample);
                }
              }
            }

            return item;
          });
        } else if (
          key === "sentences" &&
          Array.isArray(value) &&
          value.length === 0
        ) {
          // Generate example sentences if missing
          console.log(
            `⚠️ Missing example sentences, generating contextual sentences...`
          );
          processed[key] = [
            `This example demonstrates key concepts from ${subTopic.title}.`,
            `Students practice ${subTopic.title} through structured exercises.`,
            `Understanding ${subTopic.title} improves overall language proficiency.`,
          ];
        } else {
          processed[key] = processObject(value);
        }
      }

      return processed;
    }

    return obj;
  };

  const validatedTemplate = processObject(template);
  console.log("✅ Vocabulary examples validation completed");
  return validatedTemplate;
}

function selectAppropriateTemplate(
  subTopic: any,
  templates: LessonTemplate[]
): LessonTemplate | null {
  // First, try to find a template that matches the sub-topic's level and category exactly
  const exactMatches = templates.filter(
    (t) => t.level === subTopic.level && t.category === subTopic.category
  );

  if (exactMatches.length > 0) {
    console.log(`✅ Found exact match template: ${exactMatches[0].name}`);
    return exactMatches[0];
  }

  // Try to match by category only (any level)
  const categoryMatches = templates.filter(
    (t) => t.category === subTopic.category
  );

  if (categoryMatches.length > 0) {
    console.log(`✅ Found category match template: ${categoryMatches[0].name}`);
    return categoryMatches[0];
  }

  // Try to match by level only (any category)
  const levelMatches = templates.filter((t) => t.level === subTopic.level);

  if (levelMatches.length > 0) {
    // Prefer Conversation templates as they're most generic
    const conversationTemplate = levelMatches.find(
      (t) => t.category === "Conversation"
    );
    if (conversationTemplate) {
      console.log(
        `✅ Using Conversation template for level ${subTopic.level}: ${conversationTemplate.name}`
      );
      return conversationTemplate;
    }

    console.log(
      `✅ Using first available template for level ${subTopic.level}: ${levelMatches[0].name}`
    );
    return levelMatches[0];
  }

  console.log(
    `⚠️ No suitable template found for category: ${subTopic.category}, level: ${subTopic.level}`
  );
  return null;
}

serve(async (req) => {
  console.log(
    "🚀 Generate Interactive Material function called:",
    req.method,
    req.url
  );

  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔧 Creating Supabase client...");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🔐 Checking authorization...");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      throw new Error("Invalid token");
    }

    console.log("✅ User authenticated:", user.id);

    console.log("📦 Parsing request body...");
    const {
      lesson_id,
      selected_sub_topic,
    }: GenerateInteractiveMaterialRequest = await req.json();

    if (!lesson_id || !selected_sub_topic) {
      throw new Error("lesson_id and selected_sub_topic are required");
    }

    console.log("🔍 Fetching lesson details for ID:", lesson_id);

    // Fetch lesson with student details
    const { data: lessonData, error: lessonError } = await supabaseClient
      .from("lessons")
      .select(
        `
        *,
        student:students(*)
      `
      )
      .eq("id", lesson_id)
      .eq("tutor_id", user.id)
      .single();

    if (lessonError || !lessonData) {
      console.error("❌ Lesson fetch error:", lessonError);
      throw new Error("Lesson not found or access denied");
    }

    const lesson = lessonData as Lesson;
    const student = lesson.student as Student;

    console.log("✅ Lesson found:", lesson.id, "for student:", student.name);
    console.log("🎯 Selected sub-topic:", selected_sub_topic.title);

    // Fetch available lesson templates
    console.log("🎯 Fetching lesson templates...");
    const { data: templatesData, error: templatesError } = await supabaseClient
      .from("lesson_templates")
      .select("*")
      .eq("is_active", true);

    if (templatesError) {
      console.error("❌ Templates fetch error:", templatesError);
      throw new Error("Failed to fetch lesson templates");
    }

    const templates = templatesData as LessonTemplate[];
    console.log(`✅ Found ${templates.length} active templates`);

    // Select the most appropriate template
    const selectedTemplate = selectAppropriateTemplate(
      selected_sub_topic,
      templates
    );

    let templateName = "Basic Interactive Lesson";
    if (selectedTemplate) {
      templateName = selectedTemplate.name;
      console.log("🎯 Using template:", selectedTemplate.name);
    } else {
      console.log(
        "🎯 No specific template found, using basic interactive format"
      );
    }

    // Construct the prompt for AI
    const prompt = constructInteractiveMaterialPrompt(
      student,
      selected_sub_topic,
      selectedTemplate
    );
    console.log("📝 Prompt constructed, length:", prompt.length);

    // Get Gemini API key
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    console.log("🤖 Calling Gemini API...");
    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${geminiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.0-flash-exp",
          messages: [
            {
              role: "system",
              content:
                "You are an expert language tutor creating interactive lesson materials. You must respond ONLY with valid JSON in the exact format requested. Do not include any explanations, markdown formatting, or additional text outside the JSON object.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      }
    );

    console.log("📡 Gemini API response status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("❌ Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${errorData}`);
    }

    const geminiData = await geminiResponse.json();
    console.log("✅ Gemini API response received");

    const generatedContent = geminiData.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated from Gemini");
    }

    console.log("📄 Raw generated content length:", generatedContent.length);

    // Clean and parse the JSON response
    const cleanedContent = cleanJsonResponse(generatedContent);
    console.log("🧹 Cleaned content length:", cleanedContent.length);

    let filledTemplate;
    try {
      filledTemplate = validateAndFixJson(cleanedContent);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      throw new Error("Failed to parse AI-generated interactive material");
    }

    console.log("✅ Interactive material parsed successfully");

    // Validate and ensure all vocabulary items have examples
    filledTemplate = validateAndEnsureExamples(
      filledTemplate,
      selected_sub_topic,
      student
    );
    console.log("✅ Vocabulary examples validated and ensured");

    // Update the lesson with the interactive content
    console.log("💾 Updating lesson with interactive content...");
    const { data: updatedLesson, error: updateError } = await supabaseClient
      .from("lessons")
      .update({
        interactive_lesson_content: {
          ...filledTemplate,
          selected_sub_topic: selected_sub_topic,
          created_at: new Date().toISOString(),
        },
        lesson_template_id: selectedTemplate?.id || null,
      })
      .eq("id", lesson_id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      throw new Error(`Failed to update lesson: ${updateError.message}`);
    }

    console.log("✅ Lesson updated successfully with interactive content");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Interactive lesson material generated successfully",
        lesson_id: updatedLesson.id,
        lesson_template_id: selectedTemplate?.id || null,
        template_name: templateName,
        sub_topic: selected_sub_topic,
        interactive_content: filledTemplate,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Generate interactive material error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
