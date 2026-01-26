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

⚠️ CRITICAL INSTRUCTIONS FOR FILLING THE TEMPLATE:

🚨 MOST IMPORTANT RULE: The "ai_placeholder" field is a LABEL, not a place to put content!
   - NEVER replace or modify the "ai_placeholder" field value
   - ALWAYS create a NEW field with the name specified in "ai_placeholder"
   - The "ai_placeholder" value tells you what field name to create

📚 GRAMMAR EXPLANATION ENHANCEMENT REQUIREMENTS:
For grammar_explanation sections, create comprehensive, structured content with PROPER MARKDOWN FORMATTING:

1. **Clear Formation Rules** - Step-by-step how to construct the grammar
2. **Multiple Example Categories**:
   - Positive/Affirmative examples (3-4 sentences)
   - Negative examples (2-3 sentences) 
   - Question formation examples (2-3 sentences)
3. **Usage Context** - When and why to use this grammar
4. **Common Mistakes** - What learners often get wrong
5. **Comparison with Similar Grammar** (if applicable)
6. **Memory Tips** - Helpful ways to remember the rules
7. **Level-Appropriate Complexity**:
   - A1/A2: Simple rules, basic examples, clear structure
   - B1/B2: More detailed explanations, varied examples, usage contexts
   - C1/C2: Nuanced explanations, complex examples, stylistic considerations

🔥 CRITICAL MARKDOWN FORMATTING REQUIREMENTS:
- ALWAYS use ## for the main grammar topic header
- ALWAYS use ### for ALL subsection headers (Formation Rules, Examples, When to Use, Common Mistakes, Memory Tips, etc.)
- NEVER use plain text for headers - they MUST have markdown syntax
- MANDATORY: Include TWO newline characters (\\n\\n) between ALL sections
- MANDATORY: Each header MUST be on its own line with newlines before and after
- Use **bold** for subcategories within sections
- CRITICAL: Proper spacing is essential for markdown rendering

SPACING EXAMPLE:
## Grammar Focus: Present Perfect Tense

### Formation Rules
Content here...

### Examples
Content here...

### When to Use
Content here...

GRAMMAR EXPLANATION STRUCTURE TEMPLATE:
CRITICAL: Use EXACT markdown formatting with proper line breaks between ALL sections:

## Grammar Focus: [Grammar Topic]

### Formation Rules
[Clear step-by-step formation instructions]

### Examples

**Positive/Affirmative:**
- [Example 1 with context]
- [Example 2 with context]
- [Example 3 with context]

**Negative:**
- [Negative example 1]
- [Negative example 2]

**Questions:**
- [Question example 1]
- [Question example 2]

### When to Use
[Context and usage explanations]

### Common Mistakes
- ❌ [Wrong example] → ✅ [Correct example]
- ❌ [Wrong example] → ✅ [Correct example]

### Memory Tips
[Helpful mnemonics or patterns to remember]

### Comparison with [Similar Grammar]
[If applicable, compare with related grammar points]

CRITICAL SPACING RULES:
- Each ## or ### header MUST have blank lines before and after
- Never concatenate headers together
- Use double newlines (\\n\\n) between sections
- Example: "## Header\\n\\nContent\\n\\n### Subheader\\n\\nMore content"

MANDATORY FORMATTING RULES:
- Use ## for main topic (Grammar Focus: [Topic])
- Use ### for ALL subsections (Formation Rules, Examples, When to Use, etc.)
- Include blank lines between sections
- Use **bold** for subcategories like Positive/Affirmative, Negative, Questions
- Use proper markdown syntax throughout

STEP-BY-STEP PROCESS:
1. Find a section with an "ai_placeholder" field (e.g., "ai_placeholder": "introduction_overview")
2. Note the VALUE of that field (e.g., "introduction_overview")
3. CREATE A NEW FIELD in that same section with that exact name
4. Put your generated content in that NEW field
5. Leave the original "ai_placeholder" field unchanged

