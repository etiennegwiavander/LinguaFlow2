require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllContentTypes() {
  console.log('🔍 Checking all content types across templates...\n');

  const { data: templates, error } = await supabase
    .from('lesson_templates')
    .select('name, category, level, template_json')
    .eq('is_active', true);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const contentTypesByTemplate = {};
  const allContentTypes = new Set();

  templates.forEach(template => {
    const key = `${template.category} (${template.level.toUpperCase()})`;
    contentTypesByTemplate[key] = new Set();

    template.template_json.sections.forEach(section => {
      if (section.content_type) {
        allContentTypes.add(section.content_type);
        contentTypesByTemplate[key].add(section.content_type);
      }
    });
  });

  console.log('📊 ALL CONTENT TYPES USED:');
  console.log('='.repeat(60));
  [...allContentTypes].sort().forEach(type => {
    console.log(`  ✓ ${type}`);
  });

  console.log('\n📋 CONTENT TYPES BY TEMPLATE:');
  console.log('='.repeat(60));
  Object.entries(contentTypesByTemplate).forEach(([template, types]) => {
    console.log(`\n${template}:`);
    [...types].sort().forEach(type => {
      console.log(`  - ${type}`);
    });
  });

  console.log('\n📈 SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Total templates: ${templates.length}`);
  console.log(`Unique content types: ${allContentTypes.size}`);
  
  const categories = {};
  templates.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + 1;
  });
  console.log('\nTemplates by category:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // Check for the 6 problematic types
  const problematicTypes = [
    'drawing_tool_match',
    'listen_repeat',
    'audio_picture_choice',
    'say_what_you_see',
    'complete_sentence',
    'answer_questions'
  ];

  const foundProblematic = problematicTypes.filter(type => allContentTypes.has(type));
  
  if (foundProblematic.length > 0) {
    console.log('\n⚠️  UNSUPPORTED TYPES FOUND:');
    console.log('='.repeat(60));
    foundProblematic.forEach(type => {
      console.log(`  ❌ ${type}`);
      // Find which templates use this type
      Object.entries(contentTypesByTemplate).forEach(([template, types]) => {
        if (types.has(type)) {
          console.log(`     Used in: ${template}`);
        }
      });
    });
  }

  console.log('\n✅ Analysis complete!\n');
}

checkAllContentTypes().catch(console.error);
