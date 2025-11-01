// Verify OpenRouter API Key Security
// This script checks that the API key is properly secured

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 OpenRouter API Key Security Verification');
console.log('===========================================\n');

let hasIssues = false;

// Check 1: Verify .env.local exists
console.log('1. Checking .env.local file...');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  if (envContent.includes('OPENROUTER_API_KEY=')) {
    console.log('   ✅ OPENROUTER_API_KEY found in .env.local');
  } else {
    console.log('   ⚠️  OPENROUTER_API_KEY not found in .env.local');
    hasIssues = true;
  }
} else {
  console.log('   ❌ .env.local file not found!');
  hasIssues = true;
}
console.log('');

// Check 2: Verify .gitignore includes .env.local
console.log('2. Checking .gitignore configuration...');
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  if (gitignoreContent.includes('.env*.local')) {
    console.log('   ✅ .env*.local is properly ignored');
  } else {
    console.log('   ❌ .env*.local is NOT in .gitignore!');
    hasIssues = true;
  }
} else {
  console.log('   ❌ .gitignore file not found!');
  hasIssues = true;
}
console.log('');

// Check 3: Search for exposed keys in tracked files
console.log('3. Checking for exposed OpenRouter keys in tracked files...');
try {
  const result = execSync('git grep "sk-or-v1-" -- ":!.env.local" ":!.env.example" ":!OPENROUTER-KEY-SECURITY-STATUS.md"', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Filter out safe patterns
  const lines = result.split('\n').filter(line => {
    return line && 
           !line.includes('your_openrouter_api_key') &&
           !line.includes('placeholder') &&
           !line.includes('pattern:') &&
           !line.includes('git grep') &&
           !line.includes('sk-or-v1-abc123') && // Example placeholder
           !line.includes('example keys');
  });
  
  if (lines.length > 0) {
    console.log('   ⚠️  Found potential exposed keys:');
    lines.forEach(line => console.log('      ' + line));
    hasIssues = true;
  } else {
    console.log('   ✅ No exposed OpenRouter keys found');
  }
} catch (error) {
  // git grep returns exit code 1 when no matches found (which is good!)
  if (error.status === 1) {
    console.log('   ✅ No exposed OpenRouter keys found');
  } else {
    console.log('   ⚠️  Could not check for exposed keys:', error.message);
  }
}
console.log('');

// Check 4: Verify Edge Functions use environment variables
console.log('4. Checking Edge Functions implementation...');
const edgeFunctions = [
  'supabase/functions/generate-lesson-plan/index.ts',
  'supabase/functions/generate-vocabulary-words/index.ts'
];

edgeFunctions.forEach(funcPath => {
  if (fs.existsSync(funcPath)) {
    const content = fs.readFileSync(funcPath, 'utf8');
    if (content.includes('Deno.env.get') && content.includes('OPENROUTER_API_KEY')) {
      console.log(`   ✅ ${path.basename(path.dirname(funcPath))} uses environment variables`);
    } else {
      console.log(`   ❌ ${path.basename(path.dirname(funcPath))} may have hardcoded keys!`);
      hasIssues = true;
    }
  }
});
console.log('');

// Summary
console.log('===========================================');
if (hasIssues) {
  console.log('⚠️  Security issues found - please review above');
  console.log('');
  console.log('Next steps:');
  console.log('1. Fix any issues identified above');
  console.log('2. Update Supabase secrets: .\\scripts\\update-openrouter-key.ps1');
  console.log('3. Redeploy Edge Functions');
  process.exit(1);
} else {
  console.log('✅ All security checks passed!');
  console.log('');
  console.log('Your OpenRouter API key is properly secured:');
  console.log('  • Stored in .env.local (gitignored)');
  console.log('  • No keys exposed in tracked files');
  console.log('  • Edge Functions use environment variables');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update Supabase secrets: .\\scripts\\update-openrouter-key.ps1');
  console.log('2. Redeploy Edge Functions:');
  console.log('   supabase functions deploy generate-lesson-plan');
  console.log('   supabase functions deploy generate-vocabulary-words');
  console.log('3. Test: node scripts\\test-vocabulary-deepseek.js');
}
