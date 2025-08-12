// Debug script to check what templates are actually in the database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey, serviceRoleKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
    if (line.startsWith('SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
  });
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugTemplates() {
  try {
    console.log('🔍 Debugging lesson templates in database...');
    console.log('=' .repeat(80));
    
    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }

    console.log(`📚 Found ${templates.length} total templates\n`);
    
    // Check for our new templates
    const newTemplates = templates.filter(t => 
      t.name.includes('English for Travel') || t.name.includes('Pronunciation')
    );
    
    const oldTemplates = templates.filter(t => 
      !t.name.includes('English for Travel') && !t.name.includes('Pronunciation')
    );
    
    console.log(`🆕 New Templates (Travel/Pronunciation): ${newTemplates.length}`);
    console.log(`🗂️  Old Templates: ${oldTemplates.length}\n`);
    
    if (newTemplates.length > 0) {
      console.log('🆕 NEW TEMPLATES WITH PROPER STRUCTURE:');
      console.log('=' .repeat(60));
      newTemplates.forEach((template, index) => {
        const hasTemplateJson = template.template_json && 
                               template.template_json.lesson_structure && 
                               Array.isArray(template.template_json.lesson_structure);
        
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ID: ${template.id}`);
        console.log(`   Level: ${template.level.toUpperCase()}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Has template_json: ${!!template.template_json}`);
        console.log(`   Has lesson_structure: ${hasTemplateJson}`);
        console.log(`   Structure sections: ${hasTemplateJson ? template.template_json.lesson_structure.length : 0}`);
        console.log(`   Created: ${new Date(template.created_at).toLocaleDateString()}`);
        
        if (hasTemplateJson) {
          const sections = template.template_json.lesson_structure.map(s => s.id);
          console.log(`   Sections: ${sections.join(', ')}`);
        }
        console.log('');
      });
    }
    
    if (oldTemplates.length > 0) {
      console.log('🗂️  OLD TEMPLATES (need updating):');
      console.log('=' .repeat(60));
      oldTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ID: ${template.id}`);
        console.log(`   Level: ${template.level.toUpperCase()}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Has template_json: ${!!template.template_json}`);
        console.log(`   Has old fields: objectives=${!!template.objectives}, activities=${!!template.activities}`);
        console.log(`   Created: ${new Date(template.created_at).toLocaleDateString()}`);
        
        // Show what's actually in template_json
        if (template.template_json) {
          console.log(`   template_json keys: ${Object.keys(template.template_json).join(', ')}`);
          if (template.template_json.lesson_structure) {
            console.log(`   lesson_structure length: ${template.template_json.lesson_structure.length}`);
          } else {
            console.log(`   template_json content: ${JSON.stringify(template.template_json).substring(0, 100)}...`);
          }
        }
        console.log('');
      });
    }
    
    // Summary
    console.log('=' .repeat(80));
    console.log('📋 TEMPLATE STRUCTURE ANALYSIS:');
    console.log('=' .repeat(80));
    
    const withTemplateJson = templates.filter(t => t.template_json && t.template_json.lesson_structure).length;
    const withOldStructure = templates.filter(t => t.objectives || t.activities).length;
    const completelyEmpty = templates.filter(t => !t.template_json && !t.objectives && !t.activities).length;
    
    console.log(`✅ Templates with new structure (template_json): ${withTemplateJson}`);
    console.log(`🔄 Templates with old structure: ${withOldStructure}`);
    console.log(`🔴 Completely empty templates: ${completelyEmpty}`);
    
    if (withTemplateJson > 0) {
      console.log('\n🎉 SUCCESS: New templates with proper structure are in the database!');
      console.log('   The AI can now use these templates to generate structured lessons.');
    } else {
      console.log('\n⚠️  WARNING: No templates with new structure found.');
      console.log('   The migration files may not have been applied correctly.');
    }

  } catch (error) {
    console.error('❌ Error debugging templates:', error);
  }
}

debugTemplates();