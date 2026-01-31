const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkB2BusinessTemplate() {
  console.log('🔍 CHECKING B2 BUSINESS ENGLISH TEMPLATE\n');
  console.log('='.repeat(80));

  const templateId = 'aacbd4e2-879c-425a-a1ed-6881e0c26674';

  const { data: template, error } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('\n📋 TEMPLATE DETAILS:');
  console.log(`   Name: ${template.name}`);
  console.log(`   Category: ${template.category}`);
  console.log(`   Level: ${template.level}`);
  console.log(`   Sections: ${template.sections?.length || 0}`);

  // Find vocabulary sections
  const vocabSections = template.sections?.filter(s => 
    s.title?.toLowerCase().includes('vocabulary') ||
    s.content_type === 'vocabulary_matching'
  );

  console.log(`\n📚 VOCABULARY SECTIONS: ${vocabSections?.length || 0}\n`);

  for (const section of vocabSections || []) {
    console.log('━'.repeat(80));
    console.log(`\n📝 SECTION: ${section.title}`);
    console.log(`   ID: ${section.id}`);
    console.log(`   Content Type: ${section.content_type}`);
    console.log(`   AI Placeholder: ${section.ai_placeholder}`);
    
    console.log('\n🔍 FULL SECTION STRUCTURE:');
    console.log(JSON.stringify(section, null, 2));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 ANALYSIS:\n');
  console.log('Looking for vocabulary_items structure in template...');
  
  const hasVocabItems = vocabSections?.some(s => s.vocabulary_items);
  console.log(`Has vocabulary_items in template: ${hasVocabItems}`);
  
  if (hasVocabItems) {
    console.log('\n⚠️ PROBLEM FOUND:');
    console.log('The template contains pre-defined vocabulary_items with wrong field names!');
    console.log('The AI is copying the template structure instead of generating new content.');
  }
}

checkB2BusinessTemplate().catch(console.error);