CORRECT EXAMPLE:
BEFORE (template):
{
  "id": "introduction_overview",
  "type": "info_card",
  "title": "Introduction/Overview",
  "content_type": "text",
  "ai_placeholder": "introduction_overview",
  "background_color_var": "primary_bg"
}

AFTER (your response):
{
  "id": "introduction_overview",
  "type": "info_card",
  "title": "Introduction/Overview",
  "content_type": "text",
  "ai_placeholder": "introduction_overview",  ← UNCHANGED
  "background_color_var": "primary_bg",
  "introduction_overview": "Welcome, ${student.name}! This lesson is designed to help you..."  ← NEW FIELD ADDED
}

WRONG EXAMPLE (DO NOT DO THIS):
{
  "id": "introduction_overview",
  "type": "info_card",
  "title": "Introduction/Overview",
  "content_type": "text",
  "ai_placeholder": "Welcome, ${student.name}! This lesson...",  ← WRONG! Don't replace this field!
  "background_color_var": "primary_bg"
}

OTHER INSTRUCTIONS:
- Replace placeholder content like "Lesson Title Here" with the actual sub-topic title: "${
      subTopic.title
    }"
- Generate specific, detailed content for each section that matches the student's level and needs
4. For "complete_sentence" content_type (Complete the Sentence exercises), create EXACTLY 8-10 sentence completion items (minimum 8, maximum 10). Each item MUST have:
   {
     "sentence": "A sentence with a blank (use _____)",
     "options": ["option1", "option2", "option3", "option4"],
     "answer": "correct_option"
   }
   Make sure the sentences are contextually relevant to "${subTopic.title}" and appropriate for ${student.level.toUpperCase()} level.

5. For vocabulary_items arrays, create EXACTLY 5-7 relevant vocabulary words (minimum 5, maximum 7). Each vocabulary item MUST have this exact structure with the correct number of examples based on lesson type and student level:
   
   🎯 FOR PRONUNCIATION LESSONS ONLY:
   - Generate EXACTLY 3 example sentences per vocabulary word (ALL LEVELS: A1, A2, B1, B2, C1, C2)
   - Focus on demonstrating the TARGET SOUND in clear, simple contexts
   - Prioritize PRONUNCIATION practice over vocabulary depth
   - Keep examples SHORT and CLEAR for sound repetition practice
   
   📚 FOR ALL OTHER LESSON TYPES:
   - A1/A2 levels: Generate 5 example sentences per vocabulary word
   - B1/B2 levels: Generate 4 example sentences per vocabulary word  
   - C1/C2 levels: Generate 3 example sentences per vocabulary word
   
   
   🚨 CRITICAL: Example Structure Below
   The example structure shows 5 sentences for demonstration. 
   YOU MUST generate the correct number for THIS student's level:
   - Current Student: ${student.name}
   - Student Level: ${student.level.toUpperCase()}
   - Required Examples: ${student.level.toLowerCase().startsWith('a') ? '5 examples per word' : student.level.toLowerCase().startsWith('b') ? '4 examples per word' : '3 examples per word'}
   
   DO NOT copy the example blindly - adjust to match the student's level!
   
   {
     "word": "vocabulary_word",
     "definition": "clear definition appropriate for ${student.level.toUpperCase()} level",
     "part_of_speech": "ACCURATE part of speech (noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection)",
     "examples": [
       "UNIQUE sentence 1 showing REAL-WORLD usage in ${subTopic.title} context",
       "DIFFERENT sentence 2 with VARIED structure and vocabulary in ${subTopic.title} context", 
       "DISTINCT sentence 3 using ALTERNATIVE sentence patterns in ${subTopic.title} context",
       "ORIGINAL sentence 4 with DIVERSE vocabulary and contexts in ${subTopic.title} context",
       "ADDITIONAL sentence 5 with UNIQUE structure and context in ${subTopic.title} context"
     ]
   }
   
   ⚠️ REMEMBER: The example above shows 5 sentences. For ${student.name} (${student.level.toUpperCase()} level), generate ${student.level.toLowerCase().startsWith('a') ? '5' : student.level.toLowerCase().startsWith('b') ? '4' : '3'} examples per word.
   
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
6. For dialogue_lines arrays, create realistic conversations with the following line counts based on student level:
   - A1 level: 4-7 dialogue lines
   - A2 level: 6-8 dialogue lines
   - B1 level: 7-10 dialogue lines
   - B2 level: 9-12 dialogue lines
   - C1/C2 levels: 10-12 dialogue lines
   
   Each dialogue line MUST be an object with "character" and "text" properties:
   Example: [
     {"character": "Teacher", "text": "Hello! How are you today?"},
     {"character": "Student", "text": "I'm fine, thank you. How are you?"},
     {"character": "Teacher", "text": "I'm very well, thanks for asking."}
   ]
   
   Ensure natural conversation flow with appropriate turn-taking between characters.
