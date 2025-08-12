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
  age_group?: string;
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

// AI-powered hyper-personalized lesson generation
async function generateHyperPersonalizedLessons(student: Student, supabaseClient: any) {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  console.log('🎯 GENERATING HYPER-PERSONALIZED MULTILINGUAL LESSONS');
  console.log('🆔 VERSION: Hyper-Personalized Multilingual Architect v1.0');
  console.log(`📚 Target Language: ${languageName}`);
  console.log(`👤 Student: ${student.name} (Level: ${student.level})`);
  
  try {
    // Step 1: Fetch all available templates
    const { data: templates, error: templatesError } = await supabaseClient
      .from('lesson_templates')
      .select('*')
      .eq('is_active', true);

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      // Fallback to basic generation if templates fail
      return generateBasicLessons(student);
    }

    console.log(`📋 Found ${templates.length} available templates`);

    // Step 2: Analyze student profile and select optimal templates
    const selectedTemplates = selectOptimalTemplates(student, templates);
    console.log(`✅ Selected ${selectedTemplates.length} optimal templates`);

    // Step 3: Generate AI-powered personalized content for each template with duplicate prevention
    const lessons = [];
    const allExistingSubTopics: string[] = [];
    
    for (let i = 0; i < Math.min(5, selectedTemplates.length); i++) {
      const template = selectedTemplates[i];
      console.log(`🤖 Generating lesson ${i + 1} using template: ${template.name}`);
      console.log(`🔍 Avoiding ${allExistingSubTopics.length} existing sub-topics`);
      
      const personalizedLesson = await generatePersonalizedLessonContent(student, template, i + 1, allExistingSubTopics);
      lessons.push(personalizedLesson);
      
      // Track sub-topics to prevent duplicates in next lessons
      if (personalizedLesson.sub_topics) {
        const newSubTopics = personalizedLesson.sub_topics.map(st => st.title);
        allExistingSubTopics.push(...newSubTopics);
        console.log(`📝 Added ${newSubTopics.length} sub-topics to duplicate prevention list`);
      }
    }

    // If we have fewer than 5 templates, fill with additional personalized lessons
    while (lessons.length < 5) {
      console.log(`🤖 Generating additional lesson ${lessons.length + 1}`);
      console.log(`🔍 Avoiding ${allExistingSubTopics.length} existing sub-topics`);
      
      const additionalLesson = await generateAdditionalPersonalizedLesson(student, lessons.length + 1, allExistingSubTopics);
      lessons.push(additionalLesson);
      
      // Track sub-topics to prevent duplicates
      if (additionalLesson.sub_topics) {
        const newSubTopics = additionalLesson.sub_topics.map(st => st.title);
        allExistingSubTopics.push(...newSubTopics);
        console.log(`📝 Added ${newSubTopics.length} sub-topics to duplicate prevention list`);
      }
    }

    console.log(`✅ Generated ${lessons.length} hyper-personalized lessons`);
    return { lessons };

  } catch (error) {
    console.error('❌ Error in hyper-personalized generation:', error);
    // Fallback to basic generation
    return generateBasicLessons(student);
  }
}

