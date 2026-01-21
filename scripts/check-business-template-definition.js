const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusinessTemplateDefinition() {
  console.log('🔍 Checking Business Template Definitions\n');
  console.log('='.repeat(60));

  try {
    // Get business templates
    const { data: templates, error } = await supabase
      .from('lesson_templates')
      .select('id, name, category, template_json')
      .ilike('name', '%business%');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`✅ Found ${templates.length} business templates\n`);

    for (const template of templates) {
      console.log('='.repeat(50));
      console.log(`\n📋 Template: ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Category: ${template.category}`);

      const templateJson = typeof template.template_json === 'string'
        ? JSON.parse(template.template_json)
        : template.template_json;

      const sections = templateJson.sections || [];
      console.log(`\n   Total sections: ${sections.length}\n`);

      sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.type} - ${section.title || 'No title'}`);
        console.log(`      Content type: ${section.content_type || 'N/A'}`);
        console.log(`      AI placeholder: ${section.ai_placeholder || 'N/A'}`);

        // Check for business_examples
        if (section.content_type === 'business_examples' || section.type === 'business_examples') {
          console.log(`\n      🎯 BUSINESS EXAMPLES SECTION!`);
          
          if (section.business_examples) {
            console.log(`      Has ${section.business_examples.length} hardcoded examples:`);
            section.business_examples.forEach((ex, i) => {
              console.log(`         ${i + 1}. "${ex}"`);
            });
          }
          
          if (section.examples) {
            console.log(`      Has ${section.examples.length} hardcoded examples in 'examples' field:`);
            section.examples.forEach((ex, i) => {
              console.log(`         ${i + 1}. "${ex}"`);
            });
          }
        }

        // Check for conversation/dialogue sections
        if (section.content_type === 'full_dialogue' || section.type === 'conversation') {
          console.log(`\n      💬 DIALOGUE SECTION!`);
          
          if (section.dialogue_lines) {
            console.log(`      Has ${section.dialogue_lines.length} hardcoded dialogue lines`);
          }
          
          if (section.dialogues) {
            console.log(`      Has ${section.dialogues.length} hardcoded dialogues`);
          }
        }

        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

checkBusinessTemplateDefinition();
