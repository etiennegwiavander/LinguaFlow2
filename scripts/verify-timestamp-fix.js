/**
 * Verification Script: Timestamp Fix
 * 
 * This script verifies that the timestamp fix is working correctly
 * and checks if completion status is properly scoped.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTimestampFix() {
  console.log('🔍 Verifying Timestamp Fix\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Check recent lessons
    console.log('\n📋 Step 1: Checking recent lessons...');
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, student_id, sub_topics, created_at, updated_at')
      .not('sub_topics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lessonsError || !lessons || lessons.length === 0) {
      console.error('❌ No lessons found');
      return;
    }

    console.log(`✅ Found ${lessons.length} recent lessons\n`);

    // Step 2: Analyze sub-topic ID formats
    for (const lesson of lessons) {
      console.log('─'.repeat(70));
      console.log(`\n📚 Lesson: ${lesson.id.substring(0, 8)}...`);
      console.log(`   Created: ${new Date(lesson.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(lesson.updated_at).toLocaleString()}`);
      console.log(`   Sub-topics: ${lesson.sub_topics.length}`);

      // Analyze ID format
      const subTopicIds = lesson.sub_topics.map(st => st.id);
      const hasTimestamp = subTopicIds[0].match(/_\d{13}_/);
      
      console.log(`\n   ID Format Analysis:`);
      console.log(`   Has timestamp: ${hasTimestamp ? '✅ YES' : '❌ NO'}`);
      
      if (hasTimestamp) {
        // Extract timestamps from all sub-topics
        const timestamps = subTopicIds.map(id => {
          const match = id.match(/_(\d{13})_/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        const uniqueTimestamps = [...new Set(timestamps)];
        
        console.log(`   Timestamps found: ${uniqueTimestamps.length}`);
        console.log(`   All same timestamp: ${uniqueTimestamps.length === 1 ? '✅ YES' : '❌ NO'}`);
        
        if (uniqueTimestamps.length === 1) {
          const timestamp = parseInt(uniqueTimestamps[0]);
          const date = new Date(timestamp);
          console.log(`   Generation time: ${date.toLocaleString()}`);
        }
        
        console.log(`\n   Sample IDs:`);
        subTopicIds.slice(0, 3).forEach((id, idx) => {
          console.log(`   ${idx + 1}. ${id.substring(0, 60)}...`);
        });
      } else {
        console.log(`   ⚠️  OLD FORMAT (no timestamp)`);
        console.log(`   Sample ID: ${subTopicIds[0]}`);
      }
    }

    // Step 3: Check completion records
    console.log('\n' + '─'.repeat(70));
    console.log('\n📋 Step 3: Checking completion records...\n');
    
    const { data: progressRecords } = await supabase
      .from('student_progress')
      .select('sub_topic_id, sub_topic_title, completion_date')
      .order('completion_date', { ascending: false })
      .limit(10);

    if (progressRecords && progressRecords.length > 0) {
      console.log(`Found ${progressRecords.length} recent completions:\n`);
      
      progressRecords.forEach((record, idx) => {
        const hasTimestamp = record.sub_topic_id.match(/_\d{13}_/);
        const format = hasTimestamp ? 'NEW (with timestamp)' : 'OLD (no timestamp)';
        
        console.log(`${idx + 1}. ${record.sub_topic_title || 'Untitled'}`);
        console.log(`   ID: ${record.sub_topic_id.substring(0, 60)}...`);
        console.log(`   Format: ${format}`);
        console.log(`   Completed: ${new Date(record.completion_date).toLocaleString()}`);
        console.log('');
      });
    }

    // Step 4: Test for collisions
    console.log('─'.repeat(70));
    console.log('\n📋 Step 4: Testing for potential collisions...\n');
    
    // Group lessons by student
    const lessonsByStudent = {};
    lessons.forEach(lesson => {
      if (!lessonsByStudent[lesson.student_id]) {
        lessonsByStudent[lesson.student_id] = [];
      }
      lessonsByStudent[lesson.student_id].push(lesson);
    });

    let collisionFound = false;

    for (const [studentId, studentLessons] of Object.entries(lessonsByStudent)) {
      if (studentLessons.length < 2) continue;

      console.log(`👤 Student: ${studentId.substring(0, 8)}...`);
      console.log(`   Lessons: ${studentLessons.length}\n`);

      // Check if any sub-topic IDs are duplicated across lessons
      const allSubTopicIds = [];
      studentLessons.forEach(lesson => {
        lesson.sub_topics.forEach(st => {
          allSubTopicIds.push({ id: st.id, lessonId: lesson.id });
        });
      });

      const idCounts = {};
      allSubTopicIds.forEach(({ id }) => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });

      const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1);

      if (duplicates.length > 0) {
        console.log(`   ⚠️  COLLISION DETECTED!`);
        console.log(`   ${duplicates.length} duplicate sub-topic IDs found:`);
        duplicates.forEach(([id, count]) => {
          console.log(`   - ${id.substring(0, 50)}... (appears ${count} times)`);
        });
        collisionFound = true;
      } else {
        console.log(`   ✅ No collisions - all sub-topic IDs are unique`);
      }
      console.log('');
    }

    // Step 5: Summary
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY\n');

    const newFormatLessons = lessons.filter(l => 
      l.sub_topics[0].id.match(/_\d{13}_/)
    ).length;

    const oldFormatLessons = lessons.length - newFormatLessons;

    console.log(`Recent lessons analyzed: ${lessons.length}`);
    console.log(`New format (with timestamp): ${newFormatLessons}`);
    console.log(`Old format (no timestamp): ${oldFormatLessons}`);
    console.log(`Collisions detected: ${collisionFound ? '❌ YES' : '✅ NO'}`);

    if (newFormatLessons > 0 && !collisionFound) {
      console.log(`\n✅ TIMESTAMP FIX IS WORKING!`);
      console.log(`   New lessons have unique timestamps`);
      console.log(`   No ID collisions detected`);
    } else if (collisionFound) {
      console.log(`\n⚠️  COLLISIONS STILL PRESENT`);
      console.log(`   The timestamp fix may not be fully deployed`);
    } else {
      console.log(`\n⚠️  NO NEW FORMAT LESSONS FOUND`);
      console.log(`   Generate a new lesson to test the fix`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
  }
}

// Run the verification
verifyTimestampFix();
