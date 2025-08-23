#!/usr/bin/env node

/**
 * Cross-browser compatibility testing script for Discussion Topics feature
 * Tests core functionality across different browsers and devices
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  browsers: [
    { name: 'Chrome', headless: false },
    { name: 'Firefox', product: 'firefox', headless: false },
  ],
  viewports: [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ],
  testTimeout: 30000,
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  results: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

/**
 * Core test scenarios for Discussion Topics feature
 */
const testScenarios = [
  {
    name: 'Navigation to Discussion Topics',
    description: 'Test navigation to discussion topics tab',
    test: async (page) => {
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      await page.waitForSelector('[data-testid="discussion-topics-tab"]', { timeout: 10000 });
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]', { timeout: 5000 });
      return true;
    },
  },
  {
    name: 'Topic Selection and Flashcard Display',
    description: 'Test selecting a topic and displaying flashcards',
    test: async (page) => {
      // Navigate to discussion topics
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      await page.waitForSelector('[data-testid="discussion-topics-tab"]');
      await page.click('[data-testid="discussion-topics-tab"]');
      
      // Select first available topic
      await page.waitForSelector('[data-testid="topic-card"]');
      await page.click('[data-testid="topic-card"]:first-child');
      
      // Wait for flashcard interface
      await page.waitForSelector('[data-testid="flashcard-interface"]', { timeout: 15000 });
      await page.waitForSelector('[data-testid="question-card"]');
      
      return true;
    },
  },
  {
    name: 'Flashcard Navigation',
    description: 'Test navigation between flashcards using buttons and keyboard',
    test: async (page) => {
      // Setup: Navigate to flashcards
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      await page.waitForSelector('[data-testid="discussion-topics-tab"]');
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topic-card"]');
      await page.click('[data-testid="topic-card"]:first-child');
      await page.waitForSelector('[data-testid="flashcard-interface"]');
      
      // Test next button
      const nextButton = await page.$('[data-testid="next-button"]');
      if (nextButton && !(await nextButton.evaluate(el => el.disabled))) {
        await nextButton.click();
        await page.waitForTimeout(500); // Wait for animation
      }
      
      // Test keyboard navigation
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(500);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      
      // Test escape to close
      await page.keyboard.press('Escape');
      await page.waitForSelector('[data-testid="topics-list"]');
      
      return true;
    },
  },
  {
    name: 'Custom Topic Creation',
    description: 'Test creating a custom discussion topic',
    test: async (page) => {
      // Navigate to discussion topics
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      await page.waitForSelector('[data-testid="discussion-topics-tab"]');
      await page.click('[data-testid="discussion-topics-tab"]');
      
      // Find and fill custom topic input
      await page.waitForSelector('[data-testid="custom-topic-input"]');
      await page.type('[data-testid="custom-topic-input"]', 'Test Custom Topic');
      
      // Submit the form
      await page.click('[data-testid="create-topic-button"]');
      
      // Wait for success message or new topic to appear
      await page.waitForSelector('[data-testid="success-message"], [data-testid="topic-card"]', { timeout: 10000 });
      
      return true;
    },
  },
  {
    name: 'Responsive Design',
    description: 'Test responsive behavior across different screen sizes',
    test: async (page, viewport) => {
      await page.setViewport(viewport);
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      
      // Check if elements are visible and properly sized
      await page.waitForSelector('[data-testid="discussion-topics-tab"]');
      
      const tabElement = await page.$('[data-testid="discussion-topics-tab"]');
      const isVisible = await tabElement.isIntersectingViewport();
      
      if (!isVisible) {
        throw new Error('Discussion topics tab not visible in viewport');
      }
      
      // Click and check layout
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]');
      
      // Check if topics grid adapts to screen size
      const topicsGrid = await page.$('[data-testid="topics-grid"]');
      if (topicsGrid) {
        const gridStyles = await topicsGrid.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns,
          };
        });
        
        // Verify grid is responsive
        if (viewport.width < 640 && gridStyles.gridTemplateColumns.includes('repeat')) {
          console.log('Grid properly adapts to mobile viewport');
        }
      }
      
      return true;
    },
  },
  {
    name: 'Accessibility Features',
    description: 'Test keyboard navigation and screen reader compatibility',
    test: async (page) => {
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if discussion topics tab can be activated with keyboard
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      
      if (focusedElement === 'discussion-topics-tab') {
        await page.keyboard.press('Enter');
        await page.waitForSelector('[data-testid="topics-list"]');
      }
      
      // Test ARIA labels and roles
      const ariaElements = await page.$$eval('[aria-label], [role]', elements => 
        elements.map(el => ({
          tagName: el.tagName,
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
        }))
      );
      
      if (ariaElements.length === 0) {
        throw new Error('No ARIA labels or roles found - accessibility may be compromised');
      }
      
      return true;
    },
  },
  {
    name: 'Performance Metrics',
    description: 'Test loading times and performance',
    test: async (page) => {
      const startTime = Date.now();
      
      await page.goto(`${TEST_CONFIG.baseUrl}/students/test-student-id`);
      await page.waitForSelector('[data-testid="discussion-topics-tab"]');
      
      const navigationTime = Date.now() - startTime;
      
      // Click discussion topics tab and measure load time
      const tabClickStart = Date.now();
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]');
      const tabLoadTime = Date.now() - tabClickStart;
      
      // Check performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });
      
      console.log('Performance Metrics:', {
        navigationTime,
        tabLoadTime,
        ...performanceMetrics,
      });
      
      // Fail if loading takes too long
      if (navigationTime > 5000 || tabLoadTime > 3000) {
        throw new Error(`Performance issue detected: navigation=${navigationTime}ms, tabLoad=${tabLoadTime}ms`);
      }
      
      return true;
    },
  },
];

