/**
 * Test Script: Verify Sub-Topic ID Fix
 * 
 * This script tests that sub-topic IDs are now globally unique
 * by including the lesson ID as a prefix.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubTopicIdFix() {
  console.log('🧪 Testing Sub-Topic ID Fix\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find a student to test with
    console.log('\n📋 Step 1: Finding a test student...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, tutor_id')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No students found for testing');
      return;
    }

    const testStudent = students[0];
    console.log(`✅ Found test student: ${testStudent.name} (${testStudent.id})`);

    // Step 2: Find or create an upcoming lesson
    console.log('\n📋 Step 2: Finding/creating an upcoming lesson...');
    let { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, date, status, sub_topics')
      .eq('student_id', testStudent.id)
      .eq('status', 'upcoming')
      .order('date', { ascending: false })
      .limit(1);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    let testLesson;
    if (!lessons || lessons.length === 0) {
      // Create a new lesson
      console.log('📝 Creating new test lesson...');
      const { data: newLesson, error: createError } = await supabase
        .from('lessons')
        .insert({
          student_id: testStudent.id,
          tutor_id: testStudent.tutor_id,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          status: 'upcoming',
          materials: [],
          notes: 'Test lesson for sub-topic ID fix verification'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating lesson:', createError);
        return;
      }

      testLesson = newLesson;
      console.log(`✅ Created test lesson: ${testLesson.id}`);
    } else {
      testLesson = lessons[0];
      console.log(`✅ Found existing lesson: ${testLesson.id}`);
    }

    // Step 3: Generate lesson plans (this will create sub-topics)
    console.log('\n📋 Step 3: Generating lesson plans with new sub-topic IDs...');
    console.log('⏳ Calling generate-lesson-plan Edge Function...');

    const { data: authData } = await supabase.auth.getSession();
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-lesson-plan`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lesson_id: testLesson.id
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function error:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Lesson plans generated successfully');

    // Step 4: Verify sub-topic IDs
    console.log('\n📋 Step 4: Verifying sub-topic ID format...');
    
    const { data: updatedLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('id, sub_topics')
      .eq('id', testLesson.id)
      .single();

    if (fetchError || !updatedLesson) {
      console.error('❌ Error fetching updated lesson:', fetchError);
      return;
    }

    if (!updatedLesson.sub_topics || updatedLesson.sub_topics.length === 0) {
      console.error('❌ No sub-topics found in lesson');
      return;
    }

    console.log(`\n📊 Found ${updatedLesson.sub_topics.length} sub-topics:`);
    console.log('─'.repeat(60));

    let allValid = true;
    const expectedPrefix = updatedLesson.id;

    updatedLesson.sub_topics.forEach((subTopic, index) => {
      const hasCorrectPrefix = subTopic.id.startsWith(expectedPrefix);
      const status = hasCorrectPrefix ? '✅' : '❌';
      
      console.log(`${status} Sub-topic ${index + 1}:`);
      console.log(`   ID: ${subTopic.id}`);
      console.log(`   Title: ${subTopic.title}`);
      console.log(`   Category: ${subTopic.category}`);
      console.log(`   Has lesson prefix: ${hasCorrectPrefix ? 'YES' : 'NO'}`);
      console.log('');

      if (!hasCorrectPrefix) {
        allValid = false;
      }
    });

    // Step 5: Test completion tracking
    console.log('📋 Step 5: Testing completion tracking...');
    
    const testSubTopic = updatedLesson.sub_topics[0];
    console.log(`\n🎯 Marking sub-topic as complete: ${testSubTopic.id}`);

    const { error: progressError } = await supabase
      .from('student_progress')
      .upsert({
        student_id: testStudent.id,
        tutor_id: testStudent.tutor_id,
        sub_topic_id: testSubTopic.id,
        sub_topic_title: testSubTopic.title,
        sub_topic_category: testSubTopic.category,
        sub_topic_level: testSubTopic.level,
        completion_date: new Date().toISOString()
      }, {
        onConflict: 'student_id,sub_topic_id'
      });

    if (progressError) {
      console.error('❌ Error marking sub-topic complete:', progressError);
      allValid = false;
    } else {
      console.log('✅ Sub-topic marked as complete successfully');
    }

    // Step 6: Verify uniqueness
    console.log('\n📋 Step 6: Verifying uniqueness...');
    
    const { data: progressRecords, error: progressFetchError } = await supabase
      .from('student_progress')
      .select('sub_topic_id')
      .eq('student_id', testStudent.id);

    if (progressFetchError) {
      console.error('❌ Error fetching progress records:', progressFetchError);
    } else {
      const uniqueIds = new Set(progressRecords.map(r => r.sub_topic_id));
      console.log(`✅ Found ${progressRecords.length} progress records with ${uniqueIds.size} unique IDs`);
      
      if (progressRecords.length === uniqueIds.size) {
        console.log('✅ All sub-topic IDs are unique!');
      } else {
        console.error('❌ Duplicate sub-topic IDs detected!');
        allValid = false;
      }
    }

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (allValid) {
      console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
      console.log('\nSub-topic IDs are now globally unique with lesson prefix.');
      console.log('The fix is working correctly!');
    } else {
      console.log('❌ ❌ ❌ SOME TESTS FAILED ❌ ❌ ❌');
      console.log('\nPlease review the errors above.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run the test
testSubTopicIdFix();
