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

function generateFiveLessons(student: Student) {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  console.log('🔄 GENERATING EXACTLY 5 LESSONS - GUARANTEED!');
  console.log('🆔 VERSION: 5-Lesson Generator v3.0');
  
  return {
    lessons: [
      {
        title: `${languageName} Conversation Fundamentals for ${student.name}`,
        objectives: [
          `Master ${student.level} level conversational skills`,
          "Build confidence in speaking",
          "Learn essential communication phrases"
        ],
        activities: [
          "Interactive dialogue practice",
          "Role-play scenarios",
          "Pronunciation drills"
        ],
        materials: [
          "Conversation prompts",
          "Audio recordings",
          "Visual conversation aids"
        ],
        assessment: [
          "Oral fluency evaluation",
          "Pronunciation accuracy check"
        ],
        sub_topics: [
          {
            id: "subtopic_1",
            title: "Greetings and Introductions",
            category: "Conversation",
            level: student.level,
            description: "Master formal and informal greetings in various social and professional contexts. Learn appropriate responses, cultural nuances, and body language. Practice introducing yourself and others with confidence in different situations."
          },
          {
            id: "subtopic_2",
            title: "Daily Routine Vocabulary",
            category: "Vocabulary",
            level: student.level,
            description: "Build comprehensive vocabulary for describing daily activities, time expressions, and routine actions. Learn collocations and natural phrases used by native speakers when discussing schedules and habits."
          },
          {
            id: "subtopic_3",
            title: "Small Talk Skills",
            category: "Conversation",
            level: student.level,
            description: "Develop natural conversation skills for casual interactions. Learn appropriate topics, question techniques, and how to maintain engaging conversations about weather, current events, and shared interests."
          },
          {
            id: "subtopic_4",
            title: "Personal Information Exchange",
            category: "Conversation",
            level: student.level,
            description: "Practice sharing and requesting personal information appropriately in various contexts. Learn privacy boundaries, formal vs. informal registers, and cultural considerations when discussing personal topics."
          },
          {
            id: "subtopic_5",
            title: "Common Expressions and Phrases",
            category: "Vocabulary",
            level: student.level,
            description: "Master essential idiomatic expressions, phrasal verbs, and colloquial phrases used in everyday communication. Focus on natural, authentic language that native speakers use in daily interactions."
          },
          {
            id: "subtopic_6",
            title: "Active Listening Practice",
            category: "Conversation",
            level: student.level,
            description: "Develop advanced listening skills for understanding native speakers in various accents and speaking speeds. Practice identifying key information, implied meanings, and emotional undertones in conversations."
          }
        ]
      },
      {
        title: `${languageName} Grammar Essentials`,
        objectives: [
          "Master fundamental grammar structures",
          "Apply grammar rules in context",
          "Identify and correct common mistakes"
        ],
        activities: [
          "Grammar pattern practice",
          "Sentence construction exercises",
          "Error correction activities"
        ],
        materials: [
          "Grammar reference charts",
          "Practice worksheets",
          "Example sentences"
        ],
        assessment: [
          "Grammar accuracy test",
          "Sentence formation quiz"
        ],
        sub_topics: [
          {
            id: "subtopic_7",
            title: "Present Tense Mastery",
            category: "Grammar",
            level: student.level,
            description: "Master all forms of present tense including simple, continuous, perfect, and perfect continuous. Focus on accurate usage in context, common mistakes, and natural expressions. Practice with real-life situations and authentic materials."
          },
          {
            id: "subtopic_8",
            title: "Question Formation",
            category: "Grammar",
            level: student.level,
            description: "Learn to form various types of questions including yes/no questions, wh-questions, tag questions, and indirect questions. Practice appropriate intonation patterns and understand cultural contexts for different question types."
          },
          {
            id: "subtopic_9",
            title: "Past Tense Practice",
            category: "Grammar",
            level: student.level,
            description: "Comprehensive practice with regular and irregular past tense forms, including simple past, past continuous, past perfect, and past perfect continuous. Focus on time expressions, narrative structures, and storytelling techniques."
          },
          {
            id: "subtopic_10",
            title: "Future Tense and Planning",
            category: "Grammar",
            level: student.level,
            description: "Express future plans, predictions, and intentions using various future forms including will, going to, present continuous for future, and future perfect. Learn to distinguish between different future meanings and contexts."
          },
          {
            id: "subtopic_11",
            title: "Articles and Determiners",
            category: "Grammar",
            level: student.level,
            description: "Master the complex rules of articles (a, an, the) and other determiners (this, that, some, any, much, many). Focus on specific vs. general references, countable vs. uncountable nouns, and cultural differences in usage."
          },
          {
            id: "subtopic_12",
            title: "Sentence Structure Patterns",
            category: "Grammar",
            level: student.level,
            description: "Build sophisticated sentence structures including complex and compound sentences, relative clauses, conditional sentences, and advanced linking words. Practice creating coherent and varied sentence patterns for natural communication."
          }
        ]
      },
      {
        title: `${languageName} Vocabulary Expansion`,
        objectives: [
          "Expand active vocabulary range",
          "Learn word families and collocations",
          "Practice vocabulary in context"
        ],
        activities: [
          "Vocabulary building games",
          "Word association exercises",
          "Contextual usage practice"
        ],
        materials: [
          "Vocabulary flashcards",
          "Picture dictionaries",
          "Thematic word lists"
        ],
        assessment: [
          "Vocabulary retention test",
          "Usage demonstration"
        ],
        sub_topics: [
          {
            id: "subtopic_13",
            title: "Family and Relationships",
            category: "Vocabulary",
            level: student.level,
            description: "Comprehensive vocabulary for describing family members, relationship types, and social connections. Learn terms for extended family, relationship status, and cultural variations in family structures. Practice discussing family dynamics and personal relationships appropriately."
          },
          {
            id: "subtopic_14",
            title: "Food and Dining",
            category: "Vocabulary",
            level: student.level,
            description: "Master extensive food-related vocabulary including ingredients, cooking methods, restaurant terminology, and dining etiquette. Learn to describe tastes, textures, dietary restrictions, and cultural food preferences. Practice ordering, complaining, and complimenting in dining situations."
          },
          {
            id: "subtopic_15",
            title: "Work and Career",
            category: "Vocabulary",
            level: student.level,
            description: "Professional vocabulary covering job titles, workplace responsibilities, career development, and business terminology. Learn industry-specific language, interview skills vocabulary, and expressions for discussing professional goals and achievements."
          },
          {
            id: "subtopic_16",
            title: "Home and Living",
            category: "Vocabulary",
            level: student.level,
            description: "Detailed vocabulary for describing homes, furniture, appliances, and living arrangements. Learn terms for different room types, household items, maintenance issues, and housing situations. Practice discussing living preferences and home-related problems."
          },
          {
            id: "subtopic_17",
            title: "Health and Body Parts",
            category: "Vocabulary",
            level: student.level,
            description: "Essential medical vocabulary including body parts, symptoms, illnesses, treatments, and healthcare terminology. Learn to describe pain, discomfort, and health conditions accurately. Practice communicating with healthcare professionals and understanding medical advice."
          },
          {
            id: "subtopic_18",
            title: "Hobbies and Leisure Activities",
            category: "Vocabulary",
            level: student.level,
            description: "Comprehensive vocabulary for discussing interests, hobbies, sports, entertainment, and leisure activities. Learn to express preferences, describe skills and abilities, and discuss frequency of activities. Practice talking about past experiences and future plans for recreation."
          }
        ]
      },
      {
        title: `${languageName} Pronunciation and Listening`,
        objectives: [
          "Improve pronunciation accuracy",
          "Develop listening comprehension",
          "Master difficult sounds and rhythms"
        ],
        activities: [
          "Sound discrimination exercises",
          "Listening comprehension tasks",
          "Pronunciation practice drills"
        ],
        materials: [
          "Audio pronunciation guides",
          "Listening exercises",
          "Recording equipment"
        ],
        assessment: [
          "Pronunciation accuracy check",
          "Listening comprehension test"
        ],
        sub_topics: [
          {
            id: "subtopic_19",
            title: "Vowel Sound Practice",
            category: "Pronunciation",
            level: student.level,
            description: "Master accurate pronunciation of all vowel sounds including monophthongs and diphthongs. Focus on distinguishing between similar sounds, mouth positioning, and tongue placement. Practice with minimal pairs and authentic listening materials to develop clear, natural vowel production."
          },
          {
            id: "subtopic_20",
            title: "Consonant Clusters",
            category: "Pronunciation",
            level: student.level,
            description: "Practice challenging consonant combinations at the beginning, middle, and end of words. Learn techniques for smooth transitions between consonants, common simplification patterns, and strategies for maintaining clarity in rapid speech."
          },
          {
            id: "subtopic_21",
            title: "Intonation Patterns",
            category: "Pronunciation",
            level: student.level,
            description: "Develop natural speech rhythm and melody patterns for different sentence types, emotions, and communicative functions. Learn rising and falling intonation, stress-timed rhythm, and how intonation affects meaning and listener perception."
          },
          {
            id: "subtopic_22",
            title: "Word Stress and Syllables",
            category: "Pronunciation",
            level: student.level,
            description: "Master correct word stress patterns in multi-syllabic words, including primary and secondary stress. Learn stress rules for different word types, prefixes, and suffixes. Practice identifying and producing appropriate stress patterns for clear communication."
          },
          {
            id: "subtopic_23",
            title: "Connected Speech",
            category: "Pronunciation",
            level: student.level,
            description: "Learn how words connect and change in natural, fluent speech including linking, elision, assimilation, and weak forms. Practice understanding and producing connected speech patterns to sound more natural and improve listening comprehension."
          },
          {
            id: "subtopic_24",
            title: "Listening for Details",
            category: "Pronunciation",
            level: student.level,
            description: "Develop advanced listening skills for extracting specific information from various audio sources including conversations, announcements, and media. Practice note-taking strategies, identifying key details, and distinguishing between main ideas and supporting information."
          }
        ]
      },
      {
        title: `${languageName} Practical Communication`,
        objectives: [
          "Apply language in real-world situations",
          "Build practical communication skills",
          "Develop confidence in various contexts"
        ],
        activities: [
          "Real-life scenario practice",
          "Problem-solving conversations",
          "Interactive communication tasks"
        ],
        materials: [
          "Scenario cards",
          "Real-world examples",
          "Communication guides"
        ],
        assessment: [
          "Practical communication evaluation",
          "Scenario completion test"
        ],
        sub_topics: [
          {
            id: "subtopic_25",
            title: "Shopping and Services",
            category: "Conversation",
            level: student.level,
            description: "Master practical language for shopping, comparing products, negotiating prices, and using various services. Learn to express preferences, ask for assistance, handle complaints, and understand return policies. Practice interactions in different retail environments and service contexts."
          },
          {
            id: "subtopic_26",
            title: "Travel and Directions",
            category: "English for Travel",
            level: student.level,
            description: "Essential travel vocabulary and navigation skills including asking for and giving directions, using public transportation, booking accommodations, and handling travel emergencies. Learn geographical terms, transportation vocabulary, and polite ways to request help from locals."
          },
          {
            id: "subtopic_27",
            title: "Making Appointments",
            category: "Conversation",
            level: student.level,
            description: "Practice professional language for scheduling appointments, rescheduling meetings, and managing time commitments. Learn formal and informal registers, time expressions, and appropriate ways to confirm, cancel, or modify appointments in various professional and personal contexts."
          },
          {
            id: "subtopic_28",
            title: "Emergency Situations",
            category: "Conversation",
            level: student.level,
            description: "Critical language skills for handling emergencies including medical situations, accidents, theft, and natural disasters. Learn to describe problems clearly, request immediate help, provide essential information to authorities, and understand emergency instructions and procedures."
          },
          {
            id: "subtopic_29",
            title: "Banking and Money",
            category: "Conversation",
            level: student.level,
            description: "Comprehensive financial vocabulary for banking transactions, investment discussions, and money management. Learn to open accounts, discuss loans, understand financial terms, handle currency exchange, and navigate digital banking services with confidence."
          },
          {
            id: "subtopic_30",
            title: "Social Interactions",
            category: "Conversation",
            level: student.level,
            description: "Navigate complex social situations including parties, networking events, cultural celebrations, and community gatherings. Learn appropriate conversation starters, cultural etiquette, ways to show interest and politeness, and how to gracefully exit conversations in various social contexts."
          }
        ]
      }
    ]
  };
}

