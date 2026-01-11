const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findVocabularySections() {
  console.log('🔍 Searching for lessons with vocabulary sections...\n');

  try {
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        *,
        students (
          name,
          level
        )
      `)
      .not('generated_lessons', 'is', null)
      .order('created_at', { ascending: false})
      .limit(100);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${lessons.length} lessons with generated content\n`);

    let foundVocabSection = false;

    for (const lesson of lessons) {
      if (!lesson.generated_lessons || !Array.isArray(lesson.generated_lessons)) continue;

      for (const genLesson of lesson.generated_lessons) {
        if (!genLesson.sub_topics || !Array.isArray(genLesson.sub_topics)) continue;

        for (const subTopic of genLesson.sub_topics) {
          if (!subTopic.interactive_content || !subTopic.interactive_content.sections) continue;

          const sections = subTopic.interactive_content.sections;
          const vocabSections = sections.filter(s => 
            s.content_type === 'vocabulary_matching' ||
            s.content_type === 'vocabulary_section' ||
            (s.vocabulary_items && s.vocabulary_items.length > 0)
          );

          if (vocabSections.length > 0) {
            console.log(`\n✅ FOUND LESSON WITH VOCABULARY`);
            console.log(`Student: ${lesson.students?.name}`);
            console.log(`Level: ${lesson.students?.level}`);
            console.log(`Lesson: ${genLesson.title}`);
            console.log(`Sub-topic: ${subTopic.title}`);
            console.log(`Category: ${subTopic.category}`);
            console.log(`Vocabulary Sections: ${vocabSections.length}`);

            vocabSections.forEach((section, idx) => {
              console.log(`\n  Section ${idx + 1}: ${section.title}`);
              console.log(`  ID: ${section.id}`);
              console.log(`  Content Type: ${section.content_type}`);
              
              if (section.vocabulary_items) {
                console.log(`  Vocabulary Items: ${section.vocabulary_items.length}`);
                
                // Show first vocabulary item as example
                if (section.vocabulary_items[0]) {
                  const item = section.vocabulary_items[0];
                  console.log(`\n  Example Word: "${item.word}"`);
                  if (item.examples && item.examples[0]) {
                    console.log(`  First Example: "${item.examples[0]}"`);
                    
                    // Check if generic
                    const isGeneric = 
                      item.examples[0].includes('is an important concept') ||
                      item.examples[0].includes('helps with communication') ||
                      item.examples[0].includes('has its own unique characteristics');
                    
                    if (isGeneric) {
                      console.log(`  ⚠️  GENERIC SENTENCE DETECTED!`);
                    }
                  }
                }
              }
            });

            foundVocabSection = true;
            
            // Only show first 3 examples
            if (foundVocabSection) {
              const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
              });
              
              await new Promise(resolve => {
                readline.question('\nPress Enter to see next example (or Ctrl+C to stop)...', () => {
                  readline.close();
                  resolve();
                });
              });
            }
          }
        }
      }
    }

    if (!foundVocabSection) {
      console.log('❌ No lessons with vocabulary sections found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

findVocabularySections();
