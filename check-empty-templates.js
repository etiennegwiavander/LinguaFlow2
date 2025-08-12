// Script to check for empty lesson templates that need content
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

async function checkEmptyTemplates() {
  try {
    console.log('🔍 Checking for empty lesson templates...');
    console.log('=' .repeat(80));
    
    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('*')
      .order('level, category, name');

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }

    console.log(`📚 Found ${templates.length} total templates\n`);
    
    // Analyze template content
    const emptyTemplates = [];
    const partialTemplates = [];
    const completeTemplates = [];
    
    templates.forEach(template => {
      // Check for new template_json structure (preferred)
      const hasTemplateJson = template.template_json && 
                             template.template_json.lesson_structure && 
                             Array.isArray(template.template_json.lesson_structure) && 
                             template.template_json.lesson_structure.length > 0;
      
      // Check for old structure (legacy)
      const hasObjectives = template.objectives && Array.isArray(template.objectives) && template.objectives.length > 0;
      const hasActivities = template.activities && Array.isArray(template.activities) && template.activities.length > 0;
      const hasMaterials = template.materials && Array.isArray(template.materials) && template.materials.length > 0;
      const hasAssessment = template.assessment && Array.isArray(template.assessment) && template.assessment.length > 0;
      const hasDescription = template.description && template.description.trim().length > 0;
      
      // If has new structure, it's complete
      let filledFields;
      if (hasTemplateJson) {
        filledFields = 5; // Consider complete if has proper template_json
      } else {
        // Check old structure
        const contentFields = [hasObjectives, hasActivities, hasMaterials, hasAssessment, hasDescription];
        filledFields = contentFields.filter(Boolean).length;
      }
      
      const templateInfo = {
        ...template,
        contentScore: filledFields,
        hasObjectives,
        hasActivities,
        hasMaterials,
        hasAssessment,
        hasDescription
      };
      
      if (filledFields === 0) {
        emptyTemplates.push(templateInfo);
      } else if (filledFields < 5) {
        partialTemplates.push(templateInfo);
      } else {
        completeTemplates.push(templateInfo);
      }
    });
    
    // Report results
    console.log('📊 TEMPLATE CONTENT ANALYSIS:');
    console.log(`   ✅ Complete Templates: ${completeTemplates.length}`);
    console.log(`   🟡 Partial Templates: ${partialTemplates.length}`);
    console.log(`   🔴 Empty Templates: ${emptyTemplates.length}`);
    console.log('');
    
    // Show empty templates
    if (emptyTemplates.length > 0) {
      console.log('🔴 EMPTY TEMPLATES (need complete content):');
      console.log('=' .repeat(60));
      emptyTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ID: ${template.id}`);
        console.log(`   Level: ${template.level.toUpperCase()}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Active: ${template.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${new Date(template.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }
    
    // Show partial templates
    if (partialTemplates.length > 0) {
      console.log('🟡 PARTIAL TEMPLATES (missing some content):');
      console.log('=' .repeat(60));
      partialTemplates.forEach((template, index) => {
        const missing = [];
        if (!template.hasObjectives) missing.push('Objectives');
        if (!template.hasActivities) missing.push('Activities');
        if (!template.hasMaterials) missing.push('Materials');
        if (!template.hasAssessment) missing.push('Assessment');
        if (!template.hasDescription) missing.push('Description');
        
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ID: ${template.id}`);
        console.log(`   Level: ${template.level.toUpperCase()}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Content Score: ${template.contentScore}/5`);
        console.log(`   Missing: ${missing.join(', ')}`);
        console.log('');
      });
    }
    
    // Show complete templates summary
    if (completeTemplates.length > 0) {
      console.log('✅ COMPLETE TEMPLATES:');
      console.log('=' .repeat(60));
      const byCategory = {};
      completeTemplates.forEach(template => {
        if (!byCategory[template.category]) {
          byCategory[template.category] = [];
        }
        byCategory[template.category].push(template);
      });
      
      Object.keys(byCategory).forEach(category => {
        console.log(`📚 ${category}:`);
        byCategory[category].forEach(template => {
          console.log(`   • ${template.name} (${template.level.toUpperCase()})`);
        });
        console.log('');
      });
    }
    
    // Summary and next steps
    console.log('=' .repeat(80));
    console.log('📋 SUMMARY & NEXT STEPS:');
    console.log('=' .repeat(80));
    
    if (emptyTemplates.length > 0) {
      console.log(`🔴 ${emptyTemplates.length} templates need complete content creation`);
      console.log('   Please provide material links for these templates');
    }
    
    if (partialTemplates.length > 0) {
      console.log(`🟡 ${partialTemplates.length} templates need content completion`);
      console.log('   These have some content but are missing key fields');
    }
    
    console.log(`✅ ${completeTemplates.length} templates are ready to use`);
    
    const totalNeedingWork = emptyTemplates.length + partialTemplates.length;
    if (totalNeedingWork > 0) {
      console.log(`\n🎯 PRIORITY: ${totalNeedingWork} templates need content work`);
      console.log('   Ready to process material links and populate JSONB content!');
    } else {
      console.log('\n🎉 All templates have complete content!');
    }

  } catch (error) {
    console.error('❌ Error checking templates:', error);
  }
}

checkEmptyTemplates();