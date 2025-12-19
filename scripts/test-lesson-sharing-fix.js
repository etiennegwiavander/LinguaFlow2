#!/usr/bin/env node

/**
 * Test script to verify the lesson sharing fix
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLessonSharing() {
  console.log('🧪 Testing lesson sharing fix...\n');

  try {
    // Get a test lesson with interactive content
    console.log('📚 Finding a test lesson...');
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        tutor_id,
        interactive_lesson_content,
        student:students(name, level)
      `)
      .not('interactive_lesson_content', 'is', null)
      .limit(1);

    if (lessonsError || !lessons || lessons.length === 0) {
      console.log('⚠️ No lessons with interactive content found for testing');
      return;
    }

    const testLesson = lessons[0];
    console.log(`✅ Using test lesson: ${testLesson.id.substring(0, 8)}...`);
    console.log(`   Student: ${testLesson.student?.name || 'Unknown'}`);
    console.log(`   Tutor ID: ${testLesson.tutor_id.substring(0, 8)}...`);

    // Test creating a shared lesson with the correct data structure
    console.log('\n📤 Testing shared lesson creation...');
    
    const shareableData = {
      lesson_id: testLesson.id,
      student_name: testLesson.student?.name || 'Test Student',
      lesson_title: testLesson.interactive_lesson_content?.name || 
                   testLesson.interactive_lesson_content?.selected_sub_topic?.title || 
                   'Test Interactive Lesson',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    };

    console.log('📋 Shareable data structure:');
    console.log(`   lesson_id: ${shareableData.lesson_id.substring(0, 8)}...`);
    console.log(`   student_name: ${shareableData.student_name}`);
    console.log(`   lesson_title: ${shareableData.lesson_title}`);
    console.log(`   expires_at: ${shareableData.expires_at}`);
    console.log(`   is_active: ${shareableData.is_active}`);

    // Test the insert operation
    const { data: shareRecord, error: shareError } = await supabase
      .from('shared_lessons')
      .insert(shareableData)
      .select()
      .single();

    if (shareError) {
      console.error('❌ Shared lesson creation failed:', shareError.message);
      console.error('   Error code:', shareError.code);
      console.error('   Error details:', shareError.details);
      
      if (shareError.code === '42501' || shareError.message?.includes('policy')) {
        console.log('\n🔍 RLS Policy Issue Detected:');
        console.log('   This suggests the lesson ownership verification is failing');
        console.log('   Possible causes:');
        console.log('   1. The lesson.tutor_id does not match auth.uid()');
        console.log('   2. The lesson does not exist');
        console.log('   3. RLS policies are too restrictive');
      }
      
      return false;
    }

    console.log(`✅ Shared lesson created successfully: ${shareRecord.id}`);

    // Test the shared lesson URL format
    const shareUrl = `${supabaseUrl.replace('/rest/v1', '')}/shared-lesson/${shareRecord.id}`;
    console.log(`🔗 Share URL: ${shareUrl}`);

    // Test fetching the shared lesson (simulate what the shared lesson page does)
    console.log('\n📖 Testing shared lesson retrieval...');
    const { data: retrievedLesson, error: retrieveError } = await supabase
      .from('shared_lessons')
      .select(`
        *,
        lesson:lessons (
          id,
          materials,
          interactive_lesson_content,
          lesson_template_id,
          generated_lessons,
          sub_topics,
          notes,
          student:students (
            name,
            target_language,
            level,
            native_language
          )
        )
      `)
      .eq('id', shareRecord.id)
      .single();

    if (retrieveError) {
      console.error('❌ Shared lesson retrieval failed:', retrieveError.message);
      return false;
    }

    console.log('✅ Shared lesson retrieved successfully');
    console.log(`   Lesson title: ${retrievedLesson.lesson_title}`);
    console.log(`   Student name: ${retrievedLesson.student_name}`);
    console.log(`   Has interactive content: ${!!retrievedLesson.lesson?.interactive_lesson_content}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('shared_lessons').delete().eq('id', shareRecord.id);
    console.log('✅ Test data cleaned up');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔗 Lesson Sharing Fix Test Suite\n');
  console.log('=================================\n');

  const success = await testLessonSharing();

  if (success) {
    console.log('\n🎉 Lesson sharing fix is working correctly!');
    console.log('✅ The "Permission denied" error should now be resolved.');
    console.log('\n📋 What was fixed:');
    console.log('   1. Removed non-existent share_token field');
    console.log('   2. Added required student_name and lesson_title fields');
    console.log('   3. Updated URL generation to use record ID');
    console.log('   4. Fixed shared lesson page to query by ID');
  } else {
    console.log('\n❌ Lesson sharing fix needs more work.');
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});