7. For matching_pairs arrays, create 3-5 question-answer pairs
8. For list items, create 3-5 relevant items
9. For example_sentences arrays, create contextual sentences that directly relate to the lesson topic "${
      subTopic.title
    }" and use vocabulary from the lesson
10. 🎯 PRONUNCIATION TEMPLATE SPECIAL INSTRUCTIONS:
   
   For sections with content_type "vocabulary_matching":
   - Create a field named after the ai_placeholder value (e.g., "word_list_sound1")
   - ALSO create a "vocabulary_items" array DIRECTLY in the section (not nested)
   - Each vocabulary item MUST have: {"word": "example_word", "pronunciation": "/ɪɡˈzæmpəl/", "meaning": "definition", "examples": [...]}
   - Generate 5-8 vocabulary items focusing on the target pronunciation sounds
   - **CRITICAL**: Each vocabulary item MUST include an "examples" array with EXACTLY 3 contextual example sentences
   - The example sentences MUST:
     * Use the actual word in realistic, natural contexts
     * Demonstrate proper pronunciation usage in different sentence structures
     * Be contextually relevant to the word's meaning and usage
     * Show the word in varied grammatical contexts (subject, object, different tenses)
     * Be appropriate for ${student.level.toUpperCase()} level learners
     * Avoid generic or repetitive sentence patterns
   - Make examples relevant to "${subTopic.title}" and appropriate for ${student.level.toUpperCase()} level
   
   Example structure for vocabulary_matching:
   {
     "id": "key_vocabulary_sound1",
     "content_type": "vocabulary_matching",
     "ai_placeholder": "word_list_sound1",
     "word_list_sound1": "Practice these words with Sound 1",
     "vocabulary_items": [
       {
         "word": "ship",
         "pronunciation": "/ʃɪp/",
         "meaning": "a large boat",
         "examples": [
           "The ship sailed across the ocean.",
           "We watched the cruise ship leave the harbor.",
           "My grandfather worked on a cargo ship."
         ]
       },
       {
         "word": "sheep",
         "pronunciation": "/ʃiːp/",
         "meaning": "a farm animal with wool",
         "examples": [
           "The farmer counted his sheep every evening.",
           "Sheep graze peacefully in the green meadow.",
           "We saw hundreds of sheep on the hillside."
         ]
       },
       {
         "word": "shop",
         "pronunciation": "/ʃɒp/",
         "meaning": "a place to buy things",
         "examples": [
           "I need to shop for groceries this afternoon.",
           "The coffee shop opens at 7 AM every day.",
           "She loves to shop for vintage clothing."
         ]
       }
     ]
   }
   
   For sections with content_type "matching":
   - For PRONUNCIATION lessons with id "find_the_sounds", this is a SOUND CATEGORIZATION exercise
   - Create a field named after the ai_placeholder value (e.g., "find_the_sounds")
   - MANDATORY: ALSO create a "sound_words" array DIRECTLY in the section (not nested)
   - Each word object should have: {"word": "example", "sound": "sound1" or "sound2", "pronunciation": "/ɪɡˈzæmpəl/"}
   - Generate 12-15 words total, mixed between sound1 and sound2
   - Students will categorize these words by which sound they contain
   - THIS IS REQUIRED FOR PRONUNCIATION LESSONS - DO NOT SKIP THE sound_words ARRAY
   
   Example structure for pronunciation sound identification:
   {
     "id": "find_the_sounds",
     "content_type": "matching",
     "ai_placeholder": "find_the_sounds",
     "find_the_sounds": "Sort these words based on which sound they contain.",
     "sound_words": [
       {"word": "ship", "sound": "sound1", "pronunciation": "/ʃɪp/"},
       {"word": "sheep", "sound": "sound2", "pronunciation": "/ʃiːp/"},
       {"word": "chip", "sound": "sound1", "pronunciation": "/tʃɪp/"},
       {"word": "cheap", "sound": "sound2", "pronunciation": "/tʃiːp/"},
       {"word": "sit", "sound": "sound1", "pronunciation": "/sɪt/"},
       {"word": "seat", "sound": "sound2", "pronunciation": "/siːt/"},
       {"word": "bit", "sound": "sound1", "pronunciation": "/bɪt/"},
       {"word": "beat", "sound": "sound2", "pronunciation": "/biːt/"},
       {"word": "fit", "sound": "sound1", "pronunciation": "/fɪt/"},
       {"word": "feet", "sound": "sound2", "pronunciation": "/fiːt/"},
       {"word": "hit", "sound": "sound1", "pronunciation": "/hɪt/"},
       {"word": "heat", "sound": "sound2", "pronunciation": "/hiːt/"}
     ]
   }
   
   For OTHER sections with content_type "matching" (not pronunciation):
   - Create matching_questions array with question/answer pairs
   - Each should have: {"question": "question text", "answer": "answer text"}
   
   For sections with id "example_paragraph" (Short Paragraph Practice):
   - This section should contain a SUBSTANTIAL paragraph (8-12 sentences, 120-180 words)
   - The paragraph should tell a coherent story or describe a scenario
   - Include MANY words with the target pronunciation sounds being practiced
   - Make it engaging and contextually relevant to the lesson topic
   - Use natural, flowing language appropriate for the student's level
   - The paragraph should be long enough to provide meaningful reading practice
   - Example length: "Hello! My name is Emma, and I work at a busy hospital in the city center. Every day, I help many patients who come in with various health concerns. After my shift ends at the hospital, I usually go home to my cozy apartment. I have a happy cat named Henry who always greets me at the door. In the evenings, I enjoy cooking healthy meals in my kitchen. On weekends, I like to visit the local market to buy fresh herbs and vegetables. My hobby is playing the harp, which I practice for an hour each day. I hope to perform at a charity event next month to help raise money for the hospital. Music and helping people bring me so much happiness!"

