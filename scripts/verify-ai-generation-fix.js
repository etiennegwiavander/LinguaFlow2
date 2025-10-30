/**
 * Verification script to confirm AI generation is working after fix
 * Run this AFTER setting GEMINI_API_KEY in Supabase Edge Function secrets
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

async function verifyAIGenerationFix() {
  console.log('🔍 VERIFYING AI GENERATION FIX');
  console.log('================================\n');

  try {
    // Step 1: Find a test student
    console.log('📋 Step 1: Finding a student for testing...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No students found. Please create a student first.');
      return;
    }

    const student = students[0];
    console.log('✅ Testing with student:', student.name);
    console.log('   Level:', student.level);
    console.log('   Language:', student.target_language);
    console.log('');

    // Step 2: Create a test lesson
    console.log('📋 Step 2: Creating test lesson...');
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
      console.error('❌ Error creating test lesson:', createError);
      return;
    }

    console.log('✅ Test lesson created:', newLesson.id);
    console.log('');

    // Step 3: Generate lesson plans
    console.log('📋 Step 3: Generating lesson plans with AI...');
    console.log('   This will take 15-30 seconds...');
    console.log('');

    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
      body: {
        lesson_id: newLesson.id
      }
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (error) {
      console.error('❌ Generation failed:', error);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Check if GEMINI_API_KEY is set in Edge Function secrets');
      console.log('   2. Check Edge Function logs in Supabase Dashboard');
      console.log('   3. Verify API key is valid: node scripts/test-gemini-api-direct.js');
      return;
    }

    console.log(`✅ Generation completed in ${duration} seconds`);
    console.log('');

    // Step 4: Analyze results
    console.log('📋 Step 4: Analyzing generated content...');
    console.log('');

    if (!data.success || !data.lessons || data.lessons.length === 0) {
      console.error('❌ No lessons generated');
      console.log('   Response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Generated', data.lessons.length, 'lesson plans');
    console.log('✅ Generated', data.sub_topics?.length || 0, 'sub-topics');
    console.log('');

    // Check each lesson for AI vs fallback patterns
    console.log('📝 LESSON QUALITY ANALYSIS:');
    console.log('================================\n');

    let aiGeneratedCount = 0;
    let fallbackCount = 0;

    data.lessons.forEach((lesson, index) => {
      const lessonNum = index + 1;
      const title = lesson.title;
      
      // Check for personalization (student name in title)
      const hasStudentName = title.toLowerCase().includes(student.name.toLowerCase());
      
      // Check for fallback patterns
      const fallbackPatterns = [
        `English Business English for ${student.name}`,
        `English Pronunciation for ${student.name}`,
        `English Conversation for ${student.name}`,
        `English Grammar for ${student.name}`,
        `English Vocabulary for ${student.name}`,
        'for Mine',
        'for Oana',
        'for Test'
      ];
      
      const isFallback = fallbackPatterns.some(pattern => 
        title.includes(pattern)
      );

      // Check for rich, descriptive content
      const hasRichDescription = lesson.objectives?.length >= 4 &&
                                 lesson.activities?.length >= 5 &&
                                 lesson.sub_topics?.length >= 6;

      const isAIGenerated = hasStudentName && !isFallback && hasRichDescription;

      if (isAIGenerated) {
        aiGeneratedCount++;
        console.log(`✅ Lesson ${lessonNum}: AI-GENERATED`);
      } else {
        fallbackCount++;
        console.log(`❌ Lesson ${lessonNum}: FALLBACK DETECTED`);
      }

      console.log(`   Title: ${title}`);
      console.log(`   Personalized: ${hasStudentName ? '✅' : '❌'}`);
      console.log(`   Fallback pattern: ${isFallback ? '⚠️  YES' : '✅ NO'}`);
      console.log(`   Rich content: ${hasRichDescription ? '✅' : '❌'}`);
      console.log(`   Objectives: ${lesson.objectives?.length || 0}`);
      console.log(`   Activities: ${lesson.activities?.length || 0}`);
      console.log(`   Sub-topics: ${lesson.sub_topics?.length || 0}`);
      console.log('');
    });

    // Final verdict
    console.log('================================');
    console.log('📊 FINAL RESULTS:');
    console.log('================================\n');
    console.log(`   AI-Generated Lessons: ${aiGeneratedCount}/5`);
    console.log(`   Fallback Lessons: ${fallbackCount}/5`);
    console.log('');

    if (aiGeneratedCount === 5) {
      console.log('🎉 SUCCESS! AI generation is working perfectly!');
      console.log('   All lessons are personalized and AI-generated.');
      console.log('');
      console.log('✅ The fix has been applied successfully.');
    } else if (aiGeneratedCount > 0) {
      console.log('⚠️  PARTIAL SUCCESS');
      console.log('   Some lessons are AI-generated, but not all.');
      console.log('   This might indicate:');
      console.log('   - Rate limiting issues');
      console.log('   - Intermittent API errors');
      console.log('   - Some fallback triggers in the code');
      console.log('');
      console.log('💡 Try generating again or check Edge Function logs.');
    } else {
      console.log('❌ ISSUE NOT FIXED');
      console.log('   All lessons are still using fallback content.');
      console.log('');
      console.log('🔧 Required actions:');
      console.log('   1. Verify GEMINI_API_KEY is set in Supabase Edge Function secrets');
      console.log('   2. Check Edge Function logs for errors');
      console.log('   3. Test API key locally: node scripts/test-gemini-api-direct.js');
      console.log('   4. Ensure function was redeployed after adding secret');
    }

    console.log('');

    // Step 5: Cleanup
    console.log('📋 Step 5: Cleaning up test lesson...');
    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', newLesson.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test lesson:', deleteError.message);
    } else {
      console.log('✅ Test lesson cleaned up');
    }

    console.log('');
    console.log('================================');
    console.log('✅ Verification complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('   Stack:', error.stack);
  }
}

verifyAIGenerationFix();
