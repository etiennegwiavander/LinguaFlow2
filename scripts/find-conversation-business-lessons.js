const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findConversationBusinessLessons() {
  console.log('🔍 Finding Conversation and Business Lessons\n');
  console.log('='.repeat(60));

  try {
    // 1. First, find conversation and business templates
    console.log('\n📋 Step 1: Finding conversation and business templates...');
    
    const { data: templates, error: templateError } = await supabase
      .from('lesson_templates')
      .select('id, name, category')
      .or('name.ilike.%conversation%,name.ilike.%business%,category.eq.conversation,category.eq.business');

    if (templateError) {
      console.error('❌ Error fetching templates:', templateError);
      return;
    }

    console.log(`✅ Found ${templates.length} templates:`);
    templates.forEach(t => {
      console.log(`   - ${t.name} (${t.category}) [ID: ${t.id}]`);
    });

    if (templates.length === 0) {
      console.log('\n⚠️  No conversation or business templates found!');
      return;
    }

    // 2. Find lessons using these templates
    console.log('\n📋 Step 2: Finding lessons using these templates...');
    
    const templateIds = templates.map(t => t.id);
    
    const { data: lessons, error: lessonError } = await supabase
      .from('lessons')
      .select('id, created_at, interactive_lesson_content, lesson_template_id, student:students(name)')
      .in('lesson_template_id', templateIds)
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lessonError) {
      console.error('❌ Error fetching lessons:', lessonError);
      return;
    }

    console.log(`✅ Found ${lessons.length} lessons\n`);

    // 3. Analyze each lesson
    for (const lesson of lessons) {
      const template = templates.find(t => t.id === lesson.lesson_template_id);
      
      console.log('-'.repeat(50));
      console.log(`\n🔍 Lesson: ${lesson.id}`);
      console.log(`   Student: ${lesson.student?.name || 'Unknown'}`);
      console.log(`   Template: ${template?.name || 'Unknown'}`);
      console.log(`   Created: ${lesson.created_at}`);

      try {
        const content = typeof lesson.interactive_lesson_content === 'string'
          ? JSON.parse(lesson.interactive_lesson_content)
          : lesson.interactive_lesson_content;

        // Look for sections in different possible locations
        let sections = [];
        if (content.sections) {
          sections = content.sections;
        } else if (content.template?.template_json?.sections) {
          sections = content.template.template_json.sections;
        } else if (content.template_json?.sections) {
          sections = content.template_json.sections;
        }

        console.log(`   Total sections: ${sections.length}`);

        // Find conversation and business_examples sections
        sections.forEach((section, index) => {
          if (section.type === 'conversation') {
            console.log(`\n   📝 Section ${index + 1}: CONVERSATION`);
            analyzeConversationSection(section);
          } else if (section.type === 'business_examples') {
            console.log(`\n   📝 Section ${index + 1}: BUSINESS EXAMPLES`);
            analyzeBusinessExamplesSection(section);
          } else if (section.type === 'vocabulary') {
            console.log(`\n   📝 Section ${index + 1}: VOCABULARY`);
            analyzeVocabularySection(section);
          }
        });

      } catch (parseError) {
        console.error(`   ❌ Error parsing content: ${parseError.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Analysis complete!\n');
}

function analyzeConversationSection(section) {
  const dialogues = section.dialogues || [];
  console.log(`      Total dialogues: ${dialogues.length}`);
  
  if (dialogues.length > 0) {
    dialogues.forEach((dialogue, i) => {
      console.log(`\n      Dialogue ${i + 1}:`);
      if (Array.isArray(dialogue)) {
        console.log(`         Exchanges: ${dialogue.length}`);
        dialogue.slice(0, 2).forEach((exchange, j) => {
          console.log(`         ${j + 1}. ${exchange.speaker}: "${exchange.text}"`);
        });
      } else {
        console.log(`         Format: ${typeof dialogue}`);
      }
    });
  } else {
    console.log(`      ⚠️  No dialogues found!`);
  }
}

function analyzeBusinessExamplesSection(section) {
  const examples = section.examples || [];
  console.log(`      Total examples: ${examples.length}`);
  
  if (examples.length > 0) {
    console.log(`\n      First 7 examples:`);
    examples.slice(0, 7).forEach((example, i) => {
      const text = example || '';
      const isGeneric = text.toLowerCase().includes('word') || 
                       text.toLowerCase().includes('example') ||
                       text.toLowerCase().includes('placeholder') ||
                       text.length < 20;
      
      const marker = isGeneric ? '⚠️  FALLBACK' : '✅ AI';
      console.log(`         ${i + 1}. ${marker}: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
    });
  } else {
    console.log(`      ⚠️  No examples found!`);
  }
}

function analyzeVocabularySection(section) {
  const items = section.vocabulary_items || [];
  console.log(`      Total vocabulary items: ${items.length}`);
  
  if (items.length > 0) {
    console.log(`\n      First 5 items:`);
    items.slice(0, 5).forEach((item, i) => {
      const word = item.word || '';
      const definition = item.definition || '';
      const isGeneric = word.toLowerCase().includes('word') || 
                       definition.toLowerCase().includes('example') ||
                       definition.toLowerCase().includes('placeholder');
      
      const marker = isGeneric ? '⚠️  FALLBACK' : '✅ AI';
      console.log(`         ${i + 1}. ${marker}: "${word}" - ${definition.substring(0, 60)}${definition.length > 60 ? '...' : ''}`);
    });
  } else {
    console.log(`      ⚠️  No vocabulary items found!`);
  }
}

findConversationBusinessLessons();