// Template selection based on student weaknesses, goals, level, and age group
function selectOptimalTemplates(student: Student, templates: any[]) {
  console.log('🎯 Analyzing student profile for optimal template selection...');
  console.log(`👤 Student: ${student.name}, Age Group: ${student.age_group || 'adult'}, Level: ${student.level}`);
  
  const studentLevel = student.level.toLowerCase();
  const studentAgeGroup = student.age_group || 'adult';
  const weaknesses = (student.grammar_weaknesses || '').toLowerCase();
  const goals = (student.end_goals || '').toLowerCase();
  const vocabularyGaps = (student.vocabulary_gaps || '').toLowerCase();
  const pronunciationChallenges = (student.pronunciation_challenges || '').toLowerCase();
  
  // Filter templates by age appropriateness first
  const ageAppropriateTemplates = templates.filter(template => {
    const templateName = template.name.toLowerCase();
    const templateCategory = template.category.toLowerCase();
    
    // Age-based filtering logic
    if (studentAgeGroup === 'kid') {
      // Kids (4-8): Only kid-specific templates
      return templateName.includes('kid') || templateName.includes('child') || templateCategory.includes('kids');
    } else if (studentAgeGroup === 'teenager') {
      // Teenagers (13-17): Exclude kids and senior-specific templates
      return !templateName.includes('kid') && !templateName.includes('child') && 
             !templateName.includes('senior') && !templateCategory.includes('kids');
    } else if (studentAgeGroup === 'adult') {
      // Adults (18-39): Exclude kids and senior-specific templates
      return !templateName.includes('kid') && !templateName.includes('child') && 
             !templateName.includes('senior') && !templateCategory.includes('kids');
    } else if (studentAgeGroup === 'middle_aged_adult') {
      // Middle-aged (40-64): Exclude kids templates, include business/professional
      return !templateName.includes('kid') && !templateName.includes('child') && 
             !templateCategory.includes('kids');
    } else if (studentAgeGroup === 'senior') {
      // Seniors (65+): Exclude kids templates, prefer slower-paced content
      return !templateName.includes('kid') && !templateName.includes('child') && 
             !templateCategory.includes('kids');
    }
    
    // Default: exclude kids templates for safety
    return !templateName.includes('kid') && !templateName.includes('child') && 
           !templateCategory.includes('kids');
  });
  
  console.log(`🔍 Filtered ${templates.length} templates to ${ageAppropriateTemplates.length} age-appropriate ones`);
  
  if (ageAppropriateTemplates.length === 0) {
    console.log('⚠️ No age-appropriate templates found, using all templates as fallback');
    // Fallback to all templates if no age-appropriate ones found
    ageAppropriateTemplates.push(...templates);
  }
  
  // Score templates based on student needs
  const scoredTemplates = ageAppropriateTemplates.map(template => {
    let score = 0;
    const templateCategory = template.category.toLowerCase();
    const templateLevel = template.level.toLowerCase();
    const templateName = template.name.toLowerCase();
    
    // Level matching (highest priority)
    if (templateLevel === studentLevel) score += 100;
    else if (Math.abs(getLevelNumber(templateLevel) - getLevelNumber(studentLevel)) === 1) score += 50;
    
    // Age group bonus scoring
    if (studentAgeGroup === 'kid' && (templateName.includes('kid') || templateCategory.includes('kids'))) score += 200;
    if (studentAgeGroup === 'teenager' && templateCategory.includes('conversation')) score += 50;
    if (studentAgeGroup === 'adult' && templateCategory.includes('business')) score += 60;
    if (studentAgeGroup === 'middle_aged_adult' && templateCategory.includes('business')) score += 80;
    if (studentAgeGroup === 'senior' && templateCategory.includes('conversation')) score += 40;
    
    // Weakness-based scoring
    if (weaknesses.includes('grammar') && templateCategory.includes('grammar')) score += 80;
    if (weaknesses.includes('vocabulary') && templateCategory.includes('vocabulary')) score += 80;
    if (weaknesses.includes('pronunciation') && templateCategory.includes('pronunciation')) score += 80;
    if (weaknesses.includes('conversation') && templateCategory.includes('conversation')) score += 80;
    
    // Goal-based scoring
    if (goals.includes('business') && templateCategory.includes('business')) score += 90;
    if (goals.includes('travel') && templateCategory.includes('travel')) score += 90;
    if (goals.includes('conversation') && templateCategory.includes('conversation')) score += 70;
    if (goals.includes('fluent') && templateCategory.includes('conversation')) score += 70;
    
    // Vocabulary and pronunciation specific scoring
    if (vocabularyGaps && templateCategory.includes('vocabulary')) score += 60;
    if (pronunciationChallenges && templateCategory.includes('pronunciation')) score += 60;
    
    // Prefer diverse template types
    const diversityBonus = {
      'conversation': 40,
      'grammar': 35,
      'vocabulary': 30,
      'business english': 45,
      'pronunciation': 25
    };
    score += diversityBonus[templateCategory] || 20;
    
    return { ...template, score };
  });
  
  // Sort by score and select top templates
  const sortedTemplates = scoredTemplates.sort((a, b) => b.score - a.score);
  
  // Ensure diversity - don't select too many of the same category
  const selectedTemplates = [];
  const categoryCount = {};
  
  for (const template of sortedTemplates) {
    const category = template.category.toLowerCase();
    if (!categoryCount[category]) categoryCount[category] = 0;
    
    if (categoryCount[category] < 2 && selectedTemplates.length < 8) {
      selectedTemplates.push(template);
      categoryCount[category]++;
      console.log(`✅ Selected: ${template.name} (Score: ${template.score}, Category: ${template.category}, Age-appropriate: ✅)`);
    }
  }
  
  return selectedTemplates;
}

