/**
 * Detailed test of the Edge Function to see exactly what's happening
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  console.log('🔍 DETAILED EDGE FUNCTION TEST');
  console.log('================================\n');

  try {
    // Find student "Mine"
    console.log('📋 Step 1: Finding student "Mine"...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .ilike('name', '%Mine%')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ Could not find student "Mine"');
      return;
    }

    const student = students[0];
    console.log('✅ Found student:', student.name);
    console.log('   ID:', student.id);
    console.log('   Level:', student.level);
    console.log('   Language:', student.target_language);
    console.log('');

    // Find or create upcoming lesson
    console.log('📋 Step 2: Finding/creating upcoming lesson...');
    let { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .eq('status', 'upcoming')
      .order('created_at', { ascending: false })
      .limit(1);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    let lessonId;
    if (lessons && lessons.length > 0) {
      lessonId = lessons[0].id;
      console.log('✅ Found existing lesson:', lessonId);
      
      // Clear previous generated content to force regeneration
      console.log('   Clearing previous content...');
      await supabase
        .from('lessons')
        .update({
          generated_lessons: null,
          sub_topics: null
        })
        .eq('id', lessonId);
      console.log('   ✅ Cleared');
    } else {
      console.log('   Creating new lesson...');
      const { data: newLesson, error: createError } = await supabase
        .from('lessons')
        .insert({
          student_id: student.id,
          tutor_id: student.tutor_id,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming',
          materials: []
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating lesson:', createError);
        return;
      }

      lessonId = newLesson.id;
      console.log('   ✅ Created:', lessonId);
    }
    console.log('');

    // Call Edge Function
    console.log('📋 Step 3: Calling Edge Function...');
    console.log('   Endpoint:', `${supabaseUrl}/functions/v1/generate-lesson-plan`);
    console.log('   Lesson ID:', lessonId);
    console.log('   Starting generation...\n');

    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
      body: {
        lesson_id: lessonId
      }
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('❌ Edge Function Error:');
      console.error('   Message:', error.message);
      console.error('   Details:', JSON.stringify(error, null, 2));
      console.log('');
      console.log('💡 This error suggests:');
      if (error.message?.includes('GEMINI_API_KEY')) {
        console.log('   - GEMINI_API_KEY is not set in Edge Function secrets');
      } else if (error.message?.includes('404')) {
        console.log('   - The Gemini model endpoint is incorrect');
        console.log('   - The function may need to be redeployed');
      } else if (error.message?.includes('403')) {
        console.log('   - API key is invalid or not authorized');
      }
      return;
    }

    console.log(`✅ Edge Function completed in ${(duration / 1000).toFixed(2)}s`);
    console.log('');

    // Analyze response
    console.log('📋 Step 4: Analyzing Response...');
    console.log('   Success:', data.success);
    console.log('   Lessons count:', data.lessons?.length || 0);
    console.log('   Sub-topics count:', data.sub_topics?.length || 0);
    console.log('');

    if (data.lessons && data.lessons.length > 0) {
      console.log('📝 Lesson Analysis:');
      console.log('');
      
      data.lessons.forEach((lesson, index) => {
        const isPersonalized = lesson.title.toLowerCase().includes(student.name.toLowerCase());
        const isFallback = 
          lesson.title.includes('English Business English') ||
          lesson.title.includes('English Pronunciation') ||
          lesson.title.includes('English Conversation') ||
          lesson.title.includes('English Grammar') ||
          lesson.title.match(/^English \w+ for \w+$/);

        console.log(`   Lesson ${index + 1}:`);
        console.log(`   Title: "${lesson.title}"`);
        console.log(`   Personalized: ${isPersonalized ? '✅ YES' : '❌ NO'}`);
        console.log(`   Fallback detected: ${isFallback ? '⚠️  YES (PROBLEM!)' : '✅ NO'}`);
        console.log(`   Objectives: ${lesson.objectives?.length || 0}`);
        console.log(`   Activities: ${lesson.activities?.length || 0}`);
        console.log(`   Sub-topics: ${lesson.sub_topics?.length || 0}`);
        console.log('');
      });

      // Overall assessment
      const allFallback = data.lessons.every(lesson => 
        lesson.title.includes('English Business English') ||
        lesson.title.includes('English Pronunciation') ||
        lesson.title.includes('English Conversation') ||
        lesson.title.includes('English Grammar') ||
        lesson.title.match(/^English \w+ for \w+$/)
      );

      const allPersonalized = data.lessons.every(lesson => 
        lesson.title.toLowerCase().includes(student.name.toLowerCase())
      );

      console.log('================================');
      if (allFallback) {
        console.log('❌ PROBLEM: All lessons are using FALLBACK content');
        console.log('');
        console.log('🔍 Possible causes:');
        console.log('   1. Edge Function is not deployed with latest code');
        console.log('   2. GEMINI_API_KEY secret is not accessible');
        console.log('   3. Gemini API is returning errors');
        console.log('   4. Function is catching errors and falling back silently');
        console.log('');
        console.log('🔧 Next steps:');
        console.log('   1. Check Edge Function logs in Supabase Dashboard');
        console.log('   2. Redeploy the function: supabase functions deploy generate-lesson-plan');
        console.log('   3. Verify GEMINI_API_KEY is set in function secrets');
      } else if (allPersonalized) {
        console.log('✅ SUCCESS: All lessons are AI-generated and personalized!');
      } else {
        console.log('⚠️  MIXED: Some lessons are personalized, some are fallback');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testEdgeFunction();
