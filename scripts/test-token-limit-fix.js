const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTokenLimitFix() {
  console.log('🧪 Testing Token Limit Fix (10000 tokens)\n');
  console.log('='.repeat(60));

  try {
    // 1. Find a business or conversation template
    console.log('\n📋 Step 1: Finding business/conversation templates...');
    
    const { data: templates, error: templateError } = await supabase
      .from('lesson_templates')
      .select('id, name, category')
      .or('category.eq.Business English,category.eq.Conversation')
      .limit(2);

    if (templateError || !templates || templates.length === 0) {
      console.error('❌ Error fetching templates:', templateError);
      return;
    }

    console.log(`✅ Found ${templates.length} templates:`);
    templates.forEach(t => console.log(`   - ${t.name} (${t.category})`));

    // 2. Find a recent lesson using one of these templates
    console.log('\n📋 Step 2: Finding recent lesson...');
    
    const templateIds = templates.map(t => t.id);
    
    const { data: lessons, error: lessonError } = await supabase
      .from('lessons')
      .select('id, created_at, lesson_template_id, student:students(name, level)')
      .in('lesson_template_id', templateIds)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lessonError || !lessons || lessons.length === 0) {
      console.error('❌ No lessons found');
      return;
    }

    const lesson = lessons[0];
    console.log(`✅ Found lesson: ${lesson.id}`);
    console.log(`   Student: ${lesson.student?.name}`);
    console.log(`   Level: ${lesson.student?.level}`);

    // 3. Get the lesson's sub-topic
    console.log('\n📋 Step 3: Getting lesson sub-topic...');
    
    const { data: lessonData, error: lessonDataError } = await supabase
      .from('lessons')
      .select('interactive_lesson_content')
      .eq('id', lesson.id)
      .single();

    if (lessonDataError || !lessonData) {
      console.error('❌ Error fetching lesson data:', lessonDataError);
      return;
    }

    const content = typeof lessonData.interactive_lesson_content === 'string'
      ? JSON.parse(lessonData.interactive_lesson_content)
      : lessonData.interactive_lesson_content;

    const subTopic = content.selected_sub_topic;
    
    if (!subTopic) {
      console.error('❌ No sub-topic found in lesson');
      return;
    }

    console.log(`✅ Sub-topic: ${subTopic.title}`);
    console.log(`   Category: ${subTopic.category}`);
    console.log(`   Level: ${subTopic.level}`);

    // 4. Regenerate the lesson with new token limit
    console.log('\n📋 Step 4: Regenerating lesson with 10000 token limit...');
    console.log('   This will test if the full content is generated without truncation');
    
    const { data: authData } = await supabase.auth.getSession();
    
    if (!authData.session) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }

    const { data: regenerateData, error: regenerateError } = await supabase.functions.invoke(
      'generate-interactive-material',
      {
        body: {
          lesson_id: lesson.id,
          selected_sub_topic: subTopic
        }
      }
    );

    if (regenerateError) {
      console.error('❌ Regeneration error:', regenerateError);
      return;
    }

    console.log('✅ Lesson regenerated successfully!');

    // 5. Analyze the regenerated content
    console.log('\n📋 Step 5: Analyzing regenerated content...');
    
    const { data: updatedLesson, error: updatedError } = await supabase
      .from('lessons')
      .select('interactive_lesson_content')
      .eq('id', lesson.id)
      .single();

    if (updatedError || !updatedLesson) {
      console.error('❌ Error fetching updated lesson:', updatedError);
      return;
    }

    const updatedContent = typeof updatedLesson.interactive_lesson_content === 'string'
      ? JSON.parse(updatedLesson.interactive_lesson_content)
      : updatedLesson.interactive_lesson_content;

    const sections = updatedContent.sections || [];
    
    console.log(`\n📊 Content Analysis:`);
    console.log(`   Total sections: ${sections.length}`);

    // Check for business examples
    let businessExamplesFound = false;
    let businessExampleCount = 0;
    let fallbackCount = 0;

    sections.forEach((section, index) => {
      if (section.content_type === 'list' && 
          (section.ai_placeholder === 'useful_expressions' || 
           section.ai_placeholder === 'practice_activities')) {
        
        const items = section[section.ai_placeholder] || [];
        console.log(`\n   Section ${index + 1}: ${section.title}`);
        console.log(`      Type: ${section.content_type}`);
        console.log(`      Items: ${items.length}`);

        if (items.length > 0) {
          businessExamplesFound = true;
          businessExampleCount = items.length;

          // Check for fallback patterns
          items.forEach((item, i) => {
            const text = (item || '').toLowerCase();
            const isFallback = text.includes('word') || 
                              text.includes('example') ||
                              text.includes('placeholder') ||
                              text.length < 20;
            
            if (isFallback) {
              fallbackCount++;
              console.log(`      ${i + 1}. ⚠️  FALLBACK: "${item}"`);
            } else {
              console.log(`      ${i + 1}. ✅ AI: "${item.substring(0, 60)}${item.length > 60 ? '...' : ''}"`);
            }
          });
        }
      }

      // Check vocabulary items
      if (section.vocabulary_items && section.vocabulary_items.length > 0) {
        console.log(`\n   Section ${index + 1}: ${section.title}`);
        console.log(`      Vocabulary items: ${section.vocabulary_items.length}`);
        
        section.vocabulary_items.slice(0, 3).forEach((item, i) => {
          const exampleCount = item.examples?.length || 0;
          const hasGeneric = item.examples?.some(ex => 
            ex.toLowerCase().includes('the word is') ||
            ex.toLowerCase().includes('understanding different types of word')
          ) || false;
          
          console.log(`      ${i + 1}. "${item.word}"`);
          console.log(`         Examples: ${exampleCount}`);
          if (hasGeneric) {
            console.log(`         ⚠️  Contains generic fallback examples`);
          } else {
            console.log(`         ✅ All examples appear AI-generated`);
          }
        });
      }
    });

    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST RESULTS SUMMARY:\n');
    
    if (businessExamplesFound) {
      console.log(`✅ Business examples found: ${businessExampleCount} items`);
      console.log(`   AI-generated: ${businessExampleCount - fallbackCount}`);
      console.log(`   Fallback: ${fallbackCount}`);
      
      if (fallbackCount === 0) {
        console.log('\n🎉 SUCCESS! All content is AI-generated, no fallback content detected!');
      } else if (fallbackCount < businessExampleCount / 2) {
        console.log('\n✅ IMPROVED! Fallback content reduced significantly.');
      } else {
        console.log('\n⚠️  STILL ISSUES: Significant fallback content detected.');
      }
    } else {
      console.log('ℹ️  No business examples section found in this template.');
      console.log('   Try testing with a different lesson type.');
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Generate a new business lesson from scratch');
    console.log('   2. Check if all 7 example sentences are AI-generated');
    console.log('   3. Verify conversation dialogues are complete');
    console.log('   4. Monitor for any generic fallback patterns');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test complete!\n');
}

testTokenLimitFix();