// Helper function to convert level to number for comparison
function getLevelNumber(level: string): number {
  const levelMap = { 'a1': 1, 'a2': 2, 'b1': 3, 'b2': 4, 'c1': 5, 'c2': 6 };
  return levelMap[level.toLowerCase()] || 3;
}

// Generate AI-powered personalized lesson content with duplicate prevention
async function generatePersonalizedLessonContent(student: Student, template: any, lessonNumber: number, existingSubTopics: string[] = []) {
  const languageName = languageMap[student.target_language] || student.target_language;
  const targetLanguageCode = student.target_language;
  
  // Create hyper-personalized AI prompt with duplicate prevention
  const prompt = `You are an expert ${languageName} tutor creating a hyper-personalized lesson for ${student.name}.

CRITICAL INSTRUCTIONS:
1. Generate ALL content in ${languageName} (target language)
2. Make this lesson feel like it was created specifically for ${student.name}
3. Address their specific weaknesses and goals
4. Use cultural references and examples relevant to someone from ${student.native_language || 'their background'}
5. ABSOLUTELY NO DUPLICATE SUB-TOPICS - Each sub-topic must be completely unique

STUDENT PROFILE:
- Name: ${student.name}
- Target Language: ${languageName}
- Current Level: ${student.level.toUpperCase()}
- Native Language: ${student.native_language || 'Not specified'}
- Learning Goals: ${student.end_goals || 'General improvement'}
- Grammar Weaknesses: ${student.grammar_weaknesses || 'None specified'}
- Vocabulary Gaps: ${student.vocabulary_gaps || 'None specified'}
- Pronunciation Challenges: ${student.pronunciation_challenges || 'None specified'}
- Fluency Barriers: ${student.conversational_fluency_barriers || 'None specified'}
- Learning Styles: ${student.learning_styles?.join(', ') || 'Mixed'}
- Additional Notes: ${student.notes || 'None'}

TEMPLATE CONTEXT:
- Template: ${template.name}
- Category: ${template.category}
- Level: ${template.level}
- Lesson Number: ${lessonNumber} of 5

${existingSubTopics.length > 0 ? `
DUPLICATE PREVENTION - AVOID THESE EXISTING SUB-TOPICS:
${existingSubTopics.map((topic, index) => `${index + 1}. "${topic}"`).join('\n')}

YOU MUST CREATE COMPLETELY DIFFERENT SUB-TOPICS. Be creative and specific to avoid any overlap.
` : ''}

HYPER-PERSONALIZATION REQUIREMENTS:
1. Use ${student.name}'s name throughout the lesson
2. Reference their specific goals: "${student.end_goals}"
3. Address their weaknesses: "${student.grammar_weaknesses}"
4. Include examples relevant to their native language background
5. Adapt difficulty to their exact level: ${student.level}
6. Make each sub-topic highly specific and unique
7. Focus on ${student.name}'s individual learning journey

LESSON ${lessonNumber} FOCUS:
${lessonNumber === 1 ? 'Foundation building and assessment of current abilities' :
  lessonNumber === 2 ? 'Core skill development targeting identified weaknesses' :
  lessonNumber === 3 ? 'Practical application and real-world scenarios' :
  lessonNumber === 4 ? 'Advanced concepts and cultural integration' :
  'Mastery consolidation and future planning'}

Generate a complete lesson with:
- Title (in ${languageName}, mentioning ${student.name} and lesson focus)
- 4 specific objectives (in ${languageName})
- 5 engaging activities (in ${languageName})
- 4 materials needed (in ${languageName})
- 3 assessment methods (in ${languageName})
- 6 COMPLETELY UNIQUE sub-topics with rich descriptions (in ${languageName})

Each sub-topic must be:
- Highly specific to ${student.name}'s needs
- Different from all previous sub-topics
- Focused on the lesson's unique purpose
- Addressing specific aspects of their weaknesses/goals

Return ONLY a JSON object with this exact structure:
{
  "title": "lesson title in ${languageName}",
  "objectives": ["objective 1", "objective 2", "objective 3", "objective 4"],
  "activities": ["activity 1", "activity 2", "activity 3", "activity 4", "activity 5"],
  "materials": ["material 1", "material 2", "material 3", "material 4"],
  "assessment": ["assessment 1", "assessment 2", "assessment 3"],
  "sub_topics": [
    {
      "id": "subtopic_${lessonNumber}_1",
      "title": "unique subtopic title",
      "category": "${template.category}",
      "level": "${student.level}",
      "description": "detailed description in ${languageName}"
    }
    // ... 6 sub-topics total
  ]
}`;

  try {
    console.log(`🤖 Calling Gemini AI for lesson ${lessonNumber}...`);
    const aiResponse = await callGeminiAPI(prompt);
    console.log(`✅ AI generated lesson ${lessonNumber} successfully`);
    console.log(`📝 Generated sub-topics: ${aiResponse.sub_topics?.map(st => st.title).join(', ')}`);
    return aiResponse;
  } catch (error) {
    console.error(`❌ AI generation failed for lesson ${lessonNumber}:`, error);
    console.error(`❌ Error details:`, error.message);
    console.log(`🔄 Falling back to template-based generation for lesson ${lessonNumber}`);
    // Fallback to template-based generation
    return generateFallbackLesson(student, template, lessonNumber);
  }
}

