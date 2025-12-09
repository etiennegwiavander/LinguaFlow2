#!/usr/bin/env node

/**
 * Test script to verify that markdown headers are properly converted to icons
 * This simulates the processGrammarContent function behavior
 */

console.log('🧪 Testing Markdown Icon Fix...\n');

// Simulate the processGrammarContent function logic
function testProcessGrammarContent(content) {
  console.log('📝 Input content:');
  console.log(content);
  console.log('\n🔄 Processing...\n');

  const lines = content.split('\n');
  const processedElements = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('## ')) {
      const headerText = trimmedLine.substring(3).trim();
      console.log(`✅ Found H2 header: "${headerText}" → Will show 📚 icon`);
      processedElements.push(`📚 ${headerText}`);
    } else if (trimmedLine.startsWith('### ')) {
      const headerText = trimmedLine.substring(4).trim();
      console.log(`✅ Found H3 header: "${headerText}" → Will show ▶ icon`);
      processedElements.push(`▶ ${headerText}`);
    } else if (trimmedLine && !trimmedLine.startsWith('#')) {
      console.log(`📄 Regular content: "${trimmedLine}"`);
      processedElements.push(trimmedLine);
    }
  });

  return processedElements;
}

// Test cases
const testCases = [
  {
    name: 'Grammar Explanation with Headers',
    content: `## Grammar Focus: Present Perfect Tense

### Formation Rules
The present perfect tense is formed with have/has + past participle.

### Examples
- I have studied English for 5 years.
- She has finished her homework.

### When to Use
Use present perfect for actions that started in the past and continue to the present.`
  },
  {
    name: 'Info Card Content',
    content: `## Learning Objectives

### Today's Goals
- Master the present perfect tense
- Practice with real examples
- Understand the difference from simple past

### Key Points
Remember to use "have" with I, you, we, they and "has" with he, she, it.`
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Test Case ${index + 1}: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  
  const result = testProcessGrammarContent(testCase.content);
  
  console.log('\n🎯 Expected Result:');
  result.forEach(element => {
    console.log(`  ${element}`);
  });
});

console.log(`\n${'='.repeat(60)}`);
console.log('✅ Test Complete!');
console.log('📚 Main headers (##) should show book icons');
console.log('▶ Sub headers (###) should show arrow icons');
console.log(`${'='.repeat(60)}\n`);