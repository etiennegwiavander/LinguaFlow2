const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseLessonSharingIssue() {
  console.log('🔍 DIAGNOSIS: Lesson Sharing Issue - "Share with Student" Link Cloning\n');
  console.log('=' .repeat(80));
  console.log('\nISSUE DESCRIPTION:');
  console.log('When a tutor generates 3 lessons and shares them:');
  console.log('- Sharing the OLDEST lesson shows the NEWEST lesson content');
  console.log('- The share link appears to "clone" the most recently generated lesson\n');
  console.log('=' .repeat(80));

  try {
    // Find a tutor with multiple lessons
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('id, name')
      .limit(1);

    if (tutorsError || !tutors || tutors.length === 0) {
      console.error('❌ No tutors found');
      return;
    }

    const tutor = tutors[0];
    console.log(`\n📝 Analyzing lessons for tutor: ${tutor.name} (${tutor.id})\n`);

    // Find students with multiple lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        created_at,
        student_id,
        interactive_lesson_content,
        student:students(name)
      `)
      .eq('tutor_id', tutor.id)
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (lessonsError || !lessons || lessons.length === 0) {
      console.error('❌ No lessons found for this tutor');
      return;
    }

    console.log(`Found ${lessons.length} lessons with interactive content\n`);
    console.log('=' .repeat(80));

    // Group lessons by student
    const lessonsByStudent = {};
    lessons.forEach(lesson => {
      const studentName = lesson.student?.name || 'Unknown';
      if (!lessonsByStudent[studentName]) {
        lessonsByStudent[studentName] = [];
      }
      lessonsByStudent[studentName].push(lesson);
    });

    // Analyze each student's lessons
    for (const [studentName, studentLessons] of Object.entries(lessonsByStudent)) {
      if (studentLessons.length < 2) continue; // Skip students with only 1 lesson

      console.log(`\n\n📚 STUDENT: ${studentName}`);
      console.log(`   Total lessons: ${studentLessons.length}`);
      console.log('-'.repeat(80));

      // Display lessons in chronological order
      studentLessons.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      studentLessons.forEach((lesson, index) => {
        const lessonNumber = index + 1;
        const createdDate = new Date(lesson.created_at);
        const content = lesson.interactive_lesson_content;
        const lessonTitle = content?.name || content?.selected_sub_topic?.title || 'Untitled';
        
        console.log(`\n   Lesson ${lessonNumber} (${lessonNumber === 1 ? 'OLDEST' : lessonNumber === studentLessons.length ? 'NEWEST' : 'MIDDLE'})`);
        console.log(`   ├─ Lesson ID: ${lesson.id}`);
        console.log(`   ├─ Created: ${createdDate.toLocaleString()}`);
        console.log(`   ├─ Title: ${lessonTitle}`);
        console.log(`   └─ Category: ${content?.category || content?.selected_sub_topic?.category || 'N/A'}`);
      });

      // Check shared_lessons table for these lessons
      console.log(`\n   🔗 SHARED LINKS FOR THIS STUDENT:`);
      console.log('   ' + '-'.repeat(76));

      const lessonIds = studentLessons.map(l => l.id);
      const { data: sharedLessons, error: sharedError } = await supabase
        .from('shared_lessons')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (sharedError) {
        console.log(`   ❌ Error fetching shared lessons: ${sharedError.message}`);
      } else if (!sharedLessons || sharedLessons.length === 0) {
        console.log(`   ℹ️  No shared links found for these lessons`);
      } else {
        console.log(`   Found ${sharedLessons.length} shared link(s):\n`);

        sharedLessons.forEach((shared, idx) => {
          const linkedLesson = studentLessons.find(l => l.id === shared.lesson_id);
          const lessonIndex = studentLessons.indexOf(linkedLesson);
          const lessonAge = lessonIndex === 0 ? 'OLDEST' : lessonIndex === studentLessons.length - 1 ? 'NEWEST' : 'MIDDLE';

          console.log(`   Share Link ${idx + 1}:`);
          console.log(`   ├─ Share ID: ${shared.id}`);
          console.log(`   ├─ Lesson ID: ${shared.lesson_id}`);
          console.log(`   ├─ Lesson Age: ${lessonAge} (Lesson ${lessonIndex + 1} of ${studentLessons.length})`);
          console.log(`   ├─ Lesson Title: ${shared.lesson_title}`);
          console.log(`   ├─ Created: ${new Date(shared.created_at).toLocaleString()}`);
          console.log(`   ├─ Active: ${shared.is_active ? 'Yes' : 'No'}`);
          console.log(`   └─ URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/shared-lesson/${shared.id}`);
          console.log('');
        });

        // CRITICAL ANALYSIS: Check if lesson_id matches correctly
        console.log(`   🔍 CRITICAL ANALYSIS:`);
        console.log('   ' + '-'.repeat(76));

        const oldestLesson = studentLessons[0];
        const newestLesson = studentLessons[studentLessons.length - 1];

        const oldestShared = sharedLessons.find(s => s.lesson_id === oldestLesson.id);
        const newestShared = sharedLessons.find(s => s.lesson_id === newestLesson.id);

        if (oldestShared) {
          console.log(`\n   ✅ OLDEST lesson (${oldestLesson.id}) HAS a share link`);
          console.log(`      Share ID: ${oldestShared.id}`);
          console.log(`      Stored lesson_id: ${oldestShared.lesson_id}`);
          console.log(`      Match: ${oldestShared.lesson_id === oldestLesson.id ? '✅ CORRECT' : '❌ MISMATCH!'}`);
        } else {
          console.log(`\n   ℹ️  OLDEST lesson (${oldestLesson.id}) has NO share link`);
        }

        if (newestShared) {
          console.log(`\n   ✅ NEWEST lesson (${newestLesson.id}) HAS a share link`);
          console.log(`      Share ID: ${newestShared.id}`);
          console.log(`      Stored lesson_id: ${newestShared.lesson_id}`);
          console.log(`      Match: ${newestShared.lesson_id === newestLesson.id ? '✅ CORRECT' : '❌ MISMATCH!'}`);
        } else {
          console.log(`\n   ℹ️  NEWEST lesson (${newestLesson.id}) has NO share link`);
        }

        // Check if there's a pattern of wrong lesson_id being stored
        console.log(`\n   🎯 PATTERN DETECTION:`);
        let allCorrect = true;
        sharedLessons.forEach(shared => {
          const linkedLesson = studentLessons.find(l => l.id === shared.lesson_id);
          if (!linkedLesson) {
            console.log(`   ❌ Share link ${shared.id} points to non-existent lesson ${shared.lesson_id}`);
            allCorrect = false;
          }
        });

        if (allCorrect) {
          console.log(`   ✅ All share links point to valid lessons in the database`);
          console.log(`   ℹ️  Issue may be in the FRONTEND display logic, not database storage`);
        }
      }
    }

    console.log('\n\n' + '=' .repeat(80));
    console.log('\n📊 DIAGNOSIS SUMMARY\n');
    console.log('=' .repeat(80));
    console.log('\nPOSSIBLE ROOT CAUSES:\n');
    console.log('1. ❓ Frontend State Issue:');
    console.log('   - The "lesson" object passed to handleShareLesson() might be stale');
    console.log('   - React state might not be updating correctly when switching between lessons');
    console.log('   - The lesson prop might be referencing the wrong lesson object\n');
    
    console.log('2. ❓ Component Re-render Issue:');
    console.log('   - LessonMaterialDisplay component might not be re-mounting');
    console.log('   - Props might not be updating when viewing different lessons');
    console.log('   - shareUrl state might be persisting across lesson changes\n');
    
    console.log('3. ❓ Lesson History Context Issue:');
    console.log('   - The lesson data from history might not be correctly passed');
    console.log('   - persistentLessonData state might be caching the wrong lesson\n');

    console.log('NEXT STEPS:\n');
    console.log('1. Check if lesson.id is correct when handleShareLesson() is called');
    console.log('2. Verify that LessonMaterialDisplay receives the correct lesson prop');
    console.log('3. Add console.log to track lesson.id changes in the component');
    console.log('4. Check if shareUrl state is being reset when switching lessons\n');

    console.log('=' .repeat(80));
    console.log('\n✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

diagnoseLessonSharingIssue();
