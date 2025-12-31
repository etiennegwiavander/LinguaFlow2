const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateB2KidsTemplate() {
  console.log('🔄 Updating B2 English for Kids template...\n');

  // Get the current template
  const { data: templates, error: fetchError } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('name', 'English for Kids Lesson')
    .eq('category', 'English for Kids')
    .eq('level', 'b2');

  if (fetchError) {
    console.error('❌ Error fetching template:', fetchError);
    return;
  }

  if (!templates || templates.length === 0) {
    console.log('⚠️ Template not found');
    return;
  }

  const template = templates[0];
  console.log('✅ Found template:', template.id);
  console.log('   Name:', template.name);
  console.log('   Category:', template.category);
  console.log('   Level:', template.level);

  // Update the template JSON
  const templateJson = template.template_json;
  const sections = templateJson.sections;

  // Find and update warm_up_engagement section
  const warmUpIndex = sections.findIndex(s => s.id === 'warm_up_engagement');
  if (warmUpIndex !== -1) {
    console.log('\n📝 Updating Warm-Up/Engagement section...');
    sections[warmUpIndex] = {
      id: 'warm_up_engagement',
      type: 'exercise',
      title: 'Warm-Up/Engagement',
      instruction: 'Interactive questions to activate prior knowledge and spark curiosity about the topic.',
      instruction_bg_color_var: 'secondary_bg',
      content_type: 'interactive_question_cards',
      items: [],
      ai_placeholder: 'warm_up_questions'
    };
    console.log('   ✅ Updated to interactive_question_cards');
  }

  // Find and update pronunciation_listening_practice section
  const pronunciationIndex = sections.findIndex(s => s.id === 'pronunciation_listening_practice');
  if (pronunciationIndex !== -1) {
    console.log('\n📝 Updating Pronunciation/Listening Practice section...');
    sections[pronunciationIndex] = {
      id: 'pronunciation_listening_practice',
      type: 'exercise',
      title: 'Pronunciation/Listening Practice',
      instruction: 'Read this engaging story that uses the key vocabulary from today\'s lesson.',
      instruction_bg_color_var: 'secondary_bg',
      content_type: 'engaging_moral_story',
      ai_placeholder: 'moral_story_content'
    };
    console.log('   ✅ Updated to engaging_moral_story');
  }

  // Update the template in the database
  const { error: updateError } = await supabase
    .from('lesson_templates')
    .update({ template_json: templateJson })
    .eq('id', template.id);

  if (updateError) {
    console.error('\n❌ Error updating template:', updateError);
    return;
  }

  console.log('\n✅ Template updated successfully!');
  console.log('\n📌 Next steps:');
  console.log('   1. Generate a new B2 English for Kids lesson');
  console.log('   2. Check the Warm-Up and Pronunciation sections');
  console.log('   3. Verify the new interactive question cards and moral story');
}

updateB2KidsTemplate().catch(console.error);
