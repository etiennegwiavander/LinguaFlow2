/**
 * Test lesson generation specifically for Mine to see what's happening
 */

const SUPABASE_URL = 'https://urmuwjcjcyohsrkgyapl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybXV3amNqY3lvaHNya2d5YXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTEwMzE0MCwiZXhwIjoyMDY0Njc5MTQwfQ.f244RmJBYqyWf69yaEvkSla4uA9fJcoD-ze6maUINF4';

async function testMineGeneration() {
  console.log('🧪 TESTING LESSON GENERATION FOR MINE');
  console.log('================================\n');

  try {
    // Find Mine
    console.log('📋 Finding Mine...');
    const studentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/students?select=*`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
      }
    );

    const allStudents = await studentsResponse.json();
    const mine = allStudents.find(s => s.name.toLowerCase().includes('mine'));
    
    if (!mine) {
      console.log('❌ Mine not found');
      return;
    }

    console.log(`✅ Found Mine (ID: ${mine.id})`);
    console.log('');

    // Get her upcoming lesson
    console.log('📋 Finding upcoming lesson...');
    const lessonsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/lessons?student_id=eq.${mine.id}&status=eq.upcoming&select=*&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
      }
    );

    const lessons = await lessonsResponse.json();
    
    if (!lessons || lessons.length === 0) {
      console.log('❌ No upcoming lesson found');
      return;
    }

    const lesson = lessons[0];
    console.log(`✅ Found lesson (ID: ${lesson.id})`);
    console.log('');

    // Call the Edge Function to regenerate
    console.log('📋 Calling generate-lesson-plan Edge Function...');
    console.log('   This will regenerate the lessons for Mine');
    console.log('   Watch for any errors or fallback messages');
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
          lesson_id: lesson.id
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
        const hasColon = title.includes(':');
        const isGeneric = title.match(/^English .+ for Mine$/);
        
        let type = '✅ AI GENERATED';
        if (isGeneric && !hasColon) {
          type = '❌ FALLBACK';
          fallback++;
        } else {
          aiGenerated++;
        }
        
        console.log(`Lesson ${index + 1}: ${type}`);
        console.log(`   Title: "${title}"`);
        console.log('');
      });

      console.log('================================');
      console.log('📊 SUMMARY:');
      console.log(`   ✅ AI Generated: ${aiGenerated}`);
      console.log(`   ❌ Fallback: ${fallback}`);
      console.log('');

      if (fallback > 0) {
        console.log('⚠️  ISSUE DETECTED: Fallback content is being used');
        console.log('');
        console.log('💡 POSSIBLE CAUSES:');
        console.log('   1. AI generation is throwing an error');
        console.log('   2. API response is not being parsed correctly');
        console.log('   3. Rate limiting (12 requests/minute)');
        console.log('   4. Timeout issues');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('   1. Check Supabase Dashboard > Edge Functions > generate-lesson-plan > Logs');
        console.log('   2. Look for "❌ AI generation failed" messages');
        console.log('   3. Check for parsing errors or API errors');
        console.log('   4. The logs will show the exact error that caused the fallback');
      } else {
        console.log('✅ SUCCESS: All lessons are AI-generated!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testMineGeneration();
