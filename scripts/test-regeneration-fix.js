/**
 * Test Script: Verify regeneration fix
 * 
 * This script simulates the regeneration flow to verify that:
 * 1. First generation creates a new session
 * 2. Regeneration updates the existing session (no duplicate)
 * 3. Completion status persists correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRegenerationFix() {
  console.log('🧪 Testing regeneration fix...\n');

  try {
    // Get a test student
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('❌ No students found. Please create a student first.');
      return;
    }

    const student = students[0];
    console.log(`📝 Using test student: ${student.name} (${student.id.substring(0, 8)}...)\n`);

    // Get tutor
    const { data: tutors } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', student.tutor_id)
      .single();

    if (!tutors) {
      console.log('❌ Tutor not found');
      return;
    }

    // Test data
    const testSubTopic = {
      id: `test_lesson_subtopic1_${Date.now()}`,
      title: 'Test Regeneration Sub-Topic',
      category: 'Grammar',
      level: student.level,
      description: 'Testing regeneration fix'
    };

    const testLessonId = `test_lesson_${Date.now()}`;

    console.log('📊 Test Plan:');
    console.log('   1. Create initial lesson session');
    console.log('   2. Verify session created');
    console.log('   3. Regenerate with new sub_topic_id');
    console.log('   4. Verify session updated (not duplicated)');
    console.log('   5. Verify completion persists\n');

    // Step 1: Create initial session
    console.log('Step 1: Creating initial lesson session...');
    
    const { lessonHistoryService } = require('../lib/lesson-history-service');
    
    const sessionId1 = await lessonHistoryService.createLessonSession({
      student_id: student.id,
      tutor_id: student.tutor_id,
      lesson_id: testLessonId,
      sub_topic_id: testSubTopic.id,
      sub_topic_data: testSubTopic,
      interactive_content: { test: 'content1' },
      lesson_materials: { test: 'materials1' }
    });

    console.log(`   ✅ Session created: ${sessionId1.substring(0, 8)}...`);
    console.log(`   Sub-topic ID: ${testSubTopic.id}\n`);

    // Step 2: Verify session exists
    console.log('Step 2: Verifying session in database...');
    
    const { data: session1, error: error1 } = await supabase
      .from('lesson_sessions')
      .select('*')
      .eq('id', sessionId1)
      .single();

    if (error1 || !session1) {
      console.log('   ❌ Session not found in database');
      return;
    }

    console.log(`   ✅ Session found`);
    console.log(`   Sub-topic ID: ${session1.sub_topic_id}`);
    console.log(`   Created: ${new Date(session1.created_at).toLocaleString()}\n`);

    // Step 3: Simulate regeneration with new sub_topic_id
    console.log('Step 3: Regenerating with new sub_topic_id...');
    
    const newSubTopicId = `test_lesson_subtopic1_${Date.now() + 1000}`;
    const regeneratedSubTopic = {
      ...testSubTopic,
      id: newSubTopicId
    };

    const sessionId2 = await lessonHistoryService.createLessonSession({
      student_id: student.id,
      tutor_id: student.tutor_id,
      lesson_id: testLessonId,
      sub_topic_id: regeneratedSubTopic.id,
      sub_topic_data: regeneratedSubTopic,
      interactive_content: { test: 'content2' },
      lesson_materials: { test: 'materials2' }
    });

    console.log(`   ✅ Regeneration complete`);
    console.log(`   Returned session ID: ${sessionId2.substring(0, 8)}...`);
    console.log(`   New sub-topic ID: ${newSubTopicId}\n`);

    // Step 4: Verify no duplicate created
    console.log('Step 4: Checking for duplicates...');
    
    const { data: allSessions, error: error2 } = await supabase
      .from('lesson_sessions')
      .select('*')
      .eq('student_id', student.id)
      .eq('lesson_id', testLessonId);

    if (error2) {
      console.log('   ❌ Error querying sessions:', error2);
      return;
    }

    console.log(`   Found ${allSessions.length} session(s) for this lesson`);

    if (allSessions.length > 1) {
      console.log('   ❌ FAIL: Duplicate session created!');
      console.log('   Sessions:');
      allSessions.forEach((s, i) => {
        console.log(`      ${i + 1}. ID: ${s.id.substring(0, 8)}..., Sub-topic ID: ${s.sub_topic_id}`);
      });
      return;
    }

    if (sessionId1 !== sessionId2) {
      console.log('   ❌ FAIL: Different session IDs returned');
      console.log(`      Initial: ${sessionId1.substring(0, 8)}...`);
      console.log(`      Regenerated: ${sessionId2.substring(0, 8)}...`);
      return;
    }

    console.log('   ✅ PASS: No duplicate created');
    console.log(`   ✅ PASS: Same session ID returned (${sessionId1.substring(0, 8)}...)\n`);

    // Step 5: Verify completion persists
    console.log('Step 5: Verifying completion persistence...');
    
    const { data: progress, error: error3 } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', student.id)
      .eq('sub_topic_id', newSubTopicId);

    if (error3 || !progress || progress.length === 0) {
      console.log('   ❌ FAIL: Completion record not found for new sub_topic_id');
      return;
    }

    console.log('   ✅ PASS: Completion record found');
    console.log(`   Sub-topic ID: ${progress[0].sub_topic_id}`);
    console.log(`   Completion date: ${new Date(progress[0].completion_date).toLocaleString()}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    
    await supabase.from('student_progress').delete().eq('student_id', student.id).eq('sub_topic_id', newSubTopicId);
    await supabase.from('lesson_sessions').delete().eq('id', sessionId1);
    
    console.log('   ✅ Test data cleaned up\n');

    console.log('✅ ALL TESTS PASSED!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Initial session created correctly');
    console.log('   ✅ Regeneration updated existing session (no duplicate)');
    console.log('   ✅ Same session ID returned');
    console.log('   ✅ Completion record updated with new sub_topic_id');
    console.log('   ✅ Completion persists after regeneration');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testRegenerationFix();
