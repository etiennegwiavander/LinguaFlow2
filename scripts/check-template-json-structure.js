const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplateJsonStructure() {
  console.log('🔍 CHECKING TEMPLATE_JSON STRUCTURE\n');
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
  
  console.log('\n🔍 CHECKING FIELDS:');
  console.log(`   Has 'sections' field: ${!!template.sections}`);
  console.log(`   Has 'template_json' field: ${!!template.template_json}`);
  
  if (template.template_json) {
    console.log('\n📄 TEMPLATE_JSON CONTENT:');
    console.log(JSON.stringify(template.template_json, null, 2));
  } else {
    console.log('\n❌ NO template_json field found!');
  }
  
  if (template.sections) {
    console.log('\n📄 SECTIONS CONTENT:');
    console.log(JSON.stringify(template.sections, null, 2));
  } else {
    console.log('\n❌ NO sections field found!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 DIAGNOSIS:\n');
  
  if (!template.template_json && !template.sections) {
    console.log('❌ CRITICAL: Template has NEITHER template_json NOR sections!');
    console.log('This means the AI is receiving an empty template structure.');
    console.log('The AI must be generating content from scratch without proper guidance.');
  } else if (template.template_json) {
    console.log('✅ Template has template_json field');
    console.log('Checking if it contains vocabulary structure...');
    
    const jsonStr = JSON.stringify(template.template_json);
    if (jsonStr.includes('vocabulary_items')) {
      console.log('✅ Found vocabulary_items in template_json');
      
      if (jsonStr.includes('"name"') && jsonStr.includes('"prompt"')) {
        console.log('🚨 FOUND THE PROBLEM!');
        console.log('The template_json contains vocabulary items with "name" and "prompt" fields');
        console.log('instead of "word" and "definition" fields!');
      }
    }
  }
}

checkTemplateJsonStructure().catch(console.error);
