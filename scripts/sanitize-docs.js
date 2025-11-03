#!/usr/bin/env node

/**
 * Sanitize Documentation Files
 * Removes exposed API keys from documentation files
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Sanitizing Documentation Files...\n');

const filesToSanitize = [
  'IMPLEMENTATION-COMPLETE.md',
  'PASSWORD-RESET-COMPLETE.md',
  'PASSWORD-RESET-FINAL-SUMMARY.md',
  'PASSWORD-RESET-WORKING.md',
  'RESEND-INTEGRATION-READY.md',
  'VOCABULARY-INVESTIGATION-SUMMARY.md',
  'docs/api-key-security-fix-summary.md',
  'docs/revised-email-system-analysis.md',
  'docs/smtp-configuration-summary.md',
  'docs/smtp-implementation-analysis.md',
  'docs/vocabulary-connection-error-analysis.md',
];

// Patterns to sanitize
const sanitizePatterns = [
  { 
    pattern: /sk-or-v1-[a-f0-9]{64}/gi, 
    replacement: '[YOUR_OPENROUTER_API_KEY]',
    name: 'OpenRouter API Key'
  },
  { 
    pattern: /AIzaSy[a-zA-Z0-9_-]{33}/g, 
    replacement: '[YOUR_GEMINI_API_KEY]',
    name: 'Google/Gemini API Key'
  },
  { 
    pattern: /re_[a-zA-Z0-9]{32,}/g, 
    replacement: '[YOUR_RESEND_API_KEY]',
    name: 'Resend API Key'
  },
  {
    pattern: /OPENROUTER_API_KEY\s*=\s*["']?sk-or-v1-[a-f0-9]{64}["']?/gi,
    replacement: 'OPENROUTER_API_KEY=[YOUR_OPENROUTER_API_KEY]',
    name: 'OpenRouter Key Assignment'
  },
  {
    pattern: /GEMINI_API_KEY\s*=\s*["']?AIzaSy[a-zA-Z0-9_-]{33}["']?/gi,
    replacement: 'GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]',
    name: 'Gemini Key Assignment'
  },
  {
    pattern: /RESEND_API_KEY\s*=\s*["']?re_[a-zA-Z0-9]{32,}["']?/gi,
    replacement: 'RESEND_API_KEY=[YOUR_RESEND_API_KEY]',
    name: 'Resend Key Assignment'
  },
];

let totalChanges = 0;
let filesModified = 0;

for (const file of filesToSanitize) {
  if (!fs.existsSync(file)) {
    console.log(`   ⏭️  Skipping ${file} (not found)`);
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  let fileChanges = 0;
  let modified = false;

  for (const { pattern, replacement, name } of sanitizePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fileChanges += matches.length;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`   ✅ Sanitized ${file} (${fileChanges} replacements)`);
    totalChanges += fileChanges;
    filesModified++;
  } else {
    console.log(`   ✓  ${file} (already clean)`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Sanitization Complete!\n`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalChanges}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