// Gemini AI integration
async function callGeminiAPI(prompt: string) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  const generatedText = data.candidates[0].content.parts[0].text;
  
  try {
    // Parse the JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    console.error('❌ Failed to parse AI response:', parseError);
    throw new Error('Failed to parse AI response as JSON');
  }
}

// Generate additional personalized lesson if we need more than available templates
async function generateAdditionalPersonalizedLesson(student: Student, lessonNumber: number, existingSubTopics: string[] = []) {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  // Create a generic but personalized lesson with duplicate prevention
  const prompt = `You are an expert ${languageName} tutor creating a hyper-personalized lesson for ${student.name}.

CRITICAL INSTRUCTIONS:
1. Generate ALL content in ${languageName} (target language)
2. Make this lesson feel like it was created specifically for ${student.name}
3. Address their specific weaknesses and goals
4. Use cultural references relevant to someone from ${student.native_language || 'their background'}
5. ABSOLUTELY NO DUPLICATE SUB-TOPICS - Each sub-topic must be completely unique

STUDENT PROFILE:
- Name: ${student.name}
- Target Language: ${languageName}
- Current Level: ${student.level.toUpperCase()}
- Native Language: ${student.native_language || 'Not specified'}
- Learning Goals: ${student.end_goals || 'General improvement'}
- Grammar Weaknesses: ${student.grammar_weaknesses || 'None specified'}
- Vocabulary Gaps: ${student.vocabulary_gaps || 'None specified'}
- Pronunciation Challenges: ${student.pronunciation_challenges || 'None specified'}
- Fluency Barriers: ${student.conversational_fluency_barriers || 'None specified'}

${existingSubTopics.length > 0 ? `
DUPLICATE PREVENTION - AVOID THESE EXISTING SUB-TOPICS:
${existingSubTopics.map((topic, index) => `${index + 1}. "${topic}"`).join('\n')}

YOU MUST CREATE COMPLETELY DIFFERENT SUB-TOPICS. Be creative and specific to avoid any overlap.
` : ''}

LESSON ${lessonNumber} FOCUS:
${lessonNumber === 1 ? 'Foundation building and assessment of current abilities' :
  lessonNumber === 2 ? 'Core skill development targeting identified weaknesses' :
  lessonNumber === 3 ? 'Practical application and real-world scenarios' :
  lessonNumber === 4 ? 'Advanced concepts and cultural integration' :
  'Mastery consolidation and future planning'}

Create a comprehensive ${languageName} lesson that addresses ${student.name}'s specific needs.

Each sub-topic must be:
- Highly specific to ${student.name}'s needs
- Different from all previous sub-topics
- Focused on the lesson's unique purpose
- Addressing specific aspects of their weaknesses/goals

Return ONLY a JSON object with this exact structure:
{
  "title": "lesson title in ${languageName}",
  "objectives": ["objective 1", "objective 2", "objective 3", "objective 4"],
  "activities": ["activity 1", "activity 2", "activity 3", "activity 4", "activity 5"],
  "materials": ["material 1", "material 2", "material 3", "material 4"],
  "assessment": ["assessment 1", "assessment 2", "assessment 3"],
  "sub_topics": [
    {
      "id": "subtopic_${lessonNumber}_1",
      "title": "unique subtopic title",
      "category": "General",
      "level": "${student.level}",
      "description": "detailed description in ${languageName}"
    }
    // ... 6 sub-topics total
  ]
}`;

  try {
    const aiResponse = await callGeminiAPI(prompt);
    return aiResponse;
  } catch (error) {
    console.error(`❌ AI generation failed for additional lesson ${lessonNumber}:`, error);
    return generateBasicFallbackLesson(student, lessonNumber);
  }
}

