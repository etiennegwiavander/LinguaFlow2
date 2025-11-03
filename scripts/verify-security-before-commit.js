// Verify no API keys are exposed before committing
const fs = require('fs');
const path = require('path');

console.log('🔒 Security Check - Verifying no API keys are exposed\n');

// Patterns to search for
const dangerousPatterns = [
  /sk-[a-zA-Z0-9]{48}/g, // OpenRouter API key pattern
  /OPENROUTER_API_KEY\s*=\s*["']?sk-/gi,
  /sk-proj-[a-zA-Z0-9_-]{48,}/g, // OpenAI key pattern
  /AIzaSy[a-zA-Z0-9_-]{33}/g, // Google API key pattern
];

// Files to check (git tracked files)
const filesToCheck = [
  '.env.example',
  'next.config.js',
  'netlify.toml',
];

// Directories to scan
const dirsToScan = [
  'app',
  'components',
  'lib',
  'supabase/functions',
];

let foundIssues = false;

// Check specific files
console.log('📋 Checking specific files...\n');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    dangerousPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`❌ DANGER: Found potential API key in ${file}`);
        console.log(`   Pattern: ${pattern}`);
        foundIssues = true;
      }
    });
  }
});

// Recursive function to scan directories
function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      dangerousPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`❌ DANGER: Found potential API key in ${filePath}`);
          foundIssues = true;
        }
      });
    }
  });
}

console.log('📁 Scanning directories...\n');
dirsToScan.forEach(dir => {
  scanDirectory(dir);
});

// Check .gitignore
console.log('📝 Verifying .gitignore...\n');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredPatterns = [
    { pattern: /\.env(\*)?\.local/, name: '.env.local or .env*.local' },
    { pattern: /\.env\b/, name: '.env' },
    { pattern: /node_modules/, name: 'node_modules' }
  ];
  
  requiredPatterns.forEach(({ pattern, name }) => {
    if (!pattern.test(gitignore)) {
      console.log(`⚠️  WARNING: .gitignore missing: ${name}`);
      foundIssues = true;
    }
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (foundIssues) {
  console.log('❌ SECURITY CHECK FAILED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  API keys or sensitive data found in tracked files!');
  console.log('   DO NOT COMMIT until these are removed.\n');
  process.exit(1);
} else {
  console.log('✅ SECURITY CHECK PASSED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ No API keys found in tracked files');
  console.log('✅ .gitignore properly configured');
  console.log('✅ Safe to commit\n');
  process.exit(0);
}
