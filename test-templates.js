// Test script to check available lesson templates and age filtering
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

async function testTemplateFiltering() {
  try {
    console.log('🔍 Checking available lesson templates...');
    
    // Get all active templates
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }

    console.log(`✅ Found ${templates.length} active templates:\n`);
    
    // Group templates by category and show age appropriateness
    const templatesByCategory = {};
    
    templates.forEach(template => {
      const category = template.category || 'Other';
      if (!templatesByCategory[category]) {
        templatesByCategory[category] = [];
      }
      templatesByCategory[category].push(template);
    });

    // Show templates by category
    Object.keys(templatesByCategory).forEach(category => {
      console.log(`📚 ${category.toUpperCase()}:`);
      templatesByCategory[category].forEach(template => {
        const templateName = template.name.toLowerCase();
        const isKidsTemplate = templateName.includes('kid') || templateName.includes('child') || 
                              template.category.toLowerCase().includes('kids');
        const ageAppropriate = isKidsTemplate ? '👶 Kids Only' : '👥 Adult/Teen';
        
        console.log(`   • ${template.name} (${template.level}) ${ageAppropriate}`);
      });
      console.log('');
    });

    // Test age filtering logic
    console.log('🎯 Testing age filtering logic...');
    
    const testAgeGroups = ['kid', 'teenager', 'adult', 'middle_aged_adult', 'senior'];
    
    testAgeGroups.forEach(ageGroup => {
      const filteredTemplates = templates.filter(template => {
        const templateName = template.name.toLowerCase();
        const templateCategory = template.category.toLowerCase();
        
        if (ageGroup === 'kid') {
          return templateName.includes('kid') || templateName.includes('child') || templateCategory.includes('kids');
        } else {
          return !templateName.includes('kid') && !templateName.includes('child') && 
                 !templateCategory.includes('kids');
        }
      });
      
      console.log(`   ${ageGroup}: ${filteredTemplates.length} appropriate templates`);
      if (ageGroup === 'kid' && filteredTemplates.length > 0) {
        console.log(`      Kids templates: ${filteredTemplates.map(t => t.name).join(', ')}`);
      }
    });

    // Check for problematic templates
    console.log('\n🚨 Checking for age-inappropriate template selections...');
    const kidsTemplates = templates.filter(template => {
      const templateName = template.name.toLowerCase();
      return templateName.includes('kid') || templateName.includes('child') || 
             template.category.toLowerCase().includes('kids');
    });
    
    if (kidsTemplates.length > 0) {
      console.log(`   Found ${kidsTemplates.length} kids-specific templates:`);
      kidsTemplates.forEach(template => {
        console.log(`   • ${template.name} - Should only be used for age_group='kid'`);
      });
    } else {
      console.log('   ✅ No kids-specific templates found');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testTemplateFiltering();