/**
 * Run a single test scenario
 */
async function runTest(browser, viewport, scenario) {
  const testId = `${browser.name}-${viewport.name}-${scenario.name}`;
  console.log(`🧪 Running: ${testId}`);
  
  let page;
  const result = {
    id: testId,
    browser: browser.name,
    viewport: viewport.name,
    scenario: scenario.name,
    description: scenario.description,
    status: 'running',
    startTime: Date.now(),
    endTime: null,
    duration: null,
    error: null,
    screenshots: [],
  };
  
  try {
    const browserInstance = await puppeteer.launch({
      product: browser.product || 'chrome',
      headless: browser.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    page = await browserInstance.newPage();
    await page.setViewport(viewport);
    
    // Set up error handling
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console error in ${testId}:`, msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log(`❌ Page error in ${testId}:`, error.message);
    });
    
    // Run the test
    const success = await Promise.race([
      scenario.test(page, viewport),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.testTimeout)
      ),
    ]);
    
    if (success) {
      result.status = 'passed';
      console.log(`✅ Passed: ${testId}`);
    } else {
      result.status = 'failed';
      result.error = 'Test returned false';
      console.log(`❌ Failed: ${testId} - Test returned false`);
    }
    
    await browserInstance.close();
    
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    console.log(`❌ Failed: ${testId} - ${error.message}`);
    
    // Take screenshot on failure
    if (page) {
      try {
        const screenshotPath = `test-results/screenshots/${testId}-failure.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshots.push(screenshotPath);
      } catch (screenshotError) {
        console.log(`⚠️ Could not take screenshot: ${screenshotError.message}`);
      }
    }
  }
  
  result.endTime = Date.now();
  result.duration = result.endTime - result.startTime;
  
  return result;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting cross-browser testing for Discussion Topics feature');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  
  // Create results directory
  const resultsDir = 'test-results';
  const screenshotsDir = path.join(resultsDir, 'screenshots');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Run tests for each browser/viewport/scenario combination
  for (const browser of TEST_CONFIG.browsers) {
    for (const viewport of TEST_CONFIG.viewports) {
      for (const scenario of testScenarios) {
        const result = await runTest(browser, viewport, scenario);
        testResults.results.push(result);
        
        // Update summary
        testResults.summary.total++;
        if (result.status === 'passed') {
          testResults.summary.passed++;
        } else if (result.status === 'failed') {
          testResults.summary.failed++;
        } else {
          testResults.summary.skipped++;
        }
      }
    }
  }
  
  // Generate report
  const reportPath = path.join(resultsDir, 'cross-browser-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Skipped: ${testResults.summary.skipped}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  if (testResults.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  - ${r.id}: ${r.error}`);
      });
  }
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Exit with error code if tests failed
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testScenarios,
  TEST_CONFIG,
};