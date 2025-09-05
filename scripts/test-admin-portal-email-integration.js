#!/usr/bin/env node

/**
 * Test script to verify EmailTestingInterface integration in admin portal
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Admin Portal Email Integration...\n');

// Test 1: Check if EmailTestingInterface component exists
const componentPath = path.join(__dirname, '../components/admin/EmailTestingInterface.tsx');
if (fs.existsSync(componentPath)) {
  console.log('✅ EmailTestingInterface component exists');
} else {
  console.log('❌ EmailTestingInterface component not found');
  process.exit(1);
}

// Test 2: Check if admin portal email page exists
const adminEmailPagePath = path.join(__dirname, '../app/admin-portal/email/page.tsx');
if (fs.existsSync(adminEmailPagePath)) {
  console.log('✅ Admin portal email page exists');
} else {
  console.log('❌ Admin portal email page not found');
  process.exit(1);
}

// Test 3: Check if EmailTestingInterface is imported in admin portal
const adminEmailPageContent = fs.readFileSync(adminEmailPagePath, 'utf8');
if (adminEmailPageContent.includes('EmailTestingInterface')) {
  console.log('✅ EmailTestingInterface is imported in admin portal');
} else {
  console.log('❌ EmailTestingInterface not imported in admin portal');
  process.exit(1);
}

// Test 4: Check if testing tab is added
if (adminEmailPageContent.includes('value="testing"') && adminEmailPageContent.includes('Email Testing')) {
  console.log('✅ Email Testing tab is properly configured');
} else {
  console.log('❌ Email Testing tab not found or misconfigured');
  process.exit(1);
}

// Test 5: Check if TestTube icon is imported
if (adminEmailPageContent.includes('TestTube')) {
  console.log('✅ TestTube icon is imported for testing tab');
} else {
  console.log('❌ TestTube icon not imported');
  process.exit(1);
}

// Test 6: Check if email test service exists
const emailTestServicePath = path.join(__dirname, '../lib/email-test-service.ts');
if (fs.existsSync(emailTestServicePath)) {
  console.log('✅ Email test service exists');
} else {
  console.log('❌ Email test service not found');
  process.exit(1);
}

// Test 7: Check if API routes exist
const testApiPath = path.join(__dirname, '../app/api/admin/email/test/route.ts');
const testStatusApiPath = path.join(__dirname, '../app/api/admin/email/test/[id]/status/route.ts');

if (fs.existsSync(testApiPath)) {
  console.log('✅ Email test API route exists');
} else {
  console.log('❌ Email test API route not found');
  process.exit(1);
}

if (fs.existsSync(testStatusApiPath)) {
  console.log('✅ Email test status API route exists');
} else {
  console.log('❌ Email test status API route not found');
  process.exit(1);
}

console.log('\n🎉 All integration tests passed!');
console.log('\n📍 Admin Portal URL: http://localhost:3000/admin-portal/email');
console.log('📍 Email Testing Tab: Click on "Email Testing" tab in the admin portal');
console.log('\n✨ EmailTestingInterface is successfully integrated into the admin portal!');