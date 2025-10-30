// Test script to debug lesson generation
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey, serviceRoleKey, geminiApiKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
    if (line.startsWith('SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
    if (line.startsWith('GEMINI_API_KEY=')) {
      geminiApiKey = line.split('=')[1].trim();
    }
  });
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔧 Environment Check:');
console.log(`✅ Supabase URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
console.log(`✅ Service Role Key: ${serviceRoleKey ? 'Found' : 'Missing'}`);
console.log(`✅ Gemini API Key: ${geminiApiKey ? 'Found' : 'Missing'}`);
console.log('');

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Test Gemini API directly
async function testGeminiAPI() {
  console.log('🤖 Testing Gemini API directly...');
  
  const prompt = `You are an expert French tutor. Generate a simple lesson plan.

Return ONLY a JSON object with this structure:
{
  "title": "French Basics",
  "objectives": ["Learn greetings", "Practice pronunciation"],
  "activities": ["Speaking practice", "Listening exercises"],
  "materials": ["Audio files", "Worksheets"],
  "assessment": ["Oral test", "Written quiz"],
  "sub_topics": [
    {
      "id": "test_1",
      "title": "Greetings",
      "category": "Conversation",
      "level": "A1",
      "description": "Learn basic French greetings"
    }
  ]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
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

    console.log(`   Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Gemini API response structure:');
    console.log(`   Has candidates: ${!!data.candidates}`);
    console.log(`   Candidates length: ${data.candidates?.length || 0}`);
    
    if (data.candidates && data.candidates[0]) {
      const generatedText = data.candidates[0].content?.parts?.[0]?.text;
      console.log(`   Generated text length: ${generatedText?.length || 0}`);
      console.log(`   Generated text preview: ${generatedText?.substring(0, 200)}...`);
      
      // Try to parse JSON
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed JSON from Gemini');
          console.log(`   Title: ${parsed.title}`);
          console.log(`   Sub-topics: ${parsed.sub_topics?.length || 0}`);
          return true;
        } else {
          console.error('❌ No JSON found in Gemini response');
          return false;
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Gemini:', parseError.message);
        return false;
      }
    } else {
      console.error('❌ Invalid Gemini response structure');
      return false;
    }
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    return false;
  }
}

async function testLessonGeneration() {
  try {
    // First test Gemini API directly
    const geminiWorking = await testGeminiAPI();
    console.log('');
    
    if (!geminiWorking) {
      console.log('🚨 GEMINI API IS NOT WORKING - This explains the repetitive sub-topics!');
      console.log('   The function is falling back to hardcoded templates.');
      console.log('');
    }
    
    console.log('🔍 Finding a student to test with...');
    
    // Get a student with their lesson
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        student_id,
        tutor_id,
        generated_lessons,
        sub_topics,
        students(
          id,
          name,
          target_language,
          level,
          age_group,
          end_goals,
          grammar_weaknesses,
          vocabulary_gaps,
          pronunciation_challenges,
          conversational_fluency_barriers,
          learning_styles,
          notes
        )
      `)
      .limit(1);

    if (lessonsError || !lessons || lessons.length === 0) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    const lesson = lessons[0];
    const student = lesson.students;
    
    console.log('✅ Found test lesson:');
    console.log(`   Lesson ID: ${lesson.id}`);
    console.log(`   Student: ${student.name}`);
    console.log(`   Target Language: ${student.target_language}`);
    console.log(`   Level: ${student.level}`);
    console.log(`   Age Group: ${student.age_group || 'adult (default)'}`);
    console.log(`   Current sub-topics: ${lesson.sub_topics?.length || 0}`);
    console.log('');

    console.log('🚀 Calling lesson generation function...');
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
      body: {
        lesson_id: lesson.id
      }
    });

    if (error) {
      console.error('❌ Function call error:', error);
      return;
    }

    console.log('✅ Function response received:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    console.log(`   Lessons generated: ${data.lessons?.length || 0}`);
    console.log(`   Sub-topics: ${data.sub_topics?.length || 0}`);
    
    if (data.lessons && data.lessons.length > 0) {
      console.log('\n📚 Generated Lessons:');
      data.lessons.forEach((lesson, index) => {
        console.log(`   ${index + 1}. ${lesson.title}`);
        console.log(`      Sub-topics: ${lesson.sub_topics?.length || 0}`);
        if (lesson.sub_topics) {
          lesson.sub_topics.forEach((st, stIndex) => {
            console.log(`         ${stIndex + 1}. ${st.title}`);
          });
        }
      });
    }

    // Check if sub-topics are repetitive
    if (data.sub_topics && data.sub_topics.length > 0) {
      console.log('\n🔍 Analyzing sub-topic uniqueness...');
      const titles = data.sub_topics.map(st => st.title);
      const uniqueTitles = [...new Set(titles)];
      
      console.log(`   Total sub-topics: ${titles.length}`);
      console.log(`   Unique titles: ${uniqueTitles.length}`);
      
      if (titles.length !== uniqueTitles.length) {
        console.log('⚠️  FOUND REPETITIVE SUB-TOPICS!');
        const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
        console.log('   Duplicates:', [...new Set(duplicates)]);
        
        if (!geminiWorking) {
          console.log('\n💡 ROOT CAUSE: Gemini API is failing, so the function falls back to');
          console.log('   hardcoded templates that generate the same 6 sub-topics every time.');
        }
      } else {
        console.log('✅ All sub-topics are unique');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLessonGeneration();