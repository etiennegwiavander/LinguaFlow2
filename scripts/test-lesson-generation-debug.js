/**
 * Debug script to test lesson generation and identify why AI is falling back
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

async function testLessonGeneration() {
  console.log('🔍 DEBUGGING LESSON GENERATION');
  console.log('================================\n');

  try {
    // Step 1: Find a student named "Mine"
    console.log('📋 Step 1: Finding student "Mine"...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .ilike('name', '%Mine%')
      .limit(1);

    if (studentsError) {
      console.error('❌ Error fetching student:', studentsError);
      return;
    }

    if (!students || students.length === 0) {
      console.log('⚠️  No student named "Mine" found. Fetching any student...');
      const { data: anyStudent, error: anyError } = await supabase
        .from('students')
        .select('*')
        .limit(1);
      
      if (anyError || !anyStudent || anyStudent.length === 0) {
        console.error('❌ No students found in database');
        return;
      }
      students.push(anyStudent[0]);
    }

    const student = students[0];
    console.log('✅ Found student:', student.name);
    console.log('   Level:', student.level);
    console.log('   Language:', student.target_language);
    console.log('   Age Group:', student.age_group || 'not set');
    console.log('   Goals:', student.end_goals || 'not set');
    console.log('   Weaknesses:', student.grammar_weaknesses || 'not set');
    console.log('');

    // Step 2: Find or create an upcoming lesson
    console.log('📋 Step 2: Finding upcoming lesson...');
    const { data: lessons, error: lessonsError } = await supabase
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
    } else {
      console.log('⚠️  No upcoming lesson found, creating one...');
      const { data: newLesson, error: createError } = await supabase
        .from('lessons')
        .insert({
          student_id: student.id,
          tutor_id: student.tutor_id,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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
      console.log('✅ Created new lesson:', lessonId);
    }
    console.log('');

    // Step 3: Call the Edge Function
    console.log('📋 Step 3: Calling generate-lesson-plan Edge Function...');
    console.log('   Endpoint:', `${supabaseUrl}/functions/v1/generate-lesson-plan`);
    console.log('   Lesson ID:', lessonId);
    console.log('');

    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
      body: {
        lesson_id: lessonId
      }
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('❌ Edge Function Error:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log(`✅ Edge Function completed in ${duration}ms`);
    console.log('');

    // Step 4: Analyze the response
    console.log('📋 Step 4: Analyzing response...');
    console.log('   Success:', data.success);
    console.log('   Lessons generated:', data.lessons?.length || 0);
    console.log('   Sub-topics generated:', data.sub_topics?.length || 0);
    console.log('');

    if (data.lessons && data.lessons.length > 0) {
      console.log('📝 First Lesson Analysis:');
      const firstLesson = data.lessons[0];
      console.log('   Title:', firstLesson.title);
      console.log('   Objectives:', firstLesson.objectives?.length || 0);
      console.log('   Activities:', firstLesson.activities?.length || 0);
      console.log('   Sub-topics:', firstLesson.sub_topics?.length || 0);
      console.log('');

      // Check if it's AI-generated or fallback
      const isPersonalized = firstLesson.title.includes(student.name);
      const isFallback = firstLesson.title.includes('for Mine') || 
                        firstLesson.title.includes('English Business English') ||
                        firstLesson.title.includes('English Pronunciation') ||
                        firstLesson.title.includes('English Conversation') ||
                        firstLesson.title.includes('English Grammar');

      console.log('🤖 Generation Type Analysis:');
      console.log('   Personalized (contains student name):', isPersonalized ? '✅ YES' : '❌ NO');
      console.log('   Fallback pattern detected:', isFallback ? '⚠️  YES (PROBLEM!)' : '✅ NO');
      console.log('');

      if (isFallback) {
        console.log('⚠️  ISSUE DETECTED: Fallback content is being used!');
        console.log('   This means the AI generation is failing.');
        console.log('   Possible causes:');
        console.log('   1. GEMINI_API_KEY not set in Supabase Edge Function secrets');
        console.log('   2. API key is invalid or expired');
        console.log('   3. Rate limiting or API errors');
        console.log('   4. Network issues reaching Gemini API');
        console.log('');
        console.log('💡 Next steps:');
        console.log('   1. Check Supabase Dashboard > Edge Functions > Secrets');
        console.log('   2. Verify GEMINI_API_KEY is set correctly');
        console.log('   3. Check Edge Function logs for errors');
      } else {
        console.log('✅ AI generation appears to be working correctly!');
      }
      console.log('');

      // Show all lesson titles
      console.log('📚 All Generated Lesson Titles:');
      data.lessons.forEach((lesson, index) => {
        console.log(`   ${index + 1}. ${lesson.title}`);
      });
    }

    console.log('');
    console.log('================================');
    console.log('✅ Debug test completed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testLessonGeneration();
