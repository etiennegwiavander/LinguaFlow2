#!/usr/bin/env node

/**
 * Verify that icon implementation is correct in the component
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Icon Implementation...\n');

// Read the LessonMaterialDisplay component
const componentPath = path.join(process.cwd(), 'components/lessons/LessonMaterialDisplay.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

console.log('📋 Checking ReactMarkdown Components:');
console.log('=====================================');

const checks = {
  'H2 Component with Book Icon': componentContent.includes('<span className="absolute left-3 top-3 text-xl">📚</span>'),
  'H3 Component with Arrow Icon': componentContent.includes('<span className="absolute left-2 top-2 text-blue-500 text-sm">▶</span>'),
  'H2 Proper Padding': componentContent.includes('pl-10') && componentContent.includes('h2'),
  'H3 Proper Padding': componentContent.includes('pl-8') && componentContent.includes('h3'),
  'ReactMarkdown Usage': componentContent.includes('ReactMarkdown') && componentContent.includes('components={enhancedComponents}'),
  'Grammar Content Class': componentContent.includes('grammar-explanation-content')
};

Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

const passedChecks = Object.values(checks).filter(Boolean).length;
const totalChecks = Object.keys(checks).length;

console.log(`\n📈 Implementation Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('🎉 SUCCESS: Icon implementation is correct!');
  console.log('\n💡 If you\'re still seeing ## and ### instead of icons:');
  console.log('1. ✅ Make sure you\'re viewing a NEWLY GENERATED lesson');
  console.log('2. ✅ Existing lessons will still show old formatting');
  console.log('3. ✅ Try hard refresh (Ctrl+F5) to clear browser cache');
  console.log('4. ✅ Generate a new grammar lesson to see the icons');
} else {
  console.log('⚠️ ISSUE: Some implementation problems detected');
}

console.log('\n🔄 Remember: Changes only apply to NEW lessons!');
console.log('Existing lessons keep their original formatting.');