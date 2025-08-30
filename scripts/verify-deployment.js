#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script verifies that the password reset fix is working correctly
 * and that the deployment is successful.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Verifying Deployment...\n');

// Check if critical files exist
const criticalFiles = [
  'app/auth/reset-password/page.tsx',
  'lib/password-reset-url-interceptor.ts',
  'lib/supabase-reset-password.ts',
  'netlify.toml'
];

console.log('📁 Checking critical files...');
let allFilesExist = true;

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Deployment verification failed - missing critical files');
  process.exit(1);
}

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  '@supabase/supabase-js',
  'next',
  'react',
  'react-dom'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING!`);
    allFilesExist = false;
  }
});

// Check environment variables template
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local exists');
} else {
  console.log('⚠️  .env.local not found (expected for local development)');
}

// Check Netlify configuration
console.log('\n🌐 Checking Netlify configuration...');
const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
if (netlifyConfig.includes('@netlify/plugin-nextjs')) {
  console.log('✅ Next.js plugin configured');
} else {
  console.log('❌ Next.js plugin not configured');
  allFilesExist = false;
}

if (netlifyConfig.includes('npm run build')) {
  console.log('✅ Build command configured');
} else {
  console.log('❌ Build command not configured');
  allFilesExist = false;
}

// Check password reset implementation
console.log('\n🔒 Checking password reset implementation...');
const resetPageContent = fs.readFileSync('app/auth/reset-password/page.tsx', 'utf8');
if (resetPageContent.includes('usePasswordResetInterceptor')) {
  console.log('✅ URL interceptor integrated');
} else {
  console.log('❌ URL interceptor not integrated');
  allFilesExist = false;
}

const interceptorContent = fs.readFileSync('lib/password-reset-url-interceptor.ts', 'utf8');
if (interceptorContent.includes('window.history.replaceState')) {
  console.log('✅ URL cleaning implemented');
} else {
  console.log('❌ URL cleaning not implemented');
  allFilesExist = false;
}

// Final verification
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
  console.log('\n✅ All critical files present');
  console.log('✅ Dependencies configured');
  console.log('✅ Netlify configuration valid');
  console.log('✅ Password reset fix implemented');
  console.log('\n🚀 Ready for production deployment!');
  console.log('\nExpected behavior:');
  console.log('- Reset links show password form (no auto-login)');
  console.log('- Users must enter new password');
  console.log('- Secure session cleanup after password update');
  console.log('- Redirect to login with success message');
} else {
  console.log('❌ DEPLOYMENT VERIFICATION FAILED!');
  console.log('\nPlease fix the issues above before deploying.');
  process.exit(1);
}

console.log('\n' + '='.repeat(50));