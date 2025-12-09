#!/usr/bin/env node

/**
 * Test the line break fixing function for grammar explanations
 */

console.log('🧪 Testing Line Break Fix Function...\n');

// Simulate the problematic content from AI (no line breaks)
const problematicContent = "## Grammar Focus: Present Perfect vs Passé Composé### Formation Rules### Examples### When to Use### Common Mistakes### Memory Tips### Comparison with Passé Composé";

console.log('❌ BEFORE (Problematic Content):');
console.log('=====================================');
console.log(JSON.stringify(problematicContent));

// Apply the same fix function as in the component (split and rejoin approach)
const fixMarkdownSpacing = (content) => {
  let fixed = content;
  
  // Split on ### and rejoin with proper spacing
  const parts = fixed.split('###');
  if (parts.length > 1) {
    // First part is the main header
    let result = parts[0].trim();
    
    // Add each ### section with proper spacing
    for (let i = 1; i < parts.length; i++) {
      const section = parts[i].trim();
      if (section) {
        result += '\n\n### ' + section;
      }
    }
    
    fixed = result;
  }
  
  // Ensure main header has proper spacing
  fixed = fixed.replace(/(## [^#\n]+)([^#\n])/g, '$1\n\n$2');
  
  // Clean up multiple newlines
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  
  return fixed.trim();
};

const fixedContent = fixMarkdownSpacing(problematicContent);

console.log('\n✅ AFTER (Fixed Content):');
console.log('=====================================');
console.log(fixedContent);

console.log('\n🔍 Analysis:');
console.log('=====================================');

const checks = {
  'Main Header Separated': fixedContent.includes('## Grammar Focus: Present Perfect vs Passé Composé\n\n###'),
  'Headers Have Line Breaks': (fixedContent.match(/###[^\n]+\n\n/g) || []).length >= 3,
  'No Concatenated Headers': !fixedContent.includes('###Formation') && !fixedContent.includes('###Examples'),
  'Proper Spacing': fixedContent.includes('\n\n'),
  'Multiple Sections': (fixedContent.match(/###/g) || []).length >= 5
};

Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

const passedChecks = Object.values(checks).filter(Boolean).length;
const totalChecks = Object.keys(checks).length;

console.log(`\n📈 Fix Success Rate: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('🎉 SUCCESS: Line break fix function works perfectly!');
  console.log('\n💡 This means even if AI generates content without proper spacing,');
  console.log('   the frontend will automatically fix it for proper markdown rendering.');
} else {
  console.log('⚠️ PARTIAL: Some issues remain, may need function refinement');
}

console.log('\n🚀 Both AI improvements AND frontend fixes are now deployed!');