const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyKidsTemplateUpdate() {
  console.log('🔍 Verifying English for Kids B1 Template Update...\n');

  try {
    // Fetch the B1 template
    const { data: template, error } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Kids')
      .eq('level', 'b1')
      .single();

    if (error) {
      console.error('❌ Error fetching template:', error);
      return;
    }

    console.log('✅ Template found:', template.name);
    console.log('📋 Level:', template.level);
    console.log('\n📝 Sections in template:');
    
    const sections = template.template_json.sections;
    
    // Check for removed sections
    const removedSections = ['which_picture', 'say_what_you_see', 'answer_the_questions'];
    const foundRemovedSections = sections.filter(s => removedSections.includes(s.id));
    
    if (foundRemovedSections.length > 0) {
      console.log('\n❌ ISSUE: Found sections that should be removed:');
      foundRemovedSections.forEach(s => console.log(`   - ${s.id}: ${s.title}`));
    } else {
      console.log('\n✅ Confirmed: Image/audio-dependent sections removed');
      console.log('   - which_picture ❌');
      console.log('   - say_what_you_see ❌');
      console.log('   - answer_the_questions ❌');
    }

    // Check warm-up section
    const warmUp = sections.find(s => s.id === 'warm_up');
    if (warmUp) {
      console.log('\n📌 Warm-up Section:');
      console.log('   Title:', warmUp.title);
      console.log('   Instruction:', warmUp.instruction);
      console.log('   Content Type:', warmUp.content_type);
      
      if (warmUp.content_type === 'vocabulary_translation_match') {
        console.log('   ✅ Updated to vocabulary translation matching');
      } else {
        console.log('   ❌ Still using old content type:', warmUp.content_type);
      }
    } else {
      console.log('\n❌ Warm-up section not found!');
    }

    // List all remaining sections
    console.log('\n📋 All sections in template:');
    sections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.id} - ${section.title}`);
    });

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyKidsTemplateUpdate();