10. Ensure all content is appropriate for ${student.level.toUpperCase()} level ${languageName}
11. Address the student's specific weaknesses and learning goals
12. Focus specifically on the sub-topic: ${subTopic.title}
13. NEVER leave any dialogue_lines empty - always populate both "character" and "text" fields with meaningful content
14. For dialogue_elements in fill_in_the_blanks_dialogue, ensure each dialogue element has proper "character" and "text" fields. CRITICAL: 
   - Each dialogue element with a blank MUST also include a "missing_word" field containing the word that fills the blank
   - Use _____ (5 underscores) to indicate blanks in the text
   - **STRATEGICALLY use vocabulary words from the "Key Vocabulary" section as the missing words** - this reinforces vocabulary learning
   - The blanks should test the student's understanding of the key vocabulary in context
   - Aim for 4-6 blanks total in the dialogue, each using a different vocabulary word from the lesson
   - Example:
   {
     "character": "Teacher",
     "text": "How are you _____ today?",
     "missing_word": "feeling"  // This should be one of the vocabulary words from the Key Vocabulary section
   }
15. IMPORTANT: All example sentences must be contextually relevant to "${
      subTopic.title
    }" and incorporate lesson vocabulary - NO generic sentences
16. Each vocabulary word must have 3-5 example sentences that demonstrate its use in the context of "${
      subTopic.title
    }"

