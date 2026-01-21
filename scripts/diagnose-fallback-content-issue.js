const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseFallbackContentIssue() {
  console.log('🔍 Diagnosing Fallback Content Issue\n');
  console.log('='.repeat(60));

  try {
    // 1. Get recent lessons with interactive content
    console.log('\n📋 Step 1: Analyzing recent lessons with interactive content...');
    
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, created_at, interactive_lesson_content, lesson_template_id, student:students(name)')
      .not('interactive_lesson_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching lessons:', error);
      return;
    }

    console.log(`✅ Found ${lessons.length} lessons with interactive content\n`);

    // 2. Analyze each lesson for fallback content patterns
    for (const lesson of lessons) {
      console.log('-'.repeat(50));
      console.log(`\n🔍 Analyzing Lesson: ${lesson.id}`);
      console.log(`   Student: ${lesson.student?.name || 'Unknown'}`);
      console.log(`   Created: ${lesson.created_at}`);
      console.log(`   Template ID: ${lesson.lesson_template_id}`);

      try {
        const content = typeof lesson.interactive_lesson_content === 'string'
          ? JSON.parse(lesson.interactive_lesson_content)
          : lesson.interactive_lesson_content;

        // Check template structure
        const sections = content.template?.template_json?.sections || content.sections || [];
        console.log(`   Sections found: ${sections.length}`);

        // Analyze each section for fallback content
        sections.forEach((section, index) => {
          console.log(`\n   📝 Section ${index + 1}: ${section.type}`);
          
          switch (section.type) {
            case 'vocabulary':
              analyzeVocabularySection(section);
              break;
            case 'conversation':
              analyzeConversationSection(section);
              break;
            case 'business_examples':
              analyzeBusinessExamplesSection(section);
              break;
            case 'pronunciation':
              analyzePronunciationSection(section);
              break;
            default:
              console.log(`      Type: ${section.type} (not analyzed)`);
          }
        });
      } catch (parseError) {
        console.error(`   ❌ Error parsing content: ${parseError.message}`);
      }
    }

    // 3. Check template definitions for fallback patterns
    console.log('\n\n' + '='.repeat(60));
    console.log('\n📋 Step 2: Checking template definitions...');
    
    const { data: templates, error: templateError } = await supabase
      .from('lesson_templates')
      .select('id, name, category, template_json')
      .in('category', ['conversation', 'business', 'pronunciation']);

    if (templateError) {
      console.error('❌ Error fetching templates:', templateError);
      return;
    }

    console.log(`✅ Found ${templates.length} relevant templates\n`);

    templates.forEach(template => {
      console.log(`\n🔍 Template: ${template.name} (${template.category})`);
      
      try {
        const templateJson = typeof template.template_json === 'string'
          ? JSON.parse(template.template_json)
          : template.template_json;

        const sections = templateJson.sections || [];
        
        sections.forEach((section, index) => {
          if (section.type === 'vocabulary' || section.type === 'conversation' || section.type === 'business_examples') {
            console.log(`   Section ${index + 1}: ${section.type}`);
            
            // Check for hardcoded fallback content in templates
            if (section.vocabulary_items && section.vocabulary_items.length > 0) {
              console.log(`      Has ${section.vocabulary_items.length} hardcoded vocabulary items`);
              section.vocabulary_items.slice(0, 3).forEach((item, i) => {
                console.log(`         ${i + 1}. "${item.word}" - ${item.definition}`);
              });
            }
            
            if (section.dialogues && section.dialogues.length > 0) {
              console.log(`      Has ${section.dialogues.length} hardcoded dialogues`);
            }
            
            if (section.examples && section.examples.length > 0) {
              console.log(`      Has ${section.examples.length} hardcoded examples`);
              section.examples.slice(0, 3).forEach((example, i) => {
                console.log(`         ${i + 1}. "${example}"`);
              });
            }
          }
        });
      } catch (parseError) {
        console.error(`   ❌ Error parsing template: ${parseError.message}`);
      }
    });

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Diagnosis complete!\n');
}

function analyzeVocabularySection(section) {
  const items = section.vocabulary_items || [];
  console.log(`      Vocabulary items: ${items.length}`);
  
  if (items.length > 0) {
    // Check for patterns that indicate fallback content
    const fallbackPatterns = [
      'example word',
      'sample definition',
      'placeholder',
      'default',
      'fallback'
    ];
    
    let fallbackCount = 0;
    let aiGeneratedCount = 0;
    
    items.forEach((item, i) => {
      const word = (item.word || '').toLowerCase();
      const definition = (item.definition || '').toLowerCase();
      
      const isFallback = fallbackPatterns.some(pattern => 
        word.includes(pattern) || definition.includes(pattern)
      );
      
      if (isFallback) {
        fallbackCount++;
        if (i < 3) console.log(`         FALLBACK: "${item.word}" - ${item.definition}`);
      } else {
        aiGeneratedCount++;
        if (i < 3) console.log(`         AI: "${item.word}" - ${item.definition}`);
      }
    });
    
    console.log(`      AI Generated: ${aiGeneratedCount}, Fallback: ${fallbackCount}`);
    
    if (fallbackCount > 0) {
      console.log(`      ⚠️  WARNING: ${fallbackCount} fallback items detected!`);
    }
  }
}

function analyzeConversationSection(section) {
  const dialogues = section.dialogues || [];
  console.log(`      Dialogues: ${dialogues.length}`);
  
  if (dialogues.length > 0) {
    dialogues.slice(0, 2).forEach((dialogue, i) => {
      console.log(`         Dialogue ${i + 1}: ${dialogue.length} exchanges`);
      if (dialogue.length > 0) {
        const firstExchange = dialogue[0];
        console.log(`            "${firstExchange.speaker}: ${firstExchange.text}"`);
      }
    });
  }
}

function analyzeBusinessExamplesSection(section) {
  const examples = section.examples || [];
  console.log(`      Business examples: ${examples.length}`);
  
  if (examples.length > 0) {
    // Check for fallback patterns in business examples
    const fallbackPatterns = [
      'example sentence',
      'sample business',
      'placeholder',
      'default example',
      'lorem ipsum'
    ];
    
    let fallbackCount = 0;
    let aiGeneratedCount = 0;
    
    examples.forEach((example, i) => {
      const text = (example || '').toLowerCase();
      const isFallback = fallbackPatterns.some(pattern => text.includes(pattern));
      
      if (isFallback) {
        fallbackCount++;
        if (i < 3) console.log(`         FALLBACK: "${example}"`);
      } else {
        aiGeneratedCount++;
        if (i < 3) console.log(`         AI: "${example}"`);
      }
    });
    
    console.log(`      AI Generated: ${aiGeneratedCount}, Fallback: ${fallbackCount}`);
    
    if (fallbackCount > 0) {
      console.log(`      ⚠️  WARNING: ${fallbackCount} fallback examples detected!`);
    }
  }
}

function analyzePronunciationSection(section) {
  const items = section.vocabulary_items || [];
  console.log(`      Pronunciation items: ${items.length}`);
  
  if (items.length > 0) {
    items.slice(0, 3).forEach((item, i) => {
      console.log(`         ${i + 1}. "${item.word}" [${item.phonetic || 'no phonetic'}] - ${item.examples?.length || 0} examples`);
    });
  }
}

diagnoseFallbackContentIssue();
