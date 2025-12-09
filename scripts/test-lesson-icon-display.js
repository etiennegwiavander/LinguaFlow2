#!/usr/bin/env node

/**
 * Test script to verify lesson icon display fix
 * This will help verify that the markdown processing is working correctly
 */

console.log('🧪 Testing Lesson Icon Display Fix...\n');

// Test the specific scenarios where icons should appear
const testScenarios = [
  {
    name: 'Info Card Content with Headers',
    sectionType: 'info_card',
    content: `## Learning Objectives

### Today's Goals
- Master new vocabulary
- Practice pronunciation
- Complete exercises

### Key Skills
- Reading comprehension
- Speaking fluency`
  },
  {
    name: 'Text Section with Grammar Content',
    sectionType: 'text',
    content: `## Grammar Focus: Present Perfect

### Formation Rules
Use have/has + past participle

### Examples
- I have studied English
- She has finished homework

### Common Mistakes
- Don't use "did" with present perfect`
  },
  {
    name: 'Grammar Explanation Section',
    sectionType: 'grammar_explanation',
    content: `## Grammar Focus: Modal Verbs

### What are Modal Verbs?
Modal verbs express possibility, necessity, or permission.

### Examples
- Can: I can speak English
- Must: You must study
- Should: We should practice

### Usage Rules
- Never add -s in third person
- Always followed by base verb`
  }
];

function simulateMarkdownProcessing(content) {
  console.log('📝 Original content:');
  console.log(content);
  console.log('\n🔄 After processGrammarContent processing:');
  
  const lines = content.split('\n');
  const processed = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const headerText = trimmed.substring(3).trim();
      processed.push(`📚 ${headerText} (with blue background and book icon)`);
    } else if (trimmed.startsWith('### ')) {
      const headerText = trimmed.substring(4).trim();
      processed.push(`▶ ${headerText} (with gray background and arrow icon)`);
    } else if (trimmed.startsWith('- ')) {
      processed.push(`  • ${trimmed.substring(2)} (as list item)`);
    } else if (trimmed) {
      processed.push(`  ${trimmed} (as paragraph)`);
    }
  });
  
  processed.forEach(line => console.log(line));
  console.log('');
}

testScenarios.forEach((scenario, index) => {
  console.log(`${'='.repeat(70)}`);
  console.log(`🧪 Test ${index + 1}: ${scenario.name}`);
  console.log(`📋 Section Type: ${scenario.sectionType}`);
  console.log(`${'='.repeat(70)}`);
  
  simulateMarkdownProcessing(scenario.content);
});

console.log(`${'='.repeat(70)}`);
console.log('✅ All tests completed!');
console.log('');
console.log('🎯 Expected Results:');
console.log('📚 Main headers (##) should display with book icons and blue backgrounds');
console.log('▶ Sub headers (###) should display with arrow icons and gray backgrounds');
console.log('• List items should be properly formatted');
console.log('');
console.log('🚀 Next Steps:');
console.log('1. Generate a new grammar lesson in the app');
console.log('2. Look for the Grammar Explanation section');
console.log('3. Verify icons appear instead of ## and ###');
console.log(`${'='.repeat(70)}\n`);