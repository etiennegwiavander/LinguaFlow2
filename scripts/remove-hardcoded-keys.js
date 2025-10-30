/**
 * Script to remove hardcoded API keys from test files
 * This ensures no sensitive keys are committed to Git
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 REMOVING HARDCODED API KEYS FROM TEST FILES');
console.log('='.repeat(60));
console.log('');

const filesToClean = [
  'test-gemini-api-now.js',
  'test-gemini-models.js',
  'test-gemini-newer-models.js',
  'list-available-models.js',
  'scripts/test-gemini-api-direct.js',
  'scripts/list-gemini-models.js'
];

const replacements = [
  {
    // Remove hardcoded Gemini keys
    pattern: /const GEMINI_API_KEY = ['"]AIzaSy[^'"]+['"]/g,
    replacement: "const GEMINI_API_KEY = process.env.GEMINI_API_KEY || require('dotenv').config({ path: '.env.local' }) && process.env.GEMINI_API_KEY"
  },
  {
    // Remove hardcoded OpenRouter keys
    pattern: /const OPENROUTER_API_KEY = ['"]sk-or-v1-[^'"]+['"]/g,
    replacement: "const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || require('dotenv').config({ path: '.env.local' }) && process.env.OPENROUTER_API_KEY"
  }
];

let filesModified = 0;
let keysRemoved = 0;

filesToClean.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      modified = true;
      keysRemoved += matches.length;
      console.log(`✅ Removed ${matches.length} hardcoded key(s) from ${filePath}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
  } else {
    console.log(`✓  ${filePath} - No hardcoded keys found`);
  }
});

console.log('');
console.log('='.repeat(60));
console.log(`📊 SUMMARY:`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Keys removed: ${keysRemoved}`);
console.log('');

if (keysRemoved > 0) {
  console.log('⚠️  IMPORTANT: The removed keys may still be in Git history!');
  console.log('   If these files were previously committed with keys:');
  console.log('   1. Revoke the exposed keys in the provider dashboard');
  console.log('   2. Generate new keys');
  console.log('   3. Update .env.local and Supabase secrets');
  console.log('');
}

console.log('✅ All test files now use environment variables');
console.log('   Keys are safely stored in .env.local (not committed to Git)');
