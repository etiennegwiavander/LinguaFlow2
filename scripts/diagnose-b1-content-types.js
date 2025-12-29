require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseB1ContentTypes() {
  console.log('🔍 Diagnosing B1 Content Type Issues...');
  console.log('='.repeat(80));

  try {
    // Get the B1 template
    const { data: template, error: templateError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Kids')
      .eq('level', 'b1')
      .single();

    if (templateError) {
      console.error('❌ Error fetching B1 template:', templateError.message);
      return;
    }

    console.log('\n📋 B1 Template Sections:');
    console.log(`   Template: ${template.name}`);
    console.log(`   Total Sections: ${template.template_json.sections.length}`);

    // Analyze each section
    const unsupportedContentTypes = [];
    const supportedContentTypes = ['list', 'text', 'grammar_explanation', 'example_sentences', 'vocabulary_matching', 'vocabulary', 'full_dialogue', 'matching', 'fill_in_the_blanks_dialogue'];

    template.template_json.sections.forEach((section, index) => {
      const contentType = section.content_type || 'none';
      const isSupported = supportedContentTypes.includes(contentType);
      
      console.log(`\n   ${index + 1}. ${section.title || section.id}`);
      console.log(`      Type: ${section.type}`);
      console.log(`      Content Type: ${contentType}`);
      console.log(`      AI Placeholder: ${section.ai_placeholder || 'none'}`);
      console.log(`      Status: ${isSupported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'}`);

      if (!isSupported && contentType !== 'none' && section.type === 'exercise') {
        unsupportedContentTypes.push({
          section: section.title || section.id,
          contentType: contentType,
          aiPlaceholder: section.ai_placeholder
        });
      }
    });

    if (unsupportedContentTypes.length > 0) {
      console.log('\n\n⚠️  UNSUPPORTED CONTENT TYPES FOUND:');
      console.log('='.repeat(80));
      unsupportedContentTypes.forEach((item, index) => {
        console.log(`\n${index + 1}. Section: "${item.section}"`);
        console.log(`   Content Type: "${item.contentType}"`);
        console.log(`   AI Placeholder: "${item.aiPlaceholder}"`);
        console.log(`   Issue: LessonMaterialDisplay.tsx does not have a case for this content type`);
      });

      console.log('\n\n💡 SOLUTION:');
      console.log('='.repeat(80));
      console.log('These content types need to be added to the switch statement in:');
      console.log('components/lessons/LessonMaterialDisplay.tsx');
      console.log('\nMissing content types:');
      const uniqueTypes = [...new Set(unsupportedContentTypes.map(item => item.contentType))];
      uniqueTypes.forEach(type => {
        console.log(`   - ${type}`);
      });

      console.log('\n\n📝 RECOMMENDED APPROACH:');
      console.log('='.repeat(80));
      console.log('Option 1: Map unsupported types to existing supported types');
      console.log('   - drawing_tool_match → list');
      console.log('   - listen_repeat → list');
      console.log('   - audio_picture_choice → list');
      console.log('   - say_what_you_see → list');
      console.log('   - complete_sentence → list');
      console.log('   - answer_questions → list');
      console.log('\nOption 2: Implement custom rendering for each content type');
      console.log('   - Add new case statements in the switch block');
      console.log('   - Create specialized UI for each activity type');
    } else {
      console.log('\n\n✅ All content types are supported!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Diagnosis complete!\n');
}

diagnoseB1ContentTypes().catch(console.error);