// Basic fallback lessons if all AI fails
function generateBasicLessons(student: Student) {
  console.log('⚠️ Using basic fallback lesson generation');
  return generateFiveLessons(student);
}

// Fallback lesson generation if AI fails
function generateFallbackLesson(student: Student, template: any, lessonNumber: number) {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  return {
    title: `${languageName} ${template.category} for ${student.name}`,
    objectives: [
      `Master ${student.level} level ${template.category.toLowerCase()} skills`,
      `Address specific weaknesses: ${student.grammar_weaknesses || 'general areas'}`,
      `Work towards goal: ${student.end_goals || 'language improvement'}`,
      `Build confidence in ${languageName}`
    ],
    activities: [
      `Personalized ${template.category.toLowerCase()} practice for ${student.name}`,
      `Interactive exercises targeting ${student.level} level`,
      `Cultural context activities`,
      `Real-world application scenarios`,
      `Progress assessment and feedback`
    ],
    materials: [
      `${languageName} ${template.category.toLowerCase()} resources`,
      `Level-appropriate ${student.level} materials`,
      `Cultural reference materials`,
      `Assessment tools`
    ],
    assessment: [
      `${template.category} skill evaluation`,
      `Progress tracking for ${student.name}`,
      `Personalized feedback session`
    ],
    sub_topics: generateFallbackSubTopics(student, template, lessonNumber)
  };
}

// Generate fallback sub-topics
function generateFallbackSubTopics(student: Student, template: any, lessonNumber: number) {
  const baseTopics = [
    { title: "Foundation Skills", description: `Core ${template.category.toLowerCase()} skills for ${student.level} level` },
    { title: "Practical Application", description: `Real-world use of ${template.category.toLowerCase()} in daily situations` },
    { title: "Common Challenges", description: `Addressing typical difficulties for ${student.native_language || 'learners'} speakers` },
    { title: "Cultural Context", description: `Understanding cultural aspects of ${template.category.toLowerCase()}` },
    { title: "Interactive Practice", description: `Hands-on exercises tailored for ${student.name}` },
    { title: "Progress Assessment", description: `Evaluating improvement in ${template.category.toLowerCase()} skills` }
  ];

  return baseTopics.map((topic, index) => ({
    id: `subtopic_${lessonNumber}_${index + 1}`,
    title: topic.title,
    category: template.category,
    level: student.level,
    description: topic.description
  }));
}

