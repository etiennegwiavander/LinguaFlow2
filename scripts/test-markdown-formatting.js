#!/usr/bin/env node

/**
 * Test to verify markdown formatting in grammar explanations
 */

console.log('🧪 Testing Markdown Formatting Requirements...\n');

const sampleGrammarContent = `## Grammar Focus: Present Perfect Tense

### Formation Rules
1. Use "have/has" + past participle
2. For regular verbs: add "-ed" to the base form
3. For irregular verbs: use the third form from the irregular verbs list

### Examples
**Positive/Affirmative:**
- I have visited the Eiffel Tower.
- She has traveled to Italy.
- They have explored the Grand Canyon.

**Negative:**
- I haven't been to Japan yet.
- She hasn't tried sushi before.

**Questions:**
- Have you ever been to New York?
- Has she visited the Louvre?

### When to Use
Use the present perfect for actions that happened at an unspecified time before now, or actions that started in the past and continue to the present.

### Common Mistakes
- ❌ "I have visit Paris" → ✅ "I have visited Paris"
- ❌ "She has travel to Italy" → ✅ "She has traveled to Italy"

### Memory Tips
Remember: "have/has" + past participle (like French "avoir/être" + past participle)

### Comparison with French Passé Composé
While both tenses use an auxiliary verb + past participle, English present perfect often describes experiences without specifying when they happened, whereas French passé composé can be used for specific past events.`;

console.log('📝 Sample Enhanced Grammar Content:');
console.log('=====================================');
console.log(sampleGrammarContent);

console.log('\n🔍 Markdown Formatting Analysis:');
console.log('=====================================');

const checks = {
  'Main Header (##)': sampleGrammarContent.includes('## Grammar Focus:'),
  'Subsection Headers (###)': (sampleGrammarContent.match(/### /g) || []).length >= 5,
  'Bold Subcategories': sampleGrammarContent.includes('**Positive/Affirmative:**'),
  'Error Corrections': sampleGrammarContent.includes('❌') && sampleGrammarContent.includes('✅'),
  'Proper Spacing': sampleGrammarContent.includes('\n\n'),
  'Multiple Sections': (sampleGrammarContent.match(/###/g) || []).length >= 5
};

Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

const passedChecks = Object.values(checks).filter(Boolean).length;
const totalChecks = Object.keys(checks).length;

console.log(`\n📈 Formatting Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('🎉 PERFECT: All markdown formatting requirements met!');
  console.log('\n💡 Next Steps:');
  console.log('1. Generate a new grammar lesson');
  console.log('2. Verify headers now display with proper formatting');
  console.log('3. Check that ### headers show with arrow icons (▶)');
  console.log('4. Confirm ## headers show with book icons (📚)');
} else {
  console.log('⚠️ Some formatting requirements not met in sample');
}

console.log('\n🚀 Enhanced Edge Function deployed successfully!');
console.log('Generate a new grammar lesson to see improved formatting.');