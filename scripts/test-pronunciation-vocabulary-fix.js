const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPronunciationVocabularyFix() {
  console.log('🧪 Testing Pronunciation Vocabulary Fix\n');
  console.log('=' .repeat(80));

  try {
    // Find a student with B1 or A2 level for testing
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('level', ['a2', 'b1', 'b2'])
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.log('❌ No suitable test student found');
      console.log('Please create an A2, B1, or B2 level student first');
      return;
    }

    const testStudent = students[0];
    console.log(`\n✅ Test Student: ${testStudent.name} (Level: ${testStudent.level.toUpperCase()})`);

    // Get Pronunciation template for this level
    const { data: template, error: templateError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('category', 'Pronunciation')
      .eq('level', testStudent.level.toLowerCase())
      .single();

    if (templateError || !template) {
      console.log(`❌ No Pronunciation template found for level ${testStudent.level}`);
      return;
    }

    console.log(`✅ Found template: ${template.name}`);

    // Check template structure
    const sections = template.template_json.sections;
    const vocabSections = sections.filter(s => s.content_type === 'vocabulary_matching');

    console.log(`\n📋 Template Analysis:`);
    console.log(`   Total Sections: ${sections.length}`);
    console.log(`   Vocabulary Sections: ${vocabSections.length}`);

    vocabSections.forEach((section, idx) => {
      console.log(`\n   Vocab Section ${idx + 1}:`);
      console.log(`   - ID: ${section.id}`);
      console.log(`   - Title: ${section.title}`);
      console.log(`   - AI Placeholder: ${section.ai_placeholder}`);
    });

    console.log(`\n\n🎯 RECOMMENDATION:`);
    console.log('─'.repeat(80));
    console.log(`To test the fix:`);
    console.log(`1. Generate a new Pronunciation lesson for ${testStudent.name}`);
    console.log(`2. Check the "Word List Practice" sections`);
    console.log(`3. Verify each vocabulary word has 3 example sentences`);
    console.log(`4. Confirm examples use the actual word (not generic fallback)`);
    console.log(`\nExample of what you should see:`);
    console.log(`\n   Word: "walked"`);
    console.log(`   Pronunciation: /wɔːkt/`);
    console.log(`   Meaning: past tense of walk`);
    console.log(`   Examples:`);
    console.log(`   1. "She walked to school every morning."`);
    console.log(`   2. "They walked along the beach at sunset."`);
    console.log(`   3. "He walked his dog in the park yesterday."`);

    console.log(`\n\n✅ TEST PREPARATION COMPLETE`);
    console.log(`\nNext step: Generate a Pronunciation lesson and verify the fix!`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPronunciationVocabularyFix();
