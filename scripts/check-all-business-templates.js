const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllBusinessTemplates() {
  console.log('🔍 CHECKING ALL BUSINESS ENGLISH TEMPLATES\n');
  console.log('='.repeat(80));

  const { data: templates, error } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('category', 'Business English')
    .order('level');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📚 Found ${templates.length} Business English templates\n`);

  for (const template of templates) {
    console.log('━'.repeat(80));
    console.log(`\n📋 ${template.name}`);
    console.log(`   ID: ${template.id}`);
    console.log(`   Level: ${template.level}`);
    console.log(`   Sections: ${template.sections?.length || 0}`);
    
    if (template.sections && template.sections.length > 0) {
      const vocabSections = template.sections.filter(s => 
        s.title?.toLowerCase().includes('vocabulary') ||
        s.content_type === 'vocabulary_matching'
      );
      
      console.log(`   Vocabulary sections: ${vocabSections.length}`);
      
      for (const section of vocabSections) {
        console.log(`\n   📝 ${section.title}`);
        console.log(`      Content Type: ${section.content_type}`);
        console.log(`      Has vocabulary_items: ${!!section.vocabulary_items}`);
        
        if (section.vocabulary_items && section.vocabulary_items.length > 0) {
          console.log(`      Sample item keys: ${Object.keys(section.vocabulary_items[0]).join(', ')}`);
          console.log(`\n      🔍 SAMPLE ITEM:`);
          console.log(JSON.stringify(section.vocabulary_items[0], null, 2));
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
}

checkAllBusinessTemplates().catch(console.error);