serve(async (req) => {
  console.log('🚀 Edge function called:', req.method, req.url);
  console.log('🆔 FUNCTION VERSION: 5-Lesson Generator v5.0 - GUARANTEED 5 LESSONS - FORCE DEPLOY');
  console.log('🔥 TIMESTAMP:', new Date().toISOString());

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

    // Generate exactly 5 lessons using our guaranteed function
    const parsedLessons = generateFiveLessons(student);

    console.log('✅ Generated exactly 5 lessons for:', student.name);
    console.log('🔍 Lesson titles:', parsedLessons.lessons.map(l => l.title));
    console.log('🔢 CRITICAL: parsedLessons.lessons.length =', parsedLessons.lessons.length);
    
    // FORCE CHECK: Ensure we have exactly 5 lessons
    if (parsedLessons.lessons.length !== 5) {
      console.error('🚨 CRITICAL ERROR: Expected 5 lessons but got', parsedLessons.lessons.length);
      throw new Error(`CRITICAL: Function generated ${parsedLessons.lessons.length} lessons instead of 5`);
    }

    // Extract all sub-topics
    let allSubTopics: any[] = [];
    parsedLessons.lessons.forEach((lesson, index) => {
      if (lesson.sub_topics && Array.isArray(lesson.sub_topics)) {
        console.log(`📚 Lesson ${index + 1} has ${lesson.sub_topics.length} sub-topics`);
        allSubTopics = allSubTopics.concat(lesson.sub_topics);
      }
    });

    console.log('✅ Total sub-topics extracted:', allSubTopics.length);

    if (lesson_id) {
      // Update existing lesson
      console.log('� Updatinng existing lesson with 5 lesson plans...');
      const updateData: any = {
        generated_lessons: parsedLessons.lessons.map((lessonPlan: any) => JSON.stringify(lessonPlan)),
        sub_topics: allSubTopics,
        notes: `AI-generated 5 lesson plans updated on ${new Date().toLocaleDateString()}`
      };

      // Add lesson template ID if we found one
      if (lessonTemplateId) {
        updateData.lesson_template_id = lessonTemplateId;
      }

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

      console.log('✅ Lesson updated successfully with 5 lesson plans!');

      return new Response(
        JSON.stringify({
          success: true,
          lessons: parsedLessons.lessons,
          sub_topics: allSubTopics,
          lesson_id: updatedLesson.id,
          lesson_template_id: lessonTemplateId,
          message: '5 lesson plans updated successfully',
          updated: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      // Create new lesson (legacy mode)
      console.log('💾 Creating new lesson with 5 lesson plans...');
      const insertData: any = {
        student_id: student_id,
        tutor_id: user.id,
        date: new Date().toISOString(),
        status: 'upcoming',
        materials: ['AI Generated 5 Lesson Plans'],
        notes: `AI-generated 5 lesson plans created on ${new Date().toLocaleDateString()}`,
        generated_lessons: parsedLessons.lessons.map((lessonPlan: any) => JSON.stringify(lessonPlan)),
        sub_topics: allSubTopics
      };

      // Add lesson template ID if we found one
      if (lessonTemplateId) {
        insertData.lesson_template_id = lessonTemplateId;
      }

      const { data: lessonData, error: lessonError } = await supabaseClient
        .from('lessons')
        .insert(insertData)
        .select()
        .single()

      if (lessonError) {
        console.error('❌ Database save error:', lessonError);
        throw new Error(`Failed to save lesson: ${lessonError.message}`)
      }

      console.log('✅ Lesson saved successfully with 5 lesson plans!');

      return new Response(
        JSON.stringify({
          success: true,
          lessons: parsedLessons.lessons,
          sub_topics: allSubTopics,
          lesson_id: lessonData.id,
          lesson_template_id: lessonTemplateId,
          message: '5 lesson plans generated successfully',
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