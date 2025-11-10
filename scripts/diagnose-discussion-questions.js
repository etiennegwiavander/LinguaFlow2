#!/usr/bin/env node

/**
 * Diagnostic Script: Check Discussion Questions Quality
 * 
 * This script analyzes the questions in your database to detect:
 * - Generic question patterns
 * - Question age and freshness
 * - Topics with old questions
 * - Cache status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generic patterns to detect old questions
const GENERIC_PATTERNS = [
  /^What do you think about/i,
  /^How is .+ different in your country/i,
  /^What would you tell someone/i,
  /^Share your personal experience/i,
  /^What interests you most about/i,
  /^How does understanding .+ help you achieve/i,
  /^What vocabulary related to .+ do you find/i,
  /^How would discussing .+ help you in real-life/i,
  /^From your perspective as a .+ learner/i,
  /^What questions would you ask a native/i,
  /^Tell me about/i,
  /^Describe your/i,
  /^How do you feel about/i,
];

function isGenericQuestion(questionText) {
  return GENERIC_PATTERNS.some(pattern => pattern.test(questionText));
}

async function analyzeQuestions() {
  console.log('🔍 Analyzing Discussion Questions...\n');

  try {
    // Get all questions with their topics
    const { data: questions, error: questionsError } = await supabase
      .from('discussion_questions')
      .select(`
        id,
        question_text,
        topic_id,
        created_at,
        difficulty_level,
        question_order
      `)
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    if (!questions || questions.length === 0) {
      console.log('✅ No questions found in database - all questions will be freshly generated!');
      return;
    }

    console.log(`📊 Total Questions: ${questions.length}\n`);

    // Analyze by topic
    const topicMap = new Map();
    let totalGeneric = 0;

    questions.forEach(q => {
      if (!topicMap.has(q.topic_id)) {
        topicMap.set(q.topic_id, {
          questions: [],
          genericCount: 0,
          oldestDate: q.created_at,
          newestDate: q.created_at
        });
      }

      const topicData = topicMap.get(q.topic_id);
      topicData.questions.push(q);

      if (isGenericQuestion(q.question_text)) {
        topicData.genericCount++;
        totalGeneric++;
      }

      // Track dates
      if (new Date(q.created_at) < new Date(topicData.oldestDate)) {
        topicData.oldestDate = q.created_at;
      }
      if (new Date(q.created_at) > new Date(topicData.newestDate)) {
        topicData.newestDate = q.created_at;
      }
    });

    // Get topic details
    const { data: topics, error: topicsError } = await supabase
      .from('discussion_topics')
      .select('id, title, is_custom, student_id')
      .in('id', Array.from(topicMap.keys()));

    if (topicsError) {
      console.error('❌ Error fetching topics:', topicsError);
      return;
    }

    // Create topic lookup
    const topicLookup = new Map(topics?.map(t => [t.id, t]) || []);

    // Report findings
    console.log('📈 Analysis Results:\n');
    console.log(`Generic Questions: ${totalGeneric} / ${questions.length} (${((totalGeneric / questions.length) * 100).toFixed(1)}%)\n`);

    console.log('🎯 Topics with Generic Questions:\n');

    const problematicTopics = [];

    topicMap.forEach((data, topicId) => {
      const topic = topicLookup.get(topicId);
      const genericPercentage = (data.genericCount / data.questions.length) * 100;
      
      if (genericPercentage > 20) { // More than 20% generic
        problematicTopics.push({
          topicId,
          title: topic?.title || 'Unknown',
          isCustom: topic?.is_custom || false,
          genericPercentage,
          totalQuestions: data.questions.length,
          genericCount: data.genericCount,
          oldestDate: data.oldestDate,
          newestDate: data.newestDate
        });
      }
    });

    if (problematicTopics.length === 0) {
      console.log('✅ No problematic topics found! All questions look good.\n');
    } else {
      problematicTopics
        .sort((a, b) => b.genericPercentage - a.genericPercentage)
        .forEach(topic => {
          console.log(`❌ ${topic.title}`);
          console.log(`   Type: ${topic.isCustom ? 'Custom' : 'Predefined'}`);
          console.log(`   Generic: ${topic.genericCount}/${topic.totalQuestions} (${topic.genericPercentage.toFixed(1)}%)`);
          console.log(`   Age: ${new Date(topic.oldestDate).toLocaleDateString()} - ${new Date(topic.newestDate).toLocaleDateString()}`);
          console.log('');
        });
    }

    // Show sample generic questions
    console.log('📝 Sample Generic Questions:\n');
    const genericQuestions = questions.filter(q => isGenericQuestion(q.question_text)).slice(0, 5);
    genericQuestions.forEach((q, i) => {
      const topic = topicLookup.get(q.topic_id);
      console.log(`${i + 1}. "${q.question_text}"`);
      console.log(`   Topic: ${topic?.title || 'Unknown'}`);
      console.log(`   Created: ${new Date(q.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Recommendations
    console.log('💡 Recommendations:\n');

    if (totalGeneric > questions.length * 0.2) {
      console.log('⚠️  HIGH GENERIC RATE DETECTED');
      console.log('   → Run: node scripts/clear-generic-questions.js');
      console.log('   → Or manually clear localStorage flag: linguaflow_questions_upgraded_v8_manual_clear\n');
    }

    if (problematicTopics.length > 0) {
      console.log(`⚠️  ${problematicTopics.length} TOPICS NEED REGENERATION`);
      console.log('   → These topics have >20% generic questions');
      console.log('   → Consider clearing questions for these topics\n');
    }

    const oldQuestions = questions.filter(q => {
      const age = Date.now() - new Date(q.created_at).getTime();
      const daysSinceCreation = age / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 7; // Older than 7 days
    });

    if (oldQuestions.length > 0) {
      console.log(`⚠️  ${oldQuestions.length} QUESTIONS ARE OLDER THAN 7 DAYS`);
      console.log('   → Consider regenerating for freshness\n');
    }

    // Check localStorage (if running in browser context)
    if (typeof window !== 'undefined') {
      const upgradeFlag = localStorage.getItem('linguaflow_questions_upgraded_v8_manual_clear');
      console.log(`🔧 Cache Status:`);
      console.log(`   Upgrade Flag: ${upgradeFlag ? '✅ Set' : '❌ Not Set'}`);
      
      if (upgradeFlag) {
        console.log('   → Cache clearing has already run once');
        console.log('   → To force re-clearing, remove this flag\n');
      }
    }

  } catch (error) {
    console.error('💥 Error during analysis:', error);
  }
}

// Run the analysis
analyzeQuestions().then(() => {
  console.log('✅ Analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
