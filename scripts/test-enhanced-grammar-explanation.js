#!/usr/bin/env node

/**
 * Test Enhanced Grammar Explanation Generation
 * 
 * This script tests the enhanced grammar explanation functionality
 * to ensure it generates comprehensive, structured content like the reference image.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testEnhancedGrammarExplanation() {
  console.log('🧪 Testing Enhanced Grammar Explanation Generation...\n');

  try {
    // Test data
    const testSubTopic = {
      id: 'present-perfect-continuous',
      title: 'Present Perfect Continuous',
      category: 'Grammar',
      level: 'b1',
      description: 'Learn how to form and use the Present Perfect Continuous tense'
    };

    // Get a real student from the database
    console.log('👤 Fetching test student...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (studentError || !students || students.length === 0) {
      console.error('❌ No students found for testing:', studentError);
      return;
    }

    const testStudent = students[0];
    console.log('✅ Using student:', testStudent.name, `(${testStudent.level})`);

    // Create a test lesson
    console.log('📝 Creating test lesson...');
    // Get the tutor ID for this student
    const { data: tutorData } = await supabase
      .from('lessons')
      .select('tutor_id')
      .eq('student_id', testStudent.id)
      .limit(1);

    const tutorId = tutorData?.[0]?.tutor_id || 'test-tutor-123';

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        student_id: testStudent.id,
        tutor_id: tutorId,
        date: new Date().toISOString(),
        status: 'scheduled',
        materials: [],
        notes: 'Test lesson for enhanced grammar explanation'
      })
      .select()
      .single();

    if (lessonError) {
      console.error('❌ Error creating test lesson:', lessonError);
      return;
    }

    console.log('✅ Test lesson created:', lesson.id);

    // Test the enhanced grammar explanation generation
    console.log('\n🤖 Testing AI generation with enhanced prompts...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-interactive-material`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lesson_id: lesson.id,
        selected_sub_topic: testSubTopic
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Interactive material generated successfully');

    // Analyze the generated grammar explanation
    const interactiveContent = result.interactive_content;
    const grammarSection = interactiveContent.sections?.find(
      section => section.id === 'grammar_explanation'
    );

    if (!grammarSection) {
      console.log('⚠️ No grammar explanation section found');
      return;
    }

    console.log('\n📊 Grammar Explanation Analysis:');
    console.log('=====================================');

    const grammarContent = grammarSection.grammar_explanation || grammarSection.content || '';
    
    if (!grammarContent) {
      console.log('❌ No grammar explanation content generated');
      return;
    }

    console.log('📝 Content Length:', grammarContent.length, 'characters');
    console.log('📏 Content Preview (first 200 chars):');
    console.log(grammarContent.substring(0, 200) + '...\n');

    // Check for enhanced structure elements
    const structureChecks = {
      'Formation Rules': grammarContent.includes('Formation Rules') || grammarContent.includes('How to form'),
      'Examples Section': grammarContent.includes('Examples') || grammarContent.includes('**Positive') || grammarContent.includes('**Negative'),
      'Usage Context': grammarContent.includes('When to Use') || grammarContent.includes('Usage') || grammarContent.includes('Context'),
      'Common Mistakes': grammarContent.includes('Common Mistakes') || grammarContent.includes('❌') || grammarContent.includes('✅'),
      'Memory Tips': grammarContent.includes('Memory Tips') || grammarContent.includes('Remember') || grammarContent.includes('Tips'),
      'Multiple Examples': (grammarContent.match(/- /g) || []).length >= 5,
      'Structured Headers': (grammarContent.match(/###? /g) || []).length >= 3,
      'Markdown Formatting': grammarContent.includes('**') || grammarContent.includes('###')
    };

    console.log('🔍 Structure Analysis:');
    Object.entries(structureChecks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });

    const passedChecks = Object.values(structureChecks).filter(Boolean).length;
    const totalChecks = Object.keys(structureChecks).length;
    
    console.log(`\n📈 Enhancement Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

    if (passedChecks >= 6) {
      console.log('🎉 EXCELLENT: Grammar explanation is comprehensive and well-structured!');
    } else if (passedChecks >= 4) {
      console.log('👍 GOOD: Grammar explanation has good structure but could be enhanced further');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Grammar explanation lacks comprehensive structure');
    }

    // Show full content for manual review
    console.log('\n📄 Full Grammar Explanation Content:');
    console.log('=====================================');
    console.log(grammarContent);

    // Cleanup test lesson
    console.log('\n🧹 Cleaning up test lesson...');
    await supabase
      .from('lessons')
      .delete()
      .eq('id', lesson.id);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedGrammarExplanation();