/**
 * Check English for Travel template structure
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTravelTemplate() {
  console.log('🔍 Checking English for Travel templates...\n');

  // Check all templates
  const { data: allTemplates, error: allError } = await supabase
    .from('lesson_templates')
    .select('id, name, category, level')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (allError) {
    console.error('❌ Error fetching templates:', allError);
    return;
  }

  console.log(`📊 Total active templates: ${allTemplates.length}\n`);

  // Group by category
  const byCategory = {};
  allTemplates.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  console.log('📋 Templates by category:');
  console.log('========================\n');
  
  Object.keys(byCategory).sort().forEach(category => {
    console.log(`${category}:`);
    byCategory[category].forEach(t => {
      console.log(`  - ${t.name} (${t.level.toUpperCase()})`);
    });
    console.log('');
  });

  // Check specifically for English for Travel
  const travelTemplates = allTemplates.filter(t => 
    t.category.toLowerCase().includes('travel') || 
    t.name.toLowerCase().includes('travel')
  );

  if (travelTemplates.length === 0) {
    console.log('❌ NO "English for Travel" templates found!');
    console.log('   This explains why you\'re getting "Invalid Template Structure"\n');
  } else {
    console.log('✅ Found English for Travel templates:');
    travelTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.category}, ${t.level.toUpperCase()})`);
    });
  }

  // Check for B2 level templates specifically
  console.log('\n📊 B2 Level templates:');
  const b2Templates = allTemplates.filter(t => t.level === 'b2');
  b2Templates.forEach(t => {
    console.log(`  - ${t.name} (${t.category})`);
  });
}

checkTravelTemplate();