// Basic fallback lesson for additional lessons
function generateBasicFallbackLesson(student: Student, lessonNumber: number) {
  const languageName = languageMap[student.target_language] || student.target_language;
  
  return {
    title: `${languageName} Comprehensive Practice for ${student.name}`,
    objectives: [
      `Reinforce ${student.level} level skills`,
      `Address personal learning goals`,
      `Build practical communication abilities`,
      `Increase confidence in ${languageName}`
    ],
    activities: [
      `Personalized practice sessions`,
      `Interactive communication exercises`,
      `Real-world scenario practice`,
      `Cultural immersion activities`,
      `Progress review and planning`
    ],
    materials: [
      `${languageName} learning resources`,
      `Interactive practice materials`,
      `Cultural reference guides`,
      `Progress tracking tools`
    ],
    assessment: [
      `Comprehensive skill evaluation`,
      `Personal progress assessment`,
      `Goal achievement review`
    ],
    sub_topics: [
      {
        id: `subtopic_${lessonNumber}_1`,
        title: "Skill Reinforcement",
        category: "General",
        level: student.level,
        description: `Strengthen core ${languageName} skills at ${student.level} level`
      },
      {
        id: `subtopic_${lessonNumber}_2`,
        title: "Practical Communication",
        category: "General",
        level: student.level,
        description: `Apply ${languageName} in real-world situations`
      },
      {
        id: `subtopic_${lessonNumber}_3`,
        title: "Cultural Understanding",
        category: "General",
        level: student.level,
        description: `Develop cultural awareness in ${languageName} contexts`
      },
      {
        id: `subtopic_${lessonNumber}_4`,
        title: "Personal Goals",
        category: "General",
        level: student.level,
        description: `Work towards individual learning objectives`
      },
      {
        id: `subtopic_${lessonNumber}_5`,
        title: "Confidence Building",
        category: "General",
        level: student.level,
        description: `Build confidence in using ${languageName}`
      },
      {
        id: `subtopic_${lessonNumber}_6`,
        title: "Progress Planning",
        category: "General",
        level: student.level,
        description: `Plan next steps in ${languageName} learning journey`
      }
    ]
  };
}

