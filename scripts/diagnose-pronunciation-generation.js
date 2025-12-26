/**
 * Diagnose Pronunciation lesson generation issues
 * Check what content is being generated for Pronunciation templates
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnosePronunciationGeneration() {
  console.log('🔍 Diagnosing Pronunciation lesson generation...\n');

  // Get a Pronunciation template
  const { data: templates } = await supabase
    .from('lesson_templates')
    .select('*')
    .eq('category', 'Pronunciation')
    .eq('is_active', true)
    .limit(1);

  if (!templates || templates.length === 0) {
    console.log('❌ No Pronunciation templates found');
    return;
  }

  const template = templates[0];
  console.log(`📋 Found template: ${template.name} (${template.level})\n`);

  // Check template structure
  console.log('📊 Template sections:');
  const sections = template.template_json.sections || [];
  sections.forEach((section, i) => {
    console.log(`\n${i + 1}. ${section.title}`);
    console.log(`   ID: ${section.id}`);
    console.log(`   Type: ${section.type}`);
    console.log(`   Content Type: ${section.content_type}`);
    console.log(`   AI Placeholder: ${section.ai_placeholder}`);
  });

  // Find the problematic sections
  console.log('\n\n🔍 Checking for problematic content types:\n');
  
  const vocabularyMatchingSection = sections.find(s => s.content_type === 'vocabulary_matching');
  if (vocabularyMatchingSection) {
    console.log('✅ Found vocabulary_matching section:');
    console.log(`   Title: ${vocabularyMatchingSection.title}`);
    console.log(`   AI Placeholder: ${vocabularyMatchingSection.ai_placeholder}`);
    console.log(`   Expected field name: ${vocabularyMatchingSection.ai_placeholder}`);
    console.log('   ⚠️  This section expects a field with vocabulary_items array');
  }

  const matchingSection = sections.find(s => s.content_type === 'matching');
  if (matchingSection) {
    console.log('\n✅ Found matching section:');
    console.log(`   Title: ${matchingSection.title}`);
    console.log(`   AI Placeholder: ${matchingSection.ai_placeholder}`);
    console.log(`   Expected field name: ${matchingSection.ai_placeholder}`);
    console.log('   ⚠️  This section expects a field with matching_questions array');
  }

  // Check recent lesson history for Pronunciation lessons
  console.log('\n\n📚 Checking recent Pronunciation lesson history...\n');
  
  const { data: recentLessons } = await supabase
    .from('lesson_history')
    .select('*')
    .eq('lesson_template_id', template.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (recentLessons && recentLessons.length > 0) {
    const lesson = recentLessons[0];
    console.log(`Found recent lesson: ${lesson.sub_topic_title}`);
    console.log(`Created: ${new Date(lesson.created_at).toLocaleString()}\n`);

    const interactiveContent = lesson.interactive_lesson_content;
    if (interactiveContent && interactiveContent.sections) {
      console.log('🔍 Checking generated content for each section:\n');
      
      interactiveContent.sections.forEach((section, i) => {
        console.log(`${i + 1}. ${section.title}`);
        console.log(`   Content Type: ${section.content_type}`);
        console.log(`   AI Placeholder: ${section.ai_placeholder}`);
        
        // Check if the expected field exists
        const expectedField = section.ai_placeholder;
        if (section[expectedField]) {
          console.log(`   ✅ Field "${expectedField}" exists`);
          
          // Check for vocabulary_items
          if (section.content_type === 'vocabulary_matching' || section.content_type === 'vocabulary') {
            if (section[expectedField].vocabulary_items) {
              console.log(`   ✅ Has vocabulary_items: ${section[expectedField].vocabulary_items.length} items`);
            } else {
              console.log(`   ❌ Missing vocabulary_items array in "${expectedField}"`);
              console.log(`   Content structure:`, Object.keys(section[expectedField]));
            }
          }
          
          // Check for matching_questions
          if (section.content_type === 'matching') {
            if (section[expectedField].matching_questions) {
              console.log(`   ✅ Has matching_questions: ${section[expectedField].matching_questions.length} questions`);
            } else {
              console.log(`   ❌ Missing matching_questions array in "${expectedField}"`);
              console.log(`   Content structure:`, Object.keys(section[expectedField]));
            }
          }
        } else {
          console.log(`   ❌ Field "${expectedField}" does NOT exist`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No interactive content found in lesson');
    }
  } else {
    console.log('⚠️  No recent Pronunciation lessons found');
  }

  console.log('\n📋 DIAGNOSIS SUMMARY:\n');
  console.log('The issue is likely that the AI is not generating the correct structure for:');
  console.log('1. vocabulary_matching sections - needs vocabulary_items array');
  console.log('2. matching sections - needs matching_questions array');
  console.log('\nThe AI prompt may need specific instructions for these Pronunciation-specific content types.');
}

diagnosePronunciationGeneration();
