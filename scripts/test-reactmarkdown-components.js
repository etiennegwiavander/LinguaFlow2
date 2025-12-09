#!/usr/bin/env node

/**
 * Test to verify ReactMarkdown component setup
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing ReactMarkdown Component Setup...\n');

// Read the component file
const componentPath = path.join(process.cwd(), 'components/lessons/LessonMaterialDisplay.tsx');
const content = fs.readFileSync(componentPath, 'utf8');

console.log('🔍 Checking Component Implementation:');
console.log('=====================================');

// Check if ReactMarkdown is imported
const hasReactMarkdown = content.includes('import ReactMarkdown') || content.includes('from "react-markdown"');
console.log(`${hasReactMarkdown ? '✅' : '❌'} ReactMarkdown imported`);

// Check if remarkGfm is imported
const hasRemarkGfm = content.includes('remarkGfm') || content.includes('remark-gfm');
console.log(`${hasRemarkGfm ? '✅' : '❌'} remarkGfm imported`);

// Check if enhancedComponents is defined
const hasEnhancedComponents = content.includes('enhancedComponents');
console.log(`${hasEnhancedComponents ? '✅' : '❌'} enhancedComponents defined`);

// Check if ReactMarkdown is used in grammar case
const hasGrammarReactMarkdown = content.includes('case \'grammar_explanation\'') && 
                               content.includes('<ReactMarkdown') && 
                               content.includes('components={enhancedComponents}');
console.log(`${hasGrammarReactMarkdown ? '✅' : '❌'} ReactMarkdown used in grammar_explanation case`);

// Check if icons are in components
const hasBookIcon = content.includes('📚');
const hasArrowIcon = content.includes('▶');
console.log(`${hasBookIcon ? '✅' : '❌'} Book icon (📚) in h2 component`);
console.log(`${hasArrowIcon ? '✅' : '❌'} Arrow icon (▶) in h3 component`);

console.log('\n🎯 Potential Solutions:');
console.log('=====================================');

if (!hasReactMarkdown) {
  console.log('❌ ISSUE: ReactMarkdown not imported');
  console.log('   FIX: Add import ReactMarkdown from "react-markdown"');
}

if (!hasRemarkGfm) {
  console.log('❌ ISSUE: remarkGfm not imported');
  console.log('   FIX: Add import remarkGfm from "remark-gfm"');
}

if (!hasGrammarReactMarkdown) {
  console.log('❌ ISSUE: ReactMarkdown not used in grammar case');
  console.log('   FIX: Ensure grammar_explanation case uses ReactMarkdown');
}

if (!hasBookIcon || !hasArrowIcon) {
  console.log('❌ ISSUE: Icons missing from components');
  console.log('   FIX: Add icons to h2 and h3 components');
}

console.log('\n🔄 Next Steps:');
console.log('=====================================');
console.log('1. Restart your development server (npm run dev)');
console.log('2. Hard refresh browser (Ctrl+F5)');
console.log('3. Generate a NEW grammar lesson');
console.log('4. Inspect the HTML elements in browser dev tools');
console.log('5. Check browser console for any JavaScript errors');

const allGood = hasReactMarkdown && hasRemarkGfm && hasEnhancedComponents && 
                hasGrammarReactMarkdown && hasBookIcon && hasArrowIcon;

if (allGood) {
  console.log('\n🎉 All components are correctly implemented!');
  console.log('   If icons still not showing, try:');
  console.log('   1. Restart development server');
  console.log('   2. Clear browser cache completely');
  console.log('   3. Check for JavaScript errors in console');
} else {
  console.log('\n⚠️ Some issues detected - see fixes above');
}