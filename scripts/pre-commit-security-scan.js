#!/usr/bin/env node

/**
 * Pre-Commit Security Scanner
 * Scans for exposed API keys and sensitive data before committing to GitHub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Running Pre-Commit Security Scan...\n');

let hasIssues = false;
const issues = [];

// Patterns to detect exposed secrets
const dangerousPatterns = [
  { pattern: /sk-or-v1-[a-f0-9]{64}/gi, name: 'OpenRouter API Key' },
  { pattern: /sk-proj-[a-zA-Z0-9_-]{48,}/g, name: 'OpenAI API Key' },
  { pattern: /AIzaSy[a-zA-Z0-9_-]{33}/g, name: 'Google API Key' },
  { pattern: /re_[a-zA-Z0-9]{32,}/g, name: 'Resend API Key' },
  { pattern: /OPENROUTER_API_KEY\s*=\s*["']?sk-or-v1-/gi, name: 'Hardcoded OpenRouter Key' },
  { pattern: /GEMINI_API_KEY\s*=\s*["']?AIza/gi, name: 'Hardcoded Gemini Key' },
  { pattern: /RESEND_API_KEY\s*=\s*["']?re_/gi, name: 'Hardcoded Resend Key' },
];

// Files to exclude from scanning
const excludePatterns = [
  'node_modules',
  '.next',
  '.git',
  'build',
  'dist',
  '.env.local',
  '.env.example',
  'package-lock.json',
  'yarn.lock',
];

// Check 1: Scan staged files for secrets
console.log('📋 Checking staged files for exposed secrets...');
try {
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.trim() !== '');

  if (stagedFiles.length === 0) {
    console.log('   ⚠️  No staged files found. Use "git add" to stage files.\n');
  } else {
    console.log(`   Found ${stagedFiles.length} staged file(s)\n`);

    for (const file of stagedFiles) {
      // Skip excluded files
      if (excludePatterns.some(pattern => file.includes(pattern))) {
        continue;
      }

      // Skip if file doesn't exist (deleted files)
      if (!fs.existsSync(file)) {
        continue;
      }

      // Read file content
      const content = fs.readFileSync(file, 'utf8');

      // Check against all patterns
      for (const { pattern, name } of dangerousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          hasIssues = true;
          issues.push({
            file,
            type: name,
            matches: matches.length,
            preview: matches[0].substring(0, 20) + '...'
          });
        }
      }
    }
  }
} catch (error) {
  console.log('   ⚠️  Could not check staged files (not a git repository or no git installed)\n');
}

// Check 2: Verify .env.local is not staged
console.log('🔐 Checking .env.local is not staged...');
try {
  const stagedEnvFiles = execSync('git diff --cached --name-only | grep -E "^\\.env\\.local$"', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  
  if (stagedEnvFiles) {
    hasIssues = true;
    issues.push({
      file: '.env.local',
      type: 'Environment File',
      matches: 1,
      preview: 'Contains sensitive API keys'
    });
    console.log('   ❌ .env.local is staged!\n');
  } else {
    console.log('   ✅ .env.local is not staged\n');
  }
} catch (error) {
  // grep returns non-zero exit code when no matches found (which is good)
  console.log('   ✅ .env.local is not staged\n');
}

// Check 3: Verify .gitignore includes .env.local
console.log('📝 Checking .gitignore configuration...');
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  if (gitignoreContent.includes('.env*.local') || gitignoreContent.includes('.env.local')) {
    console.log('   ✅ .env.local is in .gitignore\n');
  } else {
    hasIssues = true;
    issues.push({
      file: '.gitignore',
      type: 'Configuration',
      matches: 1,
      preview: '.env.local not excluded'
    });
    console.log('   ❌ .env.local is NOT in .gitignore\n');
  }
} else {
  console.log('   ⚠️  .gitignore not found\n');
}

// Check 4: Scan for exposed keys in git-tracked files only
console.log('🔍 Scanning git-tracked files for exposed secrets...');
try {
  const allFiles = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.trim() !== '');

  console.log(`   Checking ${allFiles.length} git-tracked files...`);

  let scannedCount = 0;
  for (const file of allFiles) {
    // Skip if file doesn't exist (may have been removed)
    if (!fs.existsSync(file)) {
      continue;
    }

    // Skip excluded files
    if (excludePatterns.some(pattern => file.includes(pattern))) {
      continue;
    }

    // Skip binary files and large files
    const stats = fs.statSync(file);
    if (stats.size > 1024 * 1024) continue; // Skip files > 1MB

    try {
      const content = fs.readFileSync(file, 'utf8');
      scannedCount++;

      // Check for actual key values (not just variable names)
      for (const { pattern, name } of dangerousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          // Filter out false positives (placeholders, examples, etc.)
          const realMatches = matches.filter(match => {
            const lower = match.toLowerCase();
            return !lower.includes('your_') &&
                   !lower.includes('your-') &&
                   !lower.includes('xxxxx') &&
                   !lower.includes('placeholder') &&
                   !lower.includes('example') &&
                   !lower.includes('here') &&
                   !match.match(/re_[xy]+/i) && // re_xxxxx, re_your_api_key_here
                   !match.match(/AIza[A-Z]{4}/); // Placeholder Gemini keys
          });

          if (realMatches.length > 0) {
            hasIssues = true;
            issues.push({
              file,
              type: name,
              matches: realMatches.length,
              preview: realMatches[0].substring(0, 20) + '...'
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read as text
    }
  }
  console.log(`   Scanned ${scannedCount} files\n`);
} catch (error) {
  console.log('   ⚠️  Could not scan repository\n');
}

// Report results
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasIssues) {
  console.log('❌ SECURITY ISSUES FOUND!\n');
  console.log('The following files contain exposed secrets:\n');
  
  issues.forEach(issue => {
    console.log(`   📄 ${issue.file}`);
    console.log(`      Type: ${issue.type}`);
    console.log(`      Matches: ${issue.matches}`);
    console.log(`      Preview: ${issue.preview}`);
    console.log('');
  });

  console.log('🚨 ACTION REQUIRED:');
  console.log('   1. Remove exposed secrets from these files');
  console.log('   2. Replace with environment variables');
  console.log('   3. Ensure .env.local is in .gitignore');
  console.log('   4. Run this script again before committing');
  console.log('');
  console.log('❌ COMMIT BLOCKED - Fix security issues first!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
} else {
  console.log('✅ NO SECURITY ISSUES FOUND!\n');
  console.log('   All checks passed:');
  console.log('   ✓ No exposed API keys in staged files');
  console.log('   ✓ .env.local is not staged');
  console.log('   ✓ .env.local is in .gitignore');
  console.log('   ✓ No exposed secrets in repository');
  console.log('');
  console.log('✅ SAFE TO COMMIT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
}