17. 🎯 ENGLISH FOR KIDS B2 SPECIAL INSTRUCTIONS:
    - For "interactive_question_cards" content_type: Create 3-5 engaging questions that activate prior knowledge about "${subTopic.title}". Each question should:
      * Be personalized and relatable to ${student.level.toUpperCase()} level students
      * Include a relevant emoji icon
      * Connect to the student's learning goals: "${student.end_goals}"
      * Address their weaknesses: "${student.grammar_weaknesses || student.vocabulary_gaps}"
      * Spark curiosity about the lesson topic
      * Format: {"question": "...", "icon": "🤔", "purpose": "activate prior knowledge about..."}
    
    - For "engaging_moral_story" content_type: Create a complete, engaging story (200-300 words) that:
      * Uses 80% of the vocabulary words from the Key Vocabulary section
      * Has a clear moral or educational message
      * Is age-appropriate and interesting for B2 level kids
      * Sparks curiosity and encourages reading
      * Includes dialogue and descriptive language
      * Format: {"title": "Story Title", "story": "Complete story text...", "moral": "The lesson learned..."}

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
        "part_of_speech": "noun",
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
        "part_of_speech": "verb",
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
      },
      {
        "word": "word3", 
        "definition": "definition3",
        "part_of_speech": "adjective",
        "examples": [
          "Contextual sentence 1 using word3 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 2 using word3 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 3 using word3 in the context of ${
            subTopic.title
          }"
        ]
      },
      {
        "word": "word4", 
        "definition": "definition4",
        "part_of_speech": "adverb",
        "examples": [
          "Contextual sentence 1 using word4 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 2 using word4 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 3 using word4 in the context of ${
            subTopic.title
          }"
        ]
      },
      {
        "word": "word5", 
        "definition": "definition5",
        "part_of_speech": "noun",
        "examples": [
          "Contextual sentence 1 using word5 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 2 using word5 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 3 using word5 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 4 using word5 in the context of ${
            subTopic.title
          }",
          "Contextual sentence 5 using word5 in the context of ${
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
      }"},
      {"character": "Teacher", "text": "Example dialogue line 3 related to ${
        subTopic.title
      }"},
      {"character": "Student", "text": "Example dialogue line 4 related to ${
        subTopic.title
      }"},
      {"character": "Teacher", "text": "Example dialogue line 5 related to ${
        subTopic.title
      }"},
      {"character": "Student", "text": "Example dialogue line 6 related to ${
        subTopic.title
      }"}
    ],
    "wrap_up": "Summary and key takeaways"
  }
}

CRITICAL INSTRUCTIONS FOR CONTEXTUAL EXAMPLE SENTENCES:

🚨 IMPORTANT: The JSON example above shows 5 example sentences for demonstration.
However, you MUST generate the correct number based on the student's actual level:
- Current Student Level: ${student.level.toUpperCase()}
- Required Examples Per Word: ${student.level.toLowerCase().startsWith('a') ? '5 examples' : student.level.toLowerCase().startsWith('b') ? '4 examples' : '3 examples'}

DO NOT blindly copy the example structure. Adjust the number of examples to match the student's level.

1. Focus specifically on the sub-topic: ${subTopic.title}
2. Make content appropriate for ${student.level.toUpperCase()} level ${languageName}
3. Address the student's specific learning needs: ${
      student.grammar_weaknesses || "general improvement"
    }, ${student.vocabulary_gaps || "general vocabulary"}, ${
      student.conversational_fluency_barriers || "general fluency"
    }
