const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseSharedLessonCloning() {
  console.log('🔍 Diagnosing Shared Lesson Cloning Issue\n');
  console.log('='.repeat(60));

  try {
    // 1. Get all shared lessons
    console.log('\n📋 Step 1: Fetching all shared lessons...');
    const { data: sharedLessons, error: sharedError } = await supabase
      .from('shared_lessons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sharedError) {
      console.error('❌ Error fetching shared lessons:', sharedError);
      return;
    }

    console.log(`✅ Found ${sharedLessons.length} shared lessons\n`);

    // 2. For each shared lesson, check what lesson data it points to
    for (const shared of sharedLessons) {
      console.log('\n' + '-'.repeat(60));
      console.log(`\n🔗 Shared Lesson: ${shared.id}`);
      console.log(`   Student Name: ${shared.student_name}`);
      console.log(`   Lesson Title: ${shared.lesson_title}`);
      console.log(`   Lesson ID: ${shared.lesson_id}`);
      console.log(`   Created: ${shared.created_at}`);
      console.log(`   Active: ${shared.is_active}`);

      // Fetch the actual lesson data
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          created_at,
          interactive_lesson_content,
          student:students (
            id,
            name
          )
        `)
        .eq('id', shared.lesson_id)
        .single();

      if (lessonError) {
        console.error(`   ❌ Error fetching lesson: ${lessonError.message}`);
        continue;
      }

      console.log(`\n   📚 Actual Lesson Data:`);
      console.log(`      Lesson ID: ${lesson.id}`);
      console.log(`      Student: ${lesson.student?.name || 'Unknown'}`);
      console.log(`      Created: ${lesson.created_at}`);

      // Parse interactive content to check vocabulary
      if (lesson.interactive_lesson_content) {
        try {
          const content = typeof lesson.interactive_lesson_content === 'string'
            ? JSON.parse(lesson.interactive_lesson_content)
            : lesson.interactive_lesson_content;

          // Find vocabulary section
          const sections = content.template?.template_json?.sections || content.sections || [];
          const vocabSection = sections.find(s => s.type === 'vocabulary');

          if (vocabSection) {
            const vocabItems = vocabSection.vocabulary_items || [];
            console.log(`\n      📖 Vocabulary Section:`);
            console.log(`         Items Count: ${vocabItems.length}`);
            if (vocabItems.length > 0) {
              console.log(`         First Word: "${vocabItems[0].word}"`);
              console.log(`         Last Word: "${vocabItems[vocabItems.length - 1].word}"`);
            }
          } else {
            console.log(`\n      ⚠️  No vocabulary section found`);
          }
        } catch (e) {
          console.error(`      ❌ Error parsing content: ${e.message}`);
        }
      } else {
        console.log(`\n      ⚠️  No interactive_lesson_content`);
      }
    }

    // 3. Check if there are multiple shared lessons pointing to the same lesson_id
    console.log('\n\n' + '='.repeat(60));
    console.log('\n🔍 Checking for duplicate lesson_id references...\n');

    const lessonIdCounts = {};
    sharedLessons.forEach(shared => {
      lessonIdCounts[shared.lesson_id] = (lessonIdCounts[shared.lesson_id] || 0) + 1;
    });

    const duplicates = Object.entries(lessonIdCounts).filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Found shared lessons pointing to the same lesson:');
      for (const [lessonId, count] of duplicates) {
        console.log(`   Lesson ID: ${lessonId} (${count} shared links)`);
        
        const sharedForLesson = sharedLessons.filter(s => s.lesson_id === lessonId);
        sharedForLesson.forEach(s => {
          console.log(`      - Share ID: ${s.id}`);
          console.log(`        Title: ${s.lesson_title}`);
          console.log(`        Created: ${s.created_at}`);
        });
      }
    } else {
      console.log('✅ No duplicate lesson_id references found');
    }

    // 4. Test the actual query used by the shared lesson page
    console.log('\n\n' + '='.repeat(60));
    console.log('\n🧪 Testing Shared Lesson Page Query...\n');

    if (sharedLessons.length > 0) {
      const testShareId = sharedLessons[0].id;
      console.log(`Testing with share ID: ${testShareId}\n`);

      const { data: testData, error: testError } = await supabase
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
        .eq('id', testShareId)
        .single();

      if (testError) {
        console.error('❌ Query failed:', testError);
      } else {
        console.log('✅ Query successful');
        console.log(`   Shared Lesson ID: ${testData.id}`);
        console.log(`   Lesson ID from shared_lessons: ${testData.lesson_id}`);
        console.log(`   Lesson ID from joined data: ${testData.lesson?.id}`);
        console.log(`   Student Name: ${testData.lesson?.student?.name}`);
        
        if (testData.lesson_id !== testData.lesson?.id) {
          console.log('\n   ⚠️  MISMATCH DETECTED!');
          console.log(`   The lesson_id in shared_lessons (${testData.lesson_id})`);
          console.log(`   does NOT match the joined lesson data (${testData.lesson?.id})`);
        } else {
          console.log('\n   ✅ IDs match correctly');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Diagnosis complete!\n');
}

diagnoseSharedLessonCloning();
