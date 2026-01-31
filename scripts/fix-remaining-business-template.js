const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRemainingBusinessTemplate() {
  console.log('🔧 FIXING REMAINING BUSINESS ENGLISH TEMPLATE\n');
  console.log('='.repeat(80));

  const templateId = '5dfc64f3-a4d2-4adf-b1bd-ffb4b540aedd';

  // Fetch the template
  const { data: template, error: fetchError } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError) {
    console.error('❌ Error fetching template:', fetchError);
    return;
  }

  console.log(`\n📋 Template: ${template.name}`);
  console.log(`   Level: ${template.level}`);
  console.log(`   ID: ${template.id}`);

  // Get the template_json
  const templateJson = template.template_json;

  if (!templateJson || !templateJson.sections) {
    console.log('❌ No sections found in template');
    return;
  }

  // Transform vocabulary sections
  const updatedSections = templateJson.sections.map(section => {
    if (section.content_type === 'vocabulary_matching' && section.vocabulary_items) {
      console.log(`\n🔄 Transforming section: ${section.title}`);
      console.log(`   Original items: ${section.vocabulary_items.length}`);

      // Transform each vocabulary item
      const transformedItems = section.vocabulary_items.map(item => {
        const transformed = {
          word: item.name || item.word || 'Unknown',
          definition: item.prompt || item.definition || 'No definition',
          part_of_speech: item.part_of_speech || 'noun',
          examples: []
        };

        console.log(`   ✅ Transformed: "${item.name}" → "${transformed.word}"`);
        return transformed;
      });

      // Return section with empty vocabulary_items (let AI generate fresh content)
      return {
        ...section,
        vocabulary_items: [] // Empty array - AI will generate fresh content
      };
    }
    return section;
  });

  // Update the template
  const updatedTemplateJson = {
    ...templateJson,
    sections: updatedSections
  };

  console.log('\n💾 Updating template in database...');

  const { error: updateError } = await supabase
    .from('lesson_templates')
    .update({ template_json: updatedTemplateJson })
    .eq('id', templateId);

  if (updateError) {
    console.error('❌ Error updating template:', updateError);
    return;
  }

  console.log('✅ Template updated successfully!');

  // Verify the update
  const { data: verifyTemplate } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (verifyTemplate) {
    const vocabSection = verifyTemplate.template_json.sections.find(s => 
      s.content_type === 'vocabulary_matching'
    );

    if (vocabSection) {
      console.log('\n🔍 VERIFICATION:');
      console.log(`   Vocabulary items count: ${vocabSection.vocabulary_items?.length || 0}`);
      
      if (vocabSection.vocabulary_items?.length === 0) {
        console.log('   ✅ Vocabulary items array is now empty (AI will generate fresh content)');
      } else if (vocabSection.vocabulary_items?.length > 0) {
        const sampleItem = vocabSection.vocabulary_items[0];
        const hasOldStructure = sampleItem.name || sampleItem.prompt;
        
        if (hasOldStructure) {
          console.log('   ❌ Still has old structure!');
        } else {
          console.log('   ✅ Has correct structure!');
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ FIX COMPLETE!');
  console.log('   The template now has an empty vocabulary_items array.');
  console.log('   The AI will generate fresh vocabulary with correct structure.');
}

fixRemainingBusinessTemplate().catch(console.error);