4. Create practical, engaging content that relates directly to ${subTopic.title}
5. Generate EXACTLY 5-7 vocabulary words (minimum 5, maximum 7) - the example above shows 5 words, but you can include up to 7 if appropriate for the topic
6. For vocabulary items, each word MUST have the correct number of example sentences based on student level:
   - A1/A2 levels: Generate 5 example sentences per vocabulary word
   - B1/B2 levels: Generate 4 example sentences per vocabulary word  
   - C1/C2 levels: Generate 3 example sentences per vocabulary word
   
   Each example sentence must:
   - Use the word in the specific context of ${subTopic.title}
   - Be appropriate for ${student.level.toUpperCase()} level
   - Show practical, real-world usage related to the lesson topic
   - Be contextually relevant to the lesson (NOT generic sentences)
7. For dialogue_example arrays, create realistic conversations with the following line counts based on student level:
   - A1 level: 4-7 dialogue lines
   - A2 level: 6-8 dialogue lines
   - B1 level: 7-10 dialogue lines
   - B2 level: 9-12 dialogue lines
   - C1/C2 levels: 10-12 dialogue lines
   Each dialogue line must have "character" and "text" properties with natural conversation flow.
8. For example_sentences arrays, create sentences that:
   - Directly relate to and demonstrate concepts from ${subTopic.title}
   - Incorporate vocabulary words from the lesson
   - Are contextually coherent with the lesson theme
   - Provide meaningful practice for the student's level
9. ALWAYS populate dialogue arrays with objects containing "character" and "text" properties
10. NEVER create generic example sentences - all examples must be contextually relevant to ${
      subTopic.title
    }
