#!/usr/bin/env node

/**
 * Quick test to verify enhanced grammar explanations are working in production
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function testEnhancedGrammarLive() {
  console.log('🧪 Testing Enhanced Grammar Explanation (Live)...\n');

  try {
    // Get a real student and lesson
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('❌ No students found for testing');
      return;
    }

    const student = students[0];
    console.log('👤 Using student:', student.name, `(${student.level})`);

    // Get an existing lesson or create one
    let { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .limit(1);

    let lesson;
    if (lessons && lessons.length > 0) {
      lesson = lessons[0];
      console.log('📚 Using existing lesson:', lesson.id);
    } else {
      console.log('📝 No existing lessons found');
      return;
    }

    // Check if lesson has interactive content with grammar explanation
    if (lesson.interactive_lesson_content) {
      const grammarSection = lesson.interactive_lesson_content.sections?.find(
        section => section.id === 'grammar_explanation'
      );

      if (grammarSection) {
        const grammarContent = grammarSection.grammar_explanation || grammarSection.content || '';
        
        console.log('\n📊 Grammar Explanation Analysis:');
        console.log('=====================================');
        console.log('📝 Content Length:', grammarContent.length, 'characters');
        
        // Check for enhanced structure elements
        const checks = {
          'Formation Rules': grammarContent.includes('Formation Rules') || grammarContent.includes('How to form'),
          'Examples Section': grammarContent.includes('Examples') || grammarContent.includes('**Positive') || grammarContent.includes('**Negative'),
          'Usage Context': grammarContent.includes('When to Use') || grammarContent.includes('Usage'),
          'Common Mistakes': grammarContent.includes('Common Mistakes') || grammarContent.includes('❌'),
          'Memory Tips': grammarContent.includes('Memory Tips') || grammarContent.includes('Remember'),
          'Multiple Headers': (grammarContent.match(/###? /g) || []).length >= 3,
          'Structured Content': grammarContent.length > 300
        };

        console.log('\n🔍 Enhancement Check:');
        Object.entries(checks).forEach(([check, passed]) => {
          console.log(`${passed ? '✅' : '❌'} ${check}`);
        });

        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        console.log(`\n📈 Enhancement Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

        if (passedChecks >= 5) {
          console.log('🎉 SUCCESS: Enhanced grammar explanations are working!');
        } else {
          console.log('⚠️ PARTIAL: Some enhancements detected, may need new lesson generation');
        }

        console.log('\n📄 Content Preview (first 300 chars):');
        console.log('=====================================');
        console.log(grammarContent.substring(0, 300) + '...');

      } else {
        console.log('❌ No grammar explanation section found in lesson');
      }
    } else {
      console.log('❌ No interactive content found in lesson');
      console.log('💡 Try generating a new grammar lesson to see enhanced explanations');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEnhancedGrammarLive();