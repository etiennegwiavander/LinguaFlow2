const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVocabularyTranslationMatch() {
  console.log('🧪 Testing vocabulary_translation_match content type...\n');

  try {
    // 1. Check the template
    const { data: template, error: templateError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Kids')
      .eq('level', 'b1')
      .single();

    if (templateError) {
      console.error('❌ Error fetching template:', templateError);
      return;
    }

    console.log('✅ Template found');
    
    // Find warm-up section
    const warmUpSection = template.template_json.sections.find(s => s.id === 'warm_up');
    
    if (!warmUpSection) {
      console.log('❌ Warm-up section not found!');
      return;
    }

    console.log('\n📋 Warm-up Section Details:');
    console.log('   Title:', warmUpSection.title);
    console.log('   Instruction:', warmUpSection.instruction);
    console.log('   Content Type:', warmUpSection.content_type);
    console.log('   AI Placeholder:', warmUpSection.ai_placeholder);

    if (warmUpSection.content_type === 'vocabulary_translation_match') {
      console.log('\n✅ Content type is correctly set to vocabulary_translation_match');
    } else {
      console.log('\n❌ Content type is NOT vocabulary_translation_match:', warmUpSection.content_type);
    }

    // 2. Check if there are any existing lessons with this template
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, lesson_plan')
      .eq('template_category', 'English for Kids')
      .eq('template_level', 'b1')
      .order('created_at', { ascending: false })
      .limit(1);

    if (lessonsError) {
      console.error('\n⚠️  Error fetching lessons:', lessonsError);
      return;
    }

    if (lessons && lessons.length > 0) {
      console.log('\n📚 Found existing lesson:', lessons[0].title);
      
      const lessonPlan = lessons[0].lesson_plan;
      if (lessonPlan && lessonPlan.sections) {
        const lessonWarmUp = lessonPlan.sections.find(s => s.id === 'warm_up');
        
        if (lessonWarmUp) {
          console.log('\n📝 Lesson Warm-up Section:');
          console.log('   Content Type:', lessonWarmUp.content_type);
          console.log('   Has Items:', lessonWarmUp.items ? lessonWarmUp.items.length : 0);
          console.log('   AI Placeholder:', lessonWarmUp.ai_placeholder);
          
          // Check if AI content exists
          const aiPlaceholder = lessonWarmUp.ai_placeholder;
          if (aiPlaceholder && lessonWarmUp[aiPlaceholder]) {
            console.log('   ✅ AI content found in:', aiPlaceholder);
            const content = lessonWarmUp[aiPlaceholder];
            if (Array.isArray(content)) {
              console.log('   📊 Content items:', content.length);
              if (content.length > 0) {
                console.log('   📄 Sample item:', JSON.stringify(content[0], null, 2));
              }
            }
          } else {
            console.log('   ⚠️  No AI content found');
          }
        }
      }
    } else {
      console.log('\n📝 No existing lessons found with this template');
      console.log('   Generate a new English for Kids B1 lesson to test the warm-up section');
    }

    console.log('\n✅ Test complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Generate a new English for Kids B1 lesson');
    console.log('   2. Check that the warm-up section displays vocabulary translation pairs');
    console.log('   3. Verify no "Content type ... will be displayed here" error appears');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testVocabularyTranslationMatch();
