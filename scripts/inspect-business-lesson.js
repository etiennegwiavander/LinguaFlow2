const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectBusinessLesson() {
  console.log('🔍 Inspecting Business Lesson Structure\n');
  console.log('='.repeat(60));

  try {
    // Get one business lesson
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, interactive_lesson_content, lesson_template_id')
      .in('lesson_template_id', [
        '08f66303-3751-4ad3-bca8-e1bf0d1640b8', // Business English Networking
        'aacbd4e2-879c-425a-a1ed-6881e0c26674', // Business English
        'f5165f76-8495-43a5-b2fb-88986a5181a2', // Business English Interview
        '5dfc64f3-a4d2-4adf-b1bd-ffb4b540aedd'  // Business English
      ])
      .not('interactive_lesson_content', 'is', null)
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (lessons.length === 0) {
      console.log('⚠️  No business lessons found');
      
      // Check if business templates exist
      const { data: templates } = await supabase
        .from('lesson_templates')
        .select('id, name, category')
        .ilike('name', '%business%');
      
      console.log('\n📋 Available business templates:');
      templates.forEach(t => console.log(`   - ${t.name} [${t.id}]`));
      
      return;
    }

    const lesson = lessons[0];
    console.log(`\n📋 Lesson ID: ${lesson.id}`);
    
    const content = typeof lesson.interactive_lesson_content === 'string'
      ? JSON.parse(lesson.interactive_lesson_content)
      : lesson.interactive_lesson_content;

    console.log(`\n📄 Lesson Name: ${content.name}`);
    console.log(`📄 Category: ${content.category}`);
    console.log(`\n📝 Sections:\n`);

    content.sections.forEach((section, index) => {
      console.log(`${index + 1}. ${section.type} - ${section.title || 'No title'}`);
      
      // Look for business_examples sections
      if (section.type === 'exercise' && section.content_type === 'business_examples') {
        console.log(`\n   🎯 BUSINESS EXAMPLES SECTION FOUND!`);
        console.log(`   AI Placeholder: ${section.ai_placeholder}`);
        
        if (section.business_examples) {
          console.log(`   Total examples: ${section.business_examples.length}`);
          console.log(`\n   Examples:`);
          section.business_examples.forEach((example, i) => {
            const isGeneric = example.toLowerCase().includes('word') || 
                             example.toLowerCase().includes('example') ||
                             example.toLowerCase().includes('placeholder') ||
                             example.length < 20;
            const marker = isGeneric ? '⚠️  FALLBACK' : '✅ AI';
            console.log(`      ${i + 1}. ${marker}: "${example}"`);
          });
        } else {
          console.log(`   ⚠️  No business_examples array found!`);
        }
      }
      
      // Also check for examples field
      if (section.examples) {
        console.log(`\n   📋 Examples field found: ${section.examples.length} items`);
        section.examples.slice(0, 7).forEach((example, i) => {
          const isGeneric = example.toLowerCase().includes('word') || 
                           example.toLowerCase().includes('example') ||
                           example.toLowerCase().includes('placeholder') ||
                           example.length < 20;
          const marker = isGeneric ? '⚠️  FALLBACK' : '✅ AI';
          console.log(`      ${i + 1}. ${marker}: "${example}"`);
        });
      }
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

inspectBusinessLesson();
