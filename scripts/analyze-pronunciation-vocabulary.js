const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzePronunciationVocabulary() {
  console.log('🔍 DEEP ANALYSIS: Pronunciation Lesson Vocabulary Generation\n');
  console.log('=' .repeat(80));

  try {
    // Find a recent pronunciation lesson
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        *,
        students (
          name,
          level
        )
      `)
      .not('generated_lessons', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return;
    }

    // Find a pronunciation lesson
    let pronunciationLesson = null;
    for (const lesson of lessons) {
      if (lesson.generated_lessons && Array.isArray(lesson.generated_lessons)) {
        for (const genLesson of lesson.generated_lessons) {
          if (genLesson.sub_topics) {
            for (const subTopic of genLesson.sub_topics) {
              if (subTopic.category === 'Pronunciation' || 
                  subTopic.title?.toLowerCase().includes('pronunciation')) {
                pronunciationLesson = {
                  lesson,
                  generatedLesson: genLesson,
                  subTopic
                };
                break;
              }
            }
          }
          if (pronunciationLesson) break;
        }
      }
      if (pronunciationLesson) break;
    }

    if (!pronunciationLesson) {
      console.log('⚠️  No pronunciation lessons found in recent lessons');
      return;
    }

    const { lesson, generatedLesson, subTopic } = pronunciationLesson;

    console.log('\n📚 FOUND PRONUNCIATION LESSON');
    console.log('─'.repeat(80));
    console.log(`Student: ${lesson.students?.name || 'Unknown'}`);
    console.log(`Level: ${lesson.students?.level || 'Unknown'}`);
    console.log(`Lesson Title: ${generatedLesson.title}`);
    console.log(`Sub-topic: ${subTopic.title}`);
    console.log(`Category: ${subTopic.category}`);

    // Analyze the lesson structure
    console.log('\n📋 LESSON STRUCTURE ANALYSIS');
    console.log('─'.repeat(80));

    if (!subTopic.interactive_content || !subTopic.interactive_content.sections) {
      console.log('❌ No interactive_content.sections found');
      return;
    }

    const sections = subTopic.interactive_content.sections;
    console.log(`Total Sections: ${sections.length}\n`);

    // Find vocabulary sections
    const vocabularySections = sections.filter(s => 
      s.content_type === 'vocabulary_matching' || 
      s.id?.includes('vocabulary') ||
      s.id?.includes('word_list')
    );

    console.log(`\n🎯 VOCABULARY SECTIONS FOUND: ${vocabularySections.length}`);
    console.log('='.repeat(80));

    vocabularySections.forEach((section, index) => {
      console.log(`\n📖 VOCABULARY SECTION ${index + 1}`);
      console.log('─'.repeat(80));
      console.log(`ID: ${section.id}`);
      console.log(`Title: ${section.title}`);
      console.log(`Content Type: ${section.content_type}`);
      console.log(`AI Placeholder: ${section.ai_placeholder || 'N/A'}`);

      // Check for vocabulary_items
      if (section.vocabulary_items && Array.isArray(section.vocabulary_items)) {
        console.log(`\n✅ vocabulary_items array found: ${section.vocabulary_items.length} items`);
        
        section.vocabulary_items.forEach((item, itemIndex) => {
          console.log(`\n  📝 Word ${itemIndex + 1}: "${item.word}"`);
          console.log(`     Pronunciation: ${item.pronunciation || 'N/A'}`);
          console.log(`     Meaning: ${item.meaning || item.definition || 'N/A'}`);
          console.log(`     Part of Speech: ${item.part_of_speech || 'N/A'}`);
          
          if (item.examples && Array.isArray(item.examples)) {
            console.log(`     Example Sentences: ${item.examples.length}`);
            item.examples.forEach((ex, exIndex) => {
              console.log(`       ${exIndex + 1}. "${ex}"`);
              
              // Check if example is generic/fallback
              const isGeneric = 
                ex.includes('is an important concept in family relationships') ||
                ex.includes('helps with communication') ||
                ex.includes('has its own unique characteristics') ||
                ex.includes('requires mutual respect and understanding') ||
                ex.toLowerCase().includes('different types of');
              
              if (isGeneric) {
                console.log(`          ⚠️  GENERIC/FALLBACK SENTENCE DETECTED!`);
              }
            });
          } else {
            console.log(`     ❌ No examples array found`);
          }
        });
      } else {
        console.log(`\n❌ No vocabulary_items array found`);
        console.log(`   Available keys: ${Object.keys(section).join(', ')}`);
      }

      // Check for the placeholder field
      if (section.ai_placeholder && section[section.ai_placeholder]) {
        console.log(`\n📌 AI Placeholder Field "${section.ai_placeholder}": ${section[section.ai_placeholder]}`);
      }
    });

    // Check all sections for any vocabulary-related content
    console.log(`\n\n🔍 ALL SECTIONS OVERVIEW`);
    console.log('='.repeat(80));
    sections.forEach((section, index) => {
      console.log(`\n${index + 1}. ${section.title || section.id}`);
      console.log(`   ID: ${section.id}`);
      console.log(`   Type: ${section.content_type}`);
      console.log(`   Has vocabulary_items: ${section.vocabulary_items ? 'YES (' + section.vocabulary_items.length + ')' : 'NO'}`);
      console.log(`   Has examples: ${section.examples ? 'YES' : 'NO'}`);
      console.log(`   Keys: ${Object.keys(section).slice(0, 10).join(', ')}${Object.keys(section).length > 10 ? '...' : ''}`);
    });

    // Summary
    console.log(`\n\n📊 ANALYSIS SUMMARY`);
    console.log('='.repeat(80));
    console.log(`Total Sections: ${sections.length}`);
    console.log(`Vocabulary Sections: ${vocabularySections.length}`);
    
    const sectionsWithVocabItems = sections.filter(s => s.vocabulary_items && s.vocabulary_items.length > 0);
    console.log(`Sections with vocabulary_items: ${sectionsWithVocabItems.length}`);
    
    let totalWords = 0;
    let totalExamples = 0;
    let genericExamples = 0;
    
    sectionsWithVocabItems.forEach(section => {
      section.vocabulary_items.forEach(item => {
        totalWords++;
        if (item.examples && Array.isArray(item.examples)) {
          totalExamples += item.examples.length;
          item.examples.forEach(ex => {
            const isGeneric = 
              ex.includes('is an important concept in family relationships') ||
              ex.includes('helps with communication') ||
              ex.includes('has its own unique characteristics') ||
              ex.includes('requires mutual respect and understanding') ||
              ex.toLowerCase().includes('different types of');
            if (isGeneric) genericExamples++;
          });
        }
      });
    });
    
    console.log(`Total Vocabulary Words: ${totalWords}`);
    console.log(`Total Example Sentences: ${totalExamples}`);
    console.log(`Generic/Fallback Examples: ${genericExamples} (${totalExamples > 0 ? ((genericExamples/totalExamples)*100).toFixed(1) : 0}%)`);
    
    if (genericExamples > 0) {
      console.log(`\n⚠️  ISSUE CONFIRMED: Generic fallback sentences detected!`);
      console.log(`   These sentences don't use the actual vocabulary word in context.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

analyzePronunciationVocabulary();
