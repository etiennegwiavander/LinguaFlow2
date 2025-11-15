require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSubtopicStructure() {
  console.log('🔍 Diagnosing English for Travel Subtopic Structure\n');

  try {
    // Find recent lessons with English for Travel
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .not('generated_lessons', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching lessons:', error);
      return;
    }

    console.log(`📋 Found ${lessons.length} recent lessons with generated content\n`);

    for (const lesson of lessons) {
      if (!lesson.generated_lessons || lesson.generated_lessons.length === 0) continue;

      // Check each generated lesson
      for (const genLesson of lesson.generated_lessons) {
        if (!genLesson.sub_topics) continue;

        // Look for English for Travel subtopics
        const travelSubtopics = genLesson.sub_topics.filter(st => 
          st.category && st.category.toLowerCase().includes('travel')
        );

        if (travelSubtopics.length > 0) {
          console.log('✅ Found English for Travel lesson!');
          console.log(`   Lesson ID: ${lesson.id}`);
          console.log(`   Lesson Title: ${genLesson.title || 'N/A'}`);
          console.log(`   Number of travel subtopics: ${travelSubtopics.length}\n`);

          travelSubtopics.forEach((st, index) => {
            console.log(`   📌 Subtopic ${index + 1}:`);
            console.log(`      ID: ${st.id || 'MISSING'}`);
            console.log(`      Title: ${st.title || 'MISSING'}`);
            console.log(`      Category: "${st.category || 'MISSING'}"`);
            console.log(`      Level: "${st.level || 'MISSING ⚠️'}"` );
            console.log(`      Description: ${st.description ? st.description.substring(0, 100) + '...' : 'MISSING'}`);
            console.log('');
          });

          // Check if interactive content was generated
          if (lesson.interactive_lesson_content) {
            console.log('   📝 Interactive Content Status:');
            console.log(`      Has content: ${!!lesson.interactive_lesson_content}`);
            console.log(`      Selected subtopic: ${lesson.interactive_lesson_content.selected_sub_topic?.title || 'N/A'}`);
            console.log(`      Selected subtopic level: ${lesson.interactive_lesson_content.selected_sub_topic?.level || 'MISSING ⚠️'}`);
            console.log('');
          }

          return; // Found one, that's enough
        }
      }
    }

    console.log('❌ No English for Travel lessons found in recent lessons');
    console.log('   Try generating a new lesson with English for Travel category');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseSubtopicStructure();
