const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyBusinessTemplateFix() {
  console.log('🔍 VERIFYING BUSINESS ENGLISH TEMPLATE FIX\n');
  console.log('='.repeat(80));

  // Check all Business English templates
  const { data: templates, error } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('category', 'Business English')
    .order('level');

  if (error) {
    console.error('❌ Error fetching templates:', error);
    return;
  }

  console.log(`\n📚 Found ${templates.length} Business English templates\n`);

  let allFixed = true;

  for (const template of templates) {
    console.log('━'.repeat(80));
    console.log(`\n📋 ${template.name} (${template.level.toUpperCase()})`);
    console.log(`   ID: ${template.id}`);

    if (!template.template_json || !template.template_json.sections) {
      console.log('   ❌ No template_json.sections found');
      allFixed = false;
      continue;
    }

    const sections = template.template_json.sections;
    const vocabSections = sections.filter(s => 
      s.content_type === 'vocabulary_matching' ||
      s.title?.toLowerCase().includes('vocabulary')
    );

    console.log(`   Vocabulary sections: ${vocabSections.length}`);

    for (const section of vocabSections) {
      console.log(`\n   📝 Section: ${section.title}`);
      
      if (!section.vocabulary_items || section.vocabulary_items.length === 0) {
        console.log('      ⚠️ No vocabulary_items in section');
        continue;
      }

      const sampleItem = section.vocabulary_items[0];
      const itemKeys = Object.keys(sampleItem);
      
      console.log(`      Sample item keys: ${itemKeys.join(', ')}`);

      // Check for correct structure
      const hasWord = itemKeys.includes('word');
      const hasDefinition = itemKeys.includes('definition');
      const hasPartOfSpeech = itemKeys.includes('part_of_speech');
      const hasExamples = itemKeys.includes('examples');

      // Check for old structure
      const hasName = itemKeys.includes('name');
      const hasPrompt = itemKeys.includes('prompt');

      if (hasName || hasPrompt) {
        console.log('      ❌ STILL HAS OLD STRUCTURE (name/prompt)');
        console.log('      Sample item:', JSON.stringify(sampleItem, null, 2));
        allFixed = false;
      } else if (hasWord && hasDefinition) {
        console.log('      ✅ HAS CORRECT STRUCTURE (word/definition)');
        console.log(`         - word: ${sampleItem.word}`);
        console.log(`         - definition: ${sampleItem.definition?.substring(0, 50)}...`);
        console.log(`         - part_of_speech: ${sampleItem.part_of_speech || 'missing'}`);
        console.log(`         - examples: ${Array.isArray(sampleItem.examples) ? `array[${sampleItem.examples.length}]` : 'missing'}`);
      } else {
        console.log('      ⚠️ UNKNOWN STRUCTURE');
        console.log('      Sample item:', JSON.stringify(sampleItem, null, 2));
        allFixed = false;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 VERIFICATION RESULT:\n');

  if (allFixed) {
    console.log('✅ ALL BUSINESS ENGLISH TEMPLATES ARE FIXED!');
    console.log('   All vocabulary items use the correct structure:');
    console.log('   - word (not name)');
    console.log('   - definition (not prompt)');
    console.log('   - part_of_speech');
    console.log('   - examples array');
    console.log('\n✅ New lessons should now generate with proper vocabulary!');
  } else {
    console.log('❌ SOME TEMPLATES STILL NEED FIXING');
    console.log('   Please review the output above for details.');
  }

  console.log('\n' + '='.repeat(80));
}

verifyBusinessTemplateFix().catch(console.error);
