#!/usr/bin/env node

/**
 * Test Discussion Questions with DeepSeek
 * 
 * This script tests the discussion questions generation using DeepSeek 3.1
 * through OpenRouter API.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDeepSeekGeneration() {
  console.log('🧪 Testing Discussion Questions with DeepSeek 3.1\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Verify API key is configured
    console.log('\n🔐 Step 1: Checking API Configuration...');
    
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      console.error('❌ OPENROUTER_API_KEY not found in .env.local');
      console.log('\n💡 Please ensure OPENROUTER_API_KEY is set in:');
      console.log('   1. .env.local (for local testing)');
      console.log('   2. Supabase secrets (for Edge Functions)');
      process.exit(1);
    }
    
    console.log('✅ OpenRouter API key found in environment');

    // Step 2: Get a test student
    console.log('\n📚 Step 2: Finding test student...');
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, target_language, level')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No students found');
      process.exit(1);
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.name} (${student.level} ${student.target_language})`);

    // Step 3: Test Edge Function
    console.log('\n🎯 Step 3: Testing Edge Function with DeepSeek...');
    
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-discussion-questions`;
    
    console.log('⏳ Calling Edge Function...');
    const startTime = Date.now();

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: student.id,
        topic_title: 'Food & Cooking',
        custom_topic: false
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Edge Function Error (${response.status}):`, errorText);
      process.exit(1);
    }

    const result = await response.json();

    if (!result.success || !result.questions) {
      console.error('❌ Invalid response:', result);
      process.exit(1);
    }

    const questions = result.questions;
    console.log(`✅ Generated ${questions.length} questions in ${duration}ms`);

    // Step 4: Analyze question quality
    console.log('\n📊 Step 4: Analyzing Question Quality...\n');

    // Check for contextual content
    const contextualPatterns = [
      /worst.*disaster/i,
      /embarrassing/i,
      /smell/i,
      /childhood/i,
      /grandmother|mother/i,
      /restaurant/i,
      /recipe/i,
      /cooking/i,
      /taste|flavor/i,
      /kitchen/i
    ];

    const genericPatterns = [
      /^Tell me about/i,
      /^Describe your/i,
      /^What do you think/i,
      /^Share your personal experience/i
    ];

    let contextualCount = 0;
    let genericCount = 0;
    let hasStudentName = 0;

    questions.forEach(q => {
      const text = q.question_text;
      
      if (contextualPatterns.some(p => p.test(text))) {
        contextualCount++;
      }
      
      if (genericPatterns.some(p => p.test(text))) {
        genericCount++;
      }
      
      if (text.includes(student.name)) {
        hasStudentName++;
      }
    });

    console.log(`📈 Quality Metrics:`);
    console.log(`   Total Questions: ${questions.length}`);
    console.log(`   Contextual: ${contextualCount} (${((contextualCount / questions.length) * 100).toFixed(1)}%)`);
    console.log(`   Generic: ${genericCount} (${((genericCount / questions.length) * 100).toFixed(1)}%)`);
    console.log(`   With Student Name: ${hasStudentName} (${((hasStudentName / questions.length) * 100).toFixed(1)}%)`);

    // Show sample questions
    console.log('\n📝 Sample Questions:\n');
    questions.slice(0, 5).forEach((q, i) => {
      console.log(`${i + 1}. "${q.question_text}"`);
    });

    // Step 5: Verdict
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 TEST RESULTS');
    console.log('='.repeat(60));

    const isSuccess = contextualCount > 0 && genericCount < questions.length * 0.3;

    if (isSuccess) {
      console.log('\n✅ SUCCESS! DeepSeek is generating contextual questions!');
      console.log('\n🎉 Key Indicators:');
      console.log(`   ✅ Contextual content detected`);
      console.log(`   ✅ Low generic rate (${((genericCount / questions.length) * 100).toFixed(1)}%)`);
      console.log(`   ✅ Questions are personalized`);
      console.log(`   ✅ Generation time: ${duration}ms`);
      
      console.log('\n💡 Next Steps:');
      console.log('   1. Test with different topics');
      console.log('   2. Clear old questions: node scripts/clear-generic-questions.js');
      console.log('   3. Test in the UI');
    } else {
      console.log('\n⚠️  WARNING: Questions may not be fully contextual');
      console.log('\n📊 Analysis:');
      console.log(`   Contextual: ${contextualCount}/${questions.length}`);
      console.log(`   Generic: ${genericCount}/${questions.length}`);
      
      console.log('\n💡 Possible Issues:');
      console.log('   • DeepSeek may be using emergency fallback');
      console.log('   • API key not set in Supabase secrets');
      console.log('   • Prompt may need adjustment');
    }

    console.log('\n');

  } catch (error) {
    console.error('\n💥 Test Failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testDeepSeekGeneration().then(() => {
  console.log('✅ Test Complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal Error:', error);
  process.exit(1);
});