// Keep the original function as ultimate fallback
function generateFiveLessons(student: Student) {
  const languageName = languageMap[student.target_language] || student.target_language;
  
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
            title: "Basic Conversation Skills",
            category: "Conversation",
            level: student.level,
            description: `Essential conversation skills for ${student.level} level learners`
          },
          {
            id: "subtopic_2",
            title: "Daily Communication",
            category: "Conversation",
            level: student.level,
            description: `Practical daily communication in ${languageName}`
          },
          {
            id: "subtopic_3",
            title: "Social Interactions",
            category: "Conversation",
            level: student.level,
            description: `Social interaction skills in ${languageName}`
          },
          {
            id: "subtopic_4",
            title: "Pronunciation Practice",
            category: "Pronunciation",
            level: student.level,
            description: `${languageName} pronunciation improvement`
          },
          {
            id: "subtopic_5",
            title: "Listening Skills",
            category: "Conversation",
            level: student.level,
            description: `Develop listening comprehension in ${languageName}`
          },
          {
            id: "subtopic_6",
            title: "Cultural Context",
            category: "Conversation",
            level: student.level,
            description: `Understanding cultural context in ${languageName}`
          }
        ]
      },
      {
        title: `${languageName} Grammar Essentials for ${student.name}`,
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
            title: "Basic Grammar Rules",
            category: "Grammar",
            level: student.level,
            description: `Essential grammar rules for ${student.level} level`
          },
          {
            id: "subtopic_8",
            title: "Sentence Structure",
            category: "Grammar",
            level: student.level,
            description: `${languageName} sentence construction patterns`
          },
          {
            id: "subtopic_9",
            title: "Common Mistakes",
            category: "Grammar",
            level: student.level,
            description: `Avoiding common grammar mistakes in ${languageName}`
          },
          {
            id: "subtopic_10",
            title: "Practical Application",
            category: "Grammar",
            level: student.level,
            description: `Using grammar in real-world contexts`
          },
          {
            id: "subtopic_11",
            title: "Error Correction",
            category: "Grammar",
            level: student.level,
            description: `Identifying and fixing grammar errors`
          },
          {
            id: "subtopic_12",
            title: "Advanced Structures",
            category: "Grammar",
            level: student.level,
            description: `More complex grammar structures for ${student.level}`
          }
        ]
      },
      {
        title: `${languageName} Vocabulary Building for ${student.name}`,
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
            title: "Essential Vocabulary",
            category: "Vocabulary",
            level: student.level,
            description: `Core vocabulary for ${student.level} level learners`
          },
          {
            id: "subtopic_14",
            title: "Thematic Words",
            category: "Vocabulary",
            level: student.level,
            description: `Topic-based vocabulary in ${languageName}`
          },
          {
            id: "subtopic_15",
            title: "Word Families",
            category: "Vocabulary",
            level: student.level,
            description: `Understanding word relationships and families`
          },
          {
            id: "subtopic_16",
            title: "Contextual Usage",
            category: "Vocabulary",
            level: student.level,
            description: `Using vocabulary appropriately in context`
          },
          {
            id: "subtopic_17",
            title: "Collocations",
            category: "Vocabulary",
            level: student.level,
            description: `Natural word combinations in ${languageName}`
          },
          {
            id: "subtopic_18",
            title: "Practical Application",
            category: "Vocabulary",
            level: student.level,
            description: `Applying new vocabulary in real situations`
          }
        ]
      },
      {
        title: `${languageName} Practical Skills for ${student.name}`,
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
            id: "subtopic_19",
            title: "Real-world Communication",
            category: "Conversation",
            level: student.level,
            description: `Practical communication skills in ${languageName}`
          },
          {
            id: "subtopic_20",
            title: "Problem Solving",
            category: "Conversation",
            level: student.level,
            description: `Using ${languageName} to solve everyday problems`
          },
          {
            id: "subtopic_21",
            title: "Social Situations",
            category: "Conversation",
            level: student.level,
            description: `Navigating social situations in ${languageName}`
          },
          {
            id: "subtopic_22",
            title: "Professional Context",
            category: "Business English",
            level: student.level,
            description: `Using ${languageName} in professional settings`
          },
          {
            id: "subtopic_23",
            title: "Cultural Awareness",
            category: "Conversation",
            level: student.level,
            description: `Understanding cultural nuances in ${languageName}`
          },
          {
            id: "subtopic_24",
            title: "Confidence Building",
            category: "Conversation",
            level: student.level,
            description: `Building confidence in ${languageName} communication`
          }
        ]
      },
      {
        title: `${languageName} Comprehensive Review for ${student.name}`,
        objectives: [
          "Review and consolidate learning",
          "Identify areas for improvement",
          "Plan future learning goals"
        ],
        activities: [
          "Comprehensive review exercises",
          "Self-assessment activities",
          "Goal setting sessions"
        ],
        materials: [
          "Review worksheets",
          "Assessment tools",
          "Progress tracking charts"
        ],
        assessment: [
          "Comprehensive skill evaluation",
          "Progress assessment",
          "Future planning session"
        ],
        sub_topics: [
          {
            id: "subtopic_25",
            title: "Skills Review",
            category: "General",
            level: student.level,
            description: `Comprehensive review of ${languageName} skills`
          },
          {
            id: "subtopic_26",
            title: "Progress Assessment",
            category: "General",
            level: student.level,
            description: `Evaluating progress in ${languageName} learning`
          },
          {
            id: "subtopic_27",
            title: "Weakness Identification",
            category: "General",
            level: student.level,
            description: `Identifying areas needing improvement`
          },
          {
            id: "subtopic_28",
            title: "Strength Recognition",
            category: "General",
            level: student.level,
            description: `Recognizing strengths and achievements`
          },
          {
            id: "subtopic_29",
            title: "Goal Setting",
            category: "General",
            level: student.level,
            description: `Setting future learning goals in ${languageName}`
          },
          {
            id: "subtopic_30",
            title: "Next Steps",
            category: "General",
            level: student.level,
            description: `Planning the next phase of ${languageName} learning`
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

    // Generate hyper-personalized lessons using AI and templates
    const parsedLessons = await generateHyperPersonalizedLessons(student, supabaseClient);

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