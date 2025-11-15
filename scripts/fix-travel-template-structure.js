require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTravelTemplateStructure() {
  console.log('🔧 Fixing English for Travel template structure...\n');

  try {
    // Get all English for Travel templates
    const { data: templates, error: fetchError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Travel');

    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
      return;
    }

    console.log(`📋 Found ${templates.length} English for Travel templates\n`);

    for (const template of templates) {
      const templateJson = template.template_json;
      
      // Check if it has lesson_structure instead of sections
      if (templateJson.lesson_structure && !templateJson.sections) {
        console.log(`🔄 Fixing ${template.level.toUpperCase()} template...`);
        
        // Move lesson_structure to sections
        const updatedJson = {
          ...templateJson,
          sections: templateJson.lesson_structure
        };
        
        // Remove lesson_structure
        delete updatedJson.lesson_structure;
        
        // Update in database
        const { error: updateError } = await supabase
          .from('lesson_templates')
          .update({ template_json: updatedJson })
          .eq('id', template.id);

        if (updateError) {
          console.error(`   ❌ Error updating ${template.level}: ${updateError.message}`);
        } else {
          console.log(`   ✅ Fixed ${template.level.toUpperCase()} - moved lesson_structure to sections`);
        }
      } else if (templateJson.sections) {
        console.log(`✅ ${template.level.toUpperCase()} already has sections`);
      } else {
        console.log(`⚠️  ${template.level.toUpperCase()} has neither sections nor lesson_structure!`);
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: verifyTemplates, error: verifyError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'English for Travel');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }

    let allFixed = true;
    verifyTemplates.forEach(t => {
      const hasSections = !!t.template_json.sections;
      const hasLessonStructure = !!t.template_json.lesson_structure;
      
      if (!hasSections) {
        console.log(`   ❌ ${t.level.toUpperCase()}: Missing sections`);
        allFixed = false;
      } else if (hasLessonStructure) {
        console.log(`   ⚠️  ${t.level.toUpperCase()}: Still has lesson_structure`);
        allFixed = false;
      } else {
        console.log(`   ✅ ${t.level.toUpperCase()}: Has sections (${t.template_json.sections.length} items)`);
      }
    });

    if (allFixed) {
      console.log('\n🎉 All templates fixed successfully!');
    } else {
      console.log('\n⚠️  Some templates still need fixing');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixTravelTemplateStructure();
