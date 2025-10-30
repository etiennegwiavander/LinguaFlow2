/**
 * Simple test to check if lesson generation is using AI or fallback
 */

const SUPABASE_URL = 'https://urmuwjcjcyohsrkgyapl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTEwMzE0MCwiZXhwIjoyMDY0Njc5MTQwfQ.f244RmJBYqyWf69yaEvkSla4uA9fJcoD-ze6maUINF4';

async function testLessonGeneration() {
  console.log('🧪 TESTING LESSON GENERATION');
  console.log('================================\n');

  try {
    // First, get a student
    console.log('📋 Step 1: Finding a student...');
    const studentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });

    const students = await studentsResponse.json();
    if (!students || students.length === 0) {
      console.log('❌ No students found');
      return;
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.name} (ID: ${student.id})`);
    console.log(`   Level: ${student.level}, Language: ${student.target_language}`);
    console.log('');

    // Get or create an upcoming lesson
    console.log('📋 Step 2: Finding/creating upcoming lesson...');
    const lessonsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/lessons?student_id=eq.${student.id}&status=eq.upcoming&select=*&limit=1`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
      }
    );

    let lessons = await lessonsResponse.json();
    let lessonId;

    if (!lessons || lessons.length === 0) {
      console.log('   No upcoming lesson found, creating one...');
      
      // Create a new lesson
      const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/lessons`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          student_id: student.id,
          tutor_id: student.tutor_id,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'upcoming',
          materials: []
        })
      });

      const newLessons = await createResponse.json();
      lessonId = newLessons[0].id;
      console.log(`   ✅ Created lesson: ${lessonId}`);
    } else {
      lessonId = lessons[0].id;
      console.log(`   ✅ Found lesson: ${lessonId}`);
    }
    console.log('');

    // Call the Edge Function
    console.log('📋 Step 3: Calling generate-lesson-plan Edge Function...');
    console.log('   This may take 30-60 seconds...');
    console.log('');

    const startTime = Date.now();
    const functionResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-lesson-plan`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId
        })
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Completed in ${duration}s`);
    console.log('');

    if (!functionResponse.ok) {
      const errorText = await functionResponse.text();
      console.log('❌ Edge Function Error:');
      console.log('   Status:', functionResponse.status);
      console.log('   Response:', errorText);
      return;
    }

    const result = await functionResponse.json();
    console.log('✅ Edge Function Response:');
    console.log('   Success:', result.success);
    console.log('   Lessons generated:', result.lessons?.length || 0);
    console.log('');

    // Analyze the lessons
    if (result.lessons && result.lessons.length > 0) {
      console.log('📊 ANALYZING LESSON CONTENT:');
      console.log('================================\n');

      let aiGenerated = 0;
      let fallback = 0;

      result.lessons.forEach((lesson, index) => {
        const title = lesson.title || '';
        const isPersonalized = title.includes(student.name);
        const isFallback = title.includes(`${student.target_language} `) && 
                          title.includes(` for ${student.name}`) &&
                          !title.includes(':');

        console.log(`Lesson ${index + 1}:`);
        console.log(`   Title: "${title}"`);
        console.log(`   Type: ${isFallback ? '❌ FALLBACK' : '✅ AI GENERATED'}`);
        console.log(`   Personalized: ${isPersonalized ? 'Yes' : 'No'}`);
        console.log(`   Sub-topics: ${lesson.sub_topics?.length || 0}`);
        console.log('');

        if (isFallback) {
          fallback++;
        } else {
          aiGenerated++;
        }
      });

      console.log('================================');
      console.log('📊 SUMMARY:');
      console.log(`   ✅ AI Generated: ${aiGenerated}`);
      console.log(`   ❌ Fallback: ${fallback}`);
      console.log('');

      if (fallback > 0) {
        console.log('⚠️  ISSUE DETECTED:');
        console.log('   Some or all lessons are using fallback content.');
        console.log('   This means the AI generation is failing.');
        console.log('');
        console.log('💡 POSSIBLE CAUSES:');
        console.log('   1. Gemini API key is invalid or expired');
        console.log('   2. API rate limiting (12 requests/minute)');
        console.log('   3. API quota exceeded');
        console.log('   4. Network issues reaching Gemini API');
        console.log('   5. Parsing errors in AI response');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('   1. Check Supabase Dashboard > Edge Functions > Logs');
        console.log('   2. Look for "AI generation failed" messages');
        console.log('   3. Verify GEMINI_API_KEY is correct');
        console.log('   4. Test API key: node test-gemini-api-direct.js');
      } else {
        console.log('✅ SUCCESS:');
        console.log('   All lessons are AI-generated and personalized!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testLessonGeneration();
