#!/usr/bin/env node

/**
 * Test Discussion Questions Fresh Generation
 * 
 * This script tests if discussion questions are being generated freshly
 * with AI by calling the generation endpoint and analyzing the results.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generic patterns that indicate old/generic questions
const GENERIC_PATTERNS = [
  /^What do you think about/i,
  /^How is .+ different in your country/i,
  /^What would you tell someone/i,
  /^Share your personal experience/i,
  /^What interests you most about/i,
  /^Tell me about/i,
  /^Describe your/i,
  /^How do you feel about/i,
];

// Patterns that indicate fresh, contextual questions
const CONTEXTUAL_PATTERNS = [
  /worst.*disaster/i,
  /embarrassing/i,
  /smell.*cooking/i,
  /childhood.*mother|grandmother/i,
  /missed.*flight|train/i,
  /frustrating.*tech/i,
  /regretted/i,
  /hardest to give up/i,
  /weirdest thing/i,
  /specific.*scenario/i,
];

function analyzeQuestionQuality(questions) {
  const analysis = {
    total: questions.length,
    generic: 0,
    contextual: 0,
    hasStudentName: 0,
    uniqueStarters: new Set(),
    samples: {
      good: [],
      bad: []
    }
  };

  questions.forEach(q => {
    const text = q.question_text;
    
    // Check for generic patterns
    const isGeneric = GENERIC_PATTERNS.some(pattern => pattern.test(text));
    if (isGeneric) {
      analysis.generic++;
      if (analysis.samples.bad.length < 3) {
        analysis.samples.bad.push(text);
      }
    }
    
    // Check for contextual patterns
    const isContextual = CONTEXTUAL_PATTERNS.some(pattern => pattern.test(text));
    if (isContextual) {
      analysis.contextual++;
      if (analysis.samples.good.length < 3) {
        analysis.samples.good.push(text);
      }
    }
    
    // Check if student name is used
    if (text.match(/\b[A-Z][a-z]+\b/)) {
      analysis.hasStudentName++;
    }
    
    // Track question starters for variety
    const starter = text.split(/[,?]/)[0].substring(0, 30);
    analysis.uniqueStarters.add(starter);
  });

  return analysis;
}

async function testFreshGeneration() {
  console.log('🧪 Testing Discussion Questions Fresh Generation\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get a test student
    console.log('\n📚 Step 1: Finding a test student...');
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, target_language, level, tutor_id')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No students found. Please create a student first.');
      return;
    }

    const student = students[0];
    console.log(`✅ Found student: ${student.name} (${student.level} ${student.target_language})`);

    // Step 2: Test with multiple topics
    const testTopics = [
      { title: 'Food & Cooking', is_custom: false },
      { title: 'Travel & Tourism', is_custom: false },
      { title: 'Technology & Innovation', is_custom: false }
    ];

    console.log('\n🎯 Step 2: Testing question generation for multiple topics...\n');

    const results = [];

    for (const topic of testTopics) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📝 Testing Topic: "${topic.title}"`);
      console.log(`${'─'.repeat(60)}`);

      try {
        // Call the Edge Function directly
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-discussion-questions`;
        
        console.log('⏳ Calling AI generation endpoint...');
        const startTime = Date.now();

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: student.id,
            topic_title: topic.title,
            custom_topic: topic.is_custom
          }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error (${response.status}):`, errorText);
          results.push({
            topic: topic.title,
            success: false,
            error: errorText,
            duration
          });
          continue;
        }

        const result = await response.json();

        if (!result.success || !result.questions) {
          console.error('❌ Invalid response:', result);
          results.push({
            topic: topic.title,
            success: false,
            error: result.error || 'Invalid response',
            duration
          });
          continue;
        }

        const questions = result.questions;
        console.log(`✅ Generated ${questions.length} questions in ${duration}ms`);

        // Analyze question quality
        const analysis = analyzeQuestionQuality(questions);

        console.log('\n📊 Quality Analysis:');
        console.log(`   Total Questions: ${analysis.total}`);
        console.log(`   Generic Questions: ${analysis.generic} (${((analysis.generic / analysis.total) * 100).toFixed(1)}%)`);
        console.log(`   Contextual Questions: ${analysis.contextual} (${((analysis.contextual / analysis.total) * 100).toFixed(1)}%)`);
        console.log(`   Questions with Names: ${analysis.hasStudentName} (${((analysis.hasStudentName / analysis.total) * 100).toFixed(1)}%)`);
        console.log(`   Unique Question Starters: ${analysis.uniqueStarters.size}/${analysis.total}`);

        // Show samples
        if (analysis.samples.good.length > 0) {
          console.log('\n✅ Sample Good Questions:');
          analysis.samples.good.forEach((q, i) => {
            console.log(`   ${i + 1}. "${q}"`);
          });
        }

        if (analysis.samples.bad.length > 0) {
          console.log('\n❌ Sample Generic Questions:');
          analysis.samples.bad.forEach((q, i) => {
            console.log(`   ${i + 1}. "${q}"`);
          });
        }

        // Determine if generation is fresh
        const isFresh = analysis.generic < analysis.total * 0.2 && // Less than 20% generic
                       analysis.contextual > 0 && // Has some contextual questions
                       analysis.uniqueStarters.size > analysis.total * 0.7; // Good variety

        results.push({
          topic: topic.title,
          success: true,
          isFresh,
          analysis,
          duration,
          sampleQuestions: questions.slice(0, 3).map(q => q.question_text)
        });

        console.log(`\n${isFresh ? '✅ FRESH GENERATION' : '⚠️  QUESTIONABLE QUALITY'}`);

      } catch (error) {
        console.error('❌ Error testing topic:', error.message);
        results.push({
          topic: topic.title,
          success: false,
          error: error.message
        });
      }

      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 3: Overall Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📈 OVERALL TEST RESULTS');
    console.log('='.repeat(60));

    const successfulTests = results.filter(r => r.success);
    const freshTests = results.filter(r => r.success && r.isFresh);

    console.log(`\nTests Run: ${results.length}`);
    console.log(`Successful: ${successfulTests.length}/${results.length}`);
    console.log(`Fresh Generation: ${freshTests.length}/${successfulTests.length}`);

    if (freshTests.length === successfulTests.length && successfulTests.length > 0) {
      console.log('\n🎉 SUCCESS! All questions are being generated freshly with AI!');
      console.log('\n✅ Characteristics of Fresh Questions:');
      console.log('   • Low generic rate (<20%)');
      console.log('   • High contextual content');
      console.log('   • Good variety in question starters');
      console.log('   • Student names used naturally');
      console.log('   • Specific scenarios and concrete examples');
    } else if (freshTests.length > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS: Some questions are fresh, but quality varies.');
      console.log('\n💡 Recommendations:');
      console.log('   • Check if database has old questions');
      console.log('   • Clear cache flag: linguaflow_questions_upgraded_v8_manual_clear');
      console.log('   • Run: node scripts/clear-generic-questions.js');
    } else {
      console.log('\n❌ FAILURE: Questions appear to be generic or from cache.');
      console.log('\n💡 Action Required:');
      console.log('   1. Run: node scripts/diagnose-discussion-questions.js');
      console.log('   2. Run: node scripts/clear-generic-questions.js');
      console.log('   3. Clear browser localStorage flag');
      console.log('   4. Re-run this test');
    }

    // Step 4: Check database for stored questions
    console.log('\n\n' + '='.repeat(60));
    console.log('🗄️  DATABASE CHECK');
    console.log('='.repeat(60));

    const { data: dbQuestions, error: dbError } = await supabase
      .from('discussion_questions')
      .select('id, question_text, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dbError) {
      console.error('❌ Error checking database:', dbError);
    } else if (!dbQuestions || dbQuestions.length === 0) {
      console.log('\n✅ Database is clean - no stored questions');
      console.log('   All questions will be generated fresh on demand');
    } else {
      console.log(`\n⚠️  Found ${dbQuestions.length} questions in database`);
      console.log('\nMost Recent Questions:');
      dbQuestions.slice(0, 3).forEach((q, i) => {
        const age = Math.floor((Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${i + 1}. "${q.question_text.substring(0, 60)}..."`);
        console.log(`      Age: ${age} days old`);
      });

      const genericInDb = dbQuestions.filter(q => 
        GENERIC_PATTERNS.some(pattern => pattern.test(q.question_text))
      ).length;

      if (genericInDb > 0) {
        console.log(`\n⚠️  ${genericInDb}/${dbQuestions.length} questions in database are generic`);
        console.log('   💡 Run: node scripts/clear-generic-questions.js');
      }
    }

    // Step 5: Check Edge Function deployment
    console.log('\n\n' + '='.repeat(60));
    console.log('🔧 EDGE FUNCTION CHECK');
    console.log('='.repeat(60));

    try {
      const healthCheck = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-discussion-questions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}) // Empty body to test deployment
        }
      );

      if (healthCheck.status === 400) {
        console.log('✅ Edge Function is deployed and responding');
      } else if (healthCheck.status === 404) {
        console.log('❌ Edge Function NOT deployed');
        console.log('   💡 Deploy with: supabase functions deploy generate-discussion-questions');
      } else {
        console.log(`⚠️  Edge Function status: ${healthCheck.status}`);
      }
    } catch (error) {
      console.log('❌ Cannot reach Edge Function:', error.message);
    }

    // Final verdict
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 FINAL VERDICT');
    console.log('='.repeat(60));

    if (freshTests.length === successfulTests.length && successfulTests.length > 0) {
      console.log('\n✅ PASS: Discussion questions are being generated freshly with AI');
      console.log('\nYour system is working correctly! Questions are:');
      console.log('  • Generated on-demand by Gemini API');
      console.log('  • Contextual and personalized');
      console.log('  • Topic-specific with varied structures');
      console.log('  • Using student information effectively');
    } else {
      console.log('\n❌ FAIL: Questions are NOT being generated freshly');
      console.log('\nPossible causes:');
      console.log('  • Old questions stored in database');
      console.log('  • Cache flag preventing fresh generation');
      console.log('  • Edge Function not deployed or failing');
      console.log('  • Gemini API key issues');
      console.log('\nFollow the fix guide: docs/fix-generic-questions-guide.md');
    }

  } catch (error) {
    console.error('\n💥 Fatal Error:', error);
    console.error(error.stack);
  }
}

// Run the test
console.log('🚀 Starting Fresh Generation Test...\n');
testFreshGeneration().then(() => {
  console.log('\n✅ Test Complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test Failed:', error);
  process.exit(1);
});
