require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplateStructure() {
  const { data, error } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('category', 'English for Travel')
    .eq('level', 'b2')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Template JSON structure:');
  console.log('Keys:', Object.keys(data.template_json));
  console.log('\nHas sections?', !!data.template_json.sections);
  console.log('Has lesson_structure?', !!data.template_json.lesson_structure);
  
  if (data.template_json.sections) {
    console.log('\nSections count:', data.template_json.sections.length);
  }
  
  if (data.template_json.lesson_structure) {
    console.log('\nLesson structure count:', data.template_json.lesson_structure.length);
  }
}

checkTemplateStructure();
