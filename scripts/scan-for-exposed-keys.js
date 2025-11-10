#!/usr/bin/env node

/**
 * Scan for Exposed API Keys
 * This script scans all files for potentially exposed API keys
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for
const KEY_PATTERNS = [
  /sk-or-v1-[a-zA-Z0-9]{64}/g,  // OpenRouter keys
  /AIzaSy[a-zA-Z0-9_-]{33}/g,    // Google/Gemini API keys
  /sk-[a-zA-Z0-9]{48}/g,          // OpenAI keys
];

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env.local',
  '.env',
  'package-lock.json',
];

const exposedKeys = [];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    KEY_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          exposedKeys.push({
            file: filePath,
            key: match,
            preview: `${match.substring(0, 15)}...${match.substring(match.length - 4)}`
          });
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      
      if (shouldExclude(fullPath)) {
        return;
      }
      
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stats.isFile()) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

console.log('🔍 Scanning for exposed API keys...\n');

scanDirectory('.');

if (exposedKeys.length === 0) {
  console.log('✅ No exposed API keys found!');
  console.log('\n✅ Safe to commit to GitHub');
  process.exit(0);
} else {
  console.log(`❌ Found ${exposedKeys.length} exposed API key(s):\n`);
  
  exposedKeys.forEach((item, index) => {
    console.log(`${index + 1}. File: ${item.file}`);
    console.log(`   Key: ${item.preview}`);
    console.log('');
  });
  
  console.log('⚠️  DO NOT COMMIT! Remove these keys first.');
  console.log('\n💡 Files to sanitize:');
  const uniqueFiles = [...new Set(exposedKeys.map(item => item.file))];
  uniqueFiles.forEach(file => console.log(`   - ${file}`));
  
  process.exit(1);
}