11. Ensure all example sentences work together to reinforce the lesson's main concepts
12. Include "part_of_speech" field for each vocabulary word (noun/verb/adjective/adverb/etc.)

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

  // Detect if this is a pronunciation lesson
  const isPronunciationLesson = 
    template?.category === 'Pronunciation' || 
    subTopic?.category === 'Pronunciation';

  if (isPronunciationLesson) {
    console.log("🎯 Pronunciation lesson detected - using 3-example limit for all levels");
  }

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
              // Log warning but DO NOT generate fallback content
              // This indicates an AI generation issue that should be investigated
              console.warn(
                `⚠️ CRITICAL: No examples generated for vocabulary word: ${item.word}`
              );
              console.warn(
                `   This may indicate an AI generation issue. Keeping empty to maintain quality.`
              );
              
              // Initialize empty array to prevent errors
              item.examples = [];
            }

            // Ensure we have the right number of examples based on lesson type and level
            let targetCount;
            
            if (isPronunciationLesson) {
              // Pronunciation lessons: Always 3 examples for all levels
              // This prevents generic fallback sentences and focuses on sound practice
              targetCount = 3;
              console.log(`   📢 Pronunciation lesson: Target count set to 3 examples (regardless of level ${student.level})`);
            } else {
              // Other lesson types: Level-based count
              const levelLower = student.level.toLowerCase();
              targetCount = levelLower.startsWith("a")
                ? 5
                : levelLower.startsWith("b")
                ? 4
                : 3;
              console.log(`   📚 Non-pronunciation lesson: Target count set to ${targetCount} examples for level ${student.level}`);
            }

            if (item.examples.length > targetCount) {
              // Trim excess examples to match target count
              item.examples = item.examples.slice(0, targetCount);
              console.log(
                `   ✂️ Trimmed "${item.word}" examples from ${item.examples.length} to ${targetCount}`
              );
            } else if (item.examples.length < targetCount) {
              // Log warning but DO NOT add fallback content
              // Trust the AI-generated content even if fewer than target
              console.log(
                `   ⚠️ "${item.word}" has ${item.examples.length} examples (target: ${targetCount}) - keeping AI-generated content only`
              );
            } else {
              console.log(
                `   ✅ "${item.word}" has exactly ${targetCount} examples`
              );
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
  console.log(`🔍 Searching for template matching:`, {
    category: subTopic.category,
    level: subTopic.level || 'NOT PROVIDED',
  });

  // If level is missing, log warning but continue
  if (!subTopic.level) {
    console.warn(`⚠️ WARNING: Sub-topic "${subTopic.title}" is missing level field!`);
    console.warn(`   This may cause template matching issues.`);
  }

  // First, try to find a template that matches the sub-topic's level and category exactly
  if (subTopic.level) {
    const exactMatches = templates.filter(
      (t) => t.level === subTopic.level && t.category === subTopic.category
    );

    if (exactMatches.length > 0) {
      console.log(`✅ Found exact match template: ${exactMatches[0].name} (${exactMatches[0].category}, ${exactMatches[0].level})`);
      return exactMatches[0];
    }
  }

  // Try to match by category only (any level)
  const categoryMatches = templates.filter(
    (t) => t.category === subTopic.category
  );

  if (categoryMatches.length > 0) {
    console.log(`✅ Found category match template: ${categoryMatches[0].name} (${categoryMatches[0].category}, ${categoryMatches[0].level})`);
    console.log(`   Note: Using ${categoryMatches[0].level} level template for ${subTopic.level || 'unspecified'} level subtopic`);
    return categoryMatches[0];
  }

  // Try to match by level only (any category)
  if (subTopic.level) {
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
  }

  console.error(
    `❌ No suitable template found for category: "${subTopic.category}", level: "${subTopic.level || 'MISSING'}"`
  );
  console.error(`   Available categories: ${[...new Set(templates.map(t => t.category))].join(', ')}`);
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
    console.log("📊 Sub-topic details:", {
      category: selected_sub_topic.category,
      level: selected_sub_topic.level || 'MISSING',
      hasDescription: !!selected_sub_topic.description
    });

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
      templateName = `${selectedTemplate.name} (${selectedTemplate.category}, ${selectedTemplate.level.toUpperCase()})`;
      console.log("🎯 Using template:", templateName);
    } else {
      console.error("❌ No template selected!");
      console.error(`   Sub-topic: "${selected_sub_topic.title}"`);
      console.error(`   Category: "${selected_sub_topic.category}"`);
      console.error(`   Level: "${selected_sub_topic.level || 'MISSING'}"`);
      console.error(`   Available templates: ${templates.length}`);
      console.error(`   Available categories: ${[...new Set(templates.map(t => t.category))].join(', ')}`);
      
      throw new Error(
        `No matching template found for "${selected_sub_topic.category}" (Level: ${selected_sub_topic.level || 'not specified'}). ` +
        `Please ensure the lesson template exists in the database.`
      );
    }

    // Construct the prompt for AI
    const prompt = constructInteractiveMaterialPrompt(
      student,
      selected_sub_topic,
      selectedTemplate
    );
    console.log("📝 Prompt constructed, length:", prompt.length);

    // Get OpenRouter API key for DeepSeek
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    console.log("🤖 Calling DeepSeek API via OpenRouter...");
    // Call DeepSeek API via OpenRouter
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://linguaflow.online",
          "X-Title": "LinguaFlow",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "You are an expert language tutor creating interactive lesson materials. You must respond ONLY with valid JSON in the exact format requested. CRITICAL: When generating markdown content, use proper line breaks (\\n) between headers and sections. Each header must be on its own line with blank lines before and after. Do not include any explanations or additional text outside the JSON object.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 10000,
        }),
      }
    );

    console.log("📡 DeepSeek API response status:", aiResponse.status);

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error("❌ DeepSeek API error:", errorData);
      throw new Error(`DeepSeek API error: ${errorData}`);
    }

    const aiData = await aiResponse.json();
    console.log("✅ DeepSeek API response received");

    const generatedContent = aiData.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated from DeepSeek");
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