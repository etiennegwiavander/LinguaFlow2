#!/usr/bin/env node

/**
 * Check Discussion Questions Edge Function Logs
 * This helps diagnose why the function might be failing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Discussion Questions Edge Function\n');
console.log('='.repeat(60));

// Check environment
console.log('\n📋 Environment Check:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   OPENROUTER_API_KEY (local): ${process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}`);

console.log('\n💡 Note: The Edge Function needs OPENROUTER_API_KEY set in Supabase secrets');
console.log('   Run: supabase secrets list');
console.log('   To check if it\'s set in Supabase');

console.log('\n\n' + '='.repeat(60));
console.log('🧪 Testing Edge Function Directly');
console.log('='.repeat(60));

async function testEdgeFunction() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get a test student
    const { data: students } = await supabase
      .from('students')
      .select('id, name, level, target_language')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('\n❌ No students found for testing');
      return;
    }

    const student = students[0];
    console.log(`\n✅ Using student: ${student.name} (${student.level} ${student.target_language})`);

    // Call the Edge Function
    console.log('\n⏳ Calling Edge Function...');
    const startTime = Date.now();

    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-discussion-questions`;
    
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
    console.log(`\n📊 Response Status: ${response.status} (${duration}ms)`);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.log('\n❌ Error Response:');
      console.log(responseText);
      
      console.log('\n💡 Common Issues:');
      console.log('   1. OPENROUTER_API_KEY not set in Supabase secrets');
      console.log('   2. API key is invalid or expired');
      console.log('   3. Edge Function not deployed');
      console.log('   4. Network/firewall issues');
      
      console.log('\n🔧 Solutions:');
      console.log('   1. Set secret: supabase secrets set OPENROUTER_API_KEY="your-key"');
      console.log('   2. Verify secret: supabase secrets list');
      console.log('   3. Redeploy function: supabase functions deploy generate-discussion-questions');
      console.log('   4. Wait 2 minutes after setting secret');
      
      return;
    }

    try {
      const result = JSON.parse(responseText);
      
      if (result.success && result.questions) {
        console.log(`\n✅ SUCCESS! Generated ${result.questions.length} questions`);
        
        console.log('\n📝 Sample Questions:');
        result.questions.slice(0, 3).forEach((q, i) => {
          console.log(`   ${i + 1}. "${q.question_text}"`);
        });
        
        // Check if questions are AI-generated or fallback
        const firstQuestion = result.questions[0].question_text;
        if (firstQuestion.includes('tell me about a personal experience') ||
            firstQuestion.includes('Describe a time when')) {
          console.log('\n⚠️  WARNING: These look like fallback questions, not AI-generated!');
          console.log('   The Edge Function is using emergency fallback.');
          console.log('   This means OPENROUTER_API_KEY is not working.');
        } else {
          console.log('\n🎉 Questions appear to be AI-generated!');
        }
      } else {
        console.log('\n❌ Unexpected response format:');
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse response:');
      console.log(responseText);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error);
  }
}

testEdgeFunction().then(() => {
  console.log('\n✅ Check complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
