#!/usr/bin/env node

/**
 * Clear Generic Questions Script
 * 
 * This script removes generic questions from the database
 * so they can be regenerated with better AI prompts.
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
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

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function clearGenericQuestions() {
  console.log('🧹 Clear Generic Questions Script\n');

  try {
    // Get all questions
    const { data: questions, error: questionsError } = await supabase
      .from('discussion_questions')
      .select('id, question_text, topic_id, created_at');

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    if (!questions || questions.length === 0) {
      console.log('✅ No questions found in database.');
      return;
    }

    // Identify generic questions
    const genericQuestions = questions.filter(q => isGenericQuestion(q.question_text));
    const nonGenericQuestions = questions.filter(q => !isGenericQuestion(q.question_text));

    console.log(`📊 Analysis:`);
    console.log(`   Total Questions: ${questions.length}`);
    console.log(`   Generic Questions: ${genericQuestions.length} (${((genericQuestions.length / questions.length) * 100).toFixed(1)}%)`);
    console.log(`   Good Questions: ${nonGenericQuestions.length}\n`);

    if (genericQuestions.length === 0) {
      console.log('✅ No generic questions found! Nothing to clear.');
      return;
    }

    // Show samples
    console.log('📝 Sample Generic Questions to be Deleted:\n');
    genericQuestions.slice(0, 5).forEach((q, i) => {
      console.log(`${i + 1}. "${q.question_text}"`);
    });
    console.log('');

    // Ask for confirmation
    const answer = await promptUser(
      `⚠️  This will delete ${genericQuestions.length} generic questions. Continue? (yes/no): `
    );

    if (answer !== 'yes' && answer !== 'y') {
      console.log('❌ Operation cancelled.');
      return;
    }

    // Delete generic questions
    console.log('\n🗑️  Deleting generic questions...');

    const questionIds = genericQuestions.map(q => q.id);
    
    // Delete in batches of 100 to avoid timeout
    const batchSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < questionIds.length; i += batchSize) {
      const batch = questionIds.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('discussion_questions')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`❌ Error deleting batch ${i / batchSize + 1}:`, deleteError);
      } else {
        deletedCount += batch.length;
        console.log(`   Deleted ${deletedCount}/${questionIds.length} questions...`);
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} generic questions!`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Clear browser localStorage flag:`);
    console.log(`      localStorage.removeItem('linguaflow_questions_upgraded_v8_manual_clear')`);
    console.log(`   2. Reload the student profile page`);
    console.log(`   3. Click on topics to generate fresh, contextual questions\n`);

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
  }
}

// Option to clear ALL questions
async function clearAllQuestions() {
  console.log('🧹 Clear ALL Questions Script\n');

  const answer = await promptUser(
    '⚠️  WARNING: This will delete ALL questions from the database. Continue? (yes/no): '
  );

  if (answer !== 'yes' && answer !== 'y') {
    console.log('❌ Operation cancelled.');
    return;
  }

  try {
    const { error } = await supabase
      .from('discussion_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ All questions deleted successfully!');
      console.log('\n💡 All topics will now generate fresh questions on next use.\n');
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--all')) {
  clearAllQuestions().then(() => process.exit(0));
} else if (args.includes('--help')) {
  console.log(`
Usage:
  node scripts/clear-generic-questions.js          Clear only generic questions
  node scripts/clear-generic-questions.js --all    Clear ALL questions
  node scripts/clear-generic-questions.js --help   Show this help

Examples:
  # Clear only generic questions (recommended)
  node scripts/clear-generic-questions.js

  # Clear all questions (nuclear option)
  node scripts/clear-generic-questions.js --all
  `);
  process.exit(0);
} else {
  clearGenericQuestions().then(() => process.exit(0));
}
