#!/usr/bin/env node

/**
 * Performance testing script for Discussion Topics feature
 * Tests component render times, memory usage, and operation performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  testDuration: 60000, // 1 minute
  sampleInterval: 1000, // 1 second
  thresholds: {
    componentRender: 16, // 16ms for 60fps
    databaseQuery: 1000, // 1 second
    aiGeneration: 10000, // 10 seconds
    memoryUsage: 100, // 100MB
    networkRequest: 3000, // 3 seconds
  },
};

/**
 * Performance test scenarios
 */
const performanceTests = [
  {
    name: 'Component Render Performance',
    description: 'Test React component render times',
    test: async (page) => {
      await page.goto(`${PERFORMANCE_CONFIG.baseUrl}/students/test-student-id`);
      
      // Enable performance monitoring
      await page.evaluate(() => {
        window.performanceData = {
          renders: [],
          interactions: [],
        };
        
        // Hook into React DevTools if available
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          hook.onCommitFiberRoot = (id, root, priorityLevel) => {
            const renderTime = performance.now();
            window.performanceData.renders.push({
              timestamp: renderTime,
              rootId: id,
              priorityLevel,
            });
          };
        }
      });
      
      // Navigate to discussion topics and measure render times
      const startTime = performance.now();
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]');
      const navigationTime = performance.now() - startTime;
      
      // Interact with components to trigger re-renders
      await page.type('[data-testid="topic-search"]', 'test search');
      await page.waitForTimeout(500);
      await page.click('[data-testid="topic-card"]:first-child');
      await page.waitForSelector('[data-testid="flashcard-interface"]');
      
      // Navigate through flashcards
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
      }
      
      // Get performance data
      const performanceData = await page.evaluate(() => window.performanceData);
      
      return {
        navigationTime,
        renderCount: performanceData.renders.length,
        averageRenderTime: performanceData.renders.length > 0 
          ? performanceData.renders.reduce((sum, r) => sum + r.timestamp, 0) / performanceData.renders.length 
          : 0,
      };
    },
  },
  {
    name: 'Memory Usage Monitoring',
    description: 'Monitor memory usage during typical usage',
    test: async (page) => {
      const memoryReadings = [];
      
      // Start memory monitoring
      const monitorMemory = async () => {
        const metrics = await page.metrics();
        const memoryUsage = await page.evaluate(() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
              totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024, // MB
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit / 1024 / 1024, // MB
            };
          }
          return null;
        });
        
        memoryReadings.push({
          timestamp: Date.now(),
          puppeteerMetrics: metrics,
          browserMemory: memoryUsage,
        });
      };
      
      // Initial reading
      await monitorMemory();
      
      // Navigate and use the application
      await page.goto(`${PERFORMANCE_CONFIG.baseUrl}/students/test-student-id`);
      await monitorMemory();
      
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]');
      await monitorMemory();
      
      // Create multiple custom topics to test memory growth
      for (let i = 0; i < 10; i++) {
        await page.type('[data-testid="custom-topic-input"]', `Test Topic ${i}`);
        await page.click('[data-testid="create-topic-button"]');
        await page.waitForTimeout(1000);
        await monitorMemory();
      }
      
      // Open and close flashcards multiple times
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="topic-card"]:first-child');
        await page.waitForSelector('[data-testid="flashcard-interface"]');
        await monitorMemory();
        
        await page.keyboard.press('Escape');
        await page.waitForSelector('[data-testid="topics-list"]');
        await monitorMemory();
      }
      
      return {
        memoryReadings,
        peakMemory: Math.max(...memoryReadings.map(r => r.browserMemory?.usedJSHeapSize || 0)),
        memoryGrowth: memoryReadings.length > 1 
          ? (memoryReadings[memoryReadings.length - 1].browserMemory?.usedJSHeapSize || 0) - (memoryReadings[0].browserMemory?.usedJSHeapSize || 0)
          : 0,
      };
    },
  },
  {
    name: 'Database Operation Performance',
    description: 'Test database query performance',
    test: async (page) => {
      const dbOperations = [];
      
      // Monitor network requests to track database operations
      page.on('response', response => {
        if (response.url().includes('/rest/v1/') || response.url().includes('/functions/v1/')) {
          dbOperations.push({
            url: response.url(),
            status: response.status(),
            timing: response.timing(),
            timestamp: Date.now(),
          });
        }
      });
      
      await page.goto(`${PERFORMANCE_CONFIG.baseUrl}/students/test-student-id`);
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]');
      
      // Wait for all initial requests to complete
      await page.waitForTimeout(2000);
      
      // Create a custom topic (triggers database write)
      await page.type('[data-testid="custom-topic-input"]', 'Performance Test Topic');
      await page.click('[data-testid="create-topic-button"]');
      await page.waitForTimeout(3000);
      
      // Select topic and generate questions (triggers AI function)
      await page.click('[data-testid="topic-card"]:last-child');
      await page.waitForSelector('[data-testid="flashcard-interface"]', { timeout: 15000 });
      
      return {
        totalOperations: dbOperations.length,
        operations: dbOperations,
        averageResponseTime: dbOperations.length > 0 
          ? dbOperations.reduce((sum, op) => sum + (op.timing?.receiveHeadersEnd || 0), 0) / dbOperations.length
          : 0,
        slowOperations: dbOperations.filter(op => (op.timing?.receiveHeadersEnd || 0) > PERFORMANCE_CONFIG.thresholds.databaseQuery),
      };
    },
  },
  {
    name: 'UI Responsiveness Test',
    description: 'Test UI responsiveness under load',
    test: async (page) => {
      const interactions = [];
      
      await page.goto(`${PERFORMANCE_CONFIG.baseUrl}/students/test-student-id`);
      await page.click('[data-testid="discussion-topics-tab"]');
      await page.waitForSelector('[data-testid="topics-list"]');
      
      // Rapid interactions to test responsiveness
      const testInteractions = [
        () => page.type('[data-testid="topic-search"]', 'rapid typing test'),
        () => page.keyboard.press('Backspace'),
        () => page.keyboard.press('Backspace'),
        () => page.keyboard.press('Backspace'),
        () => page.click('[data-testid="topic-card"]:first-child'),
        () => page.keyboard.press('Escape'),
        () => page.keyboard.press('ArrowRight'),
        () => page.keyboard.press('ArrowLeft'),
      ];
      
      for (const interaction of testInteractions) {
        const startTime = performance.now();
        await interaction();
        await page.waitForTimeout(100); // Small delay to measure response
        const endTime = performance.now();
        
        interactions.push({
          duration: endTime - startTime,
          timestamp: Date.now(),
        });
      }
      
      return {
        totalInteractions: interactions.length,
        averageResponseTime: interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length,
        slowInteractions: interactions.filter(i => i.duration > 100), // > 100ms is noticeable
        maxResponseTime: Math.max(...interactions.map(i => i.duration)),
      };
    },
  },
  {
    name: 'Concurrent User Simulation',
    description: 'Simulate multiple concurrent users',
    test: async (page) => {
      const concurrentSessions = 3;
      const sessionResults = [];
      
      // Create multiple browser contexts to simulate concurrent users
      const browser = page.browser();
      const contexts = [];
      
      for (let i = 0; i < concurrentSessions; i++) {
        const context = await browser.createIncognitoBrowserContext();
        const sessionPage = await context.newPage();
        contexts.push({ context, page: sessionPage });
      }
      
      // Run concurrent sessions
      const sessionPromises = contexts.map(async ({ page: sessionPage }, index) => {
        const startTime = Date.now();
        
        try {
          await sessionPage.goto(`${PERFORMANCE_CONFIG.baseUrl}/students/test-student-${index}`);
          await sessionPage.click('[data-testid="discussion-topics-tab"]');
          await sessionPage.waitForSelector('[data-testid="topics-list"]');
          
          // Each session performs different actions
          if (index === 0) {
            // Session 0: Create topics
            await sessionPage.type('[data-testid="custom-topic-input"]', `Concurrent Topic ${index}`);
            await sessionPage.click('[data-testid="create-topic-button"]');
          } else if (index === 1) {
            // Session 1: Browse and search
            await sessionPage.type('[data-testid="topic-search"]', 'search test');
            await sessionPage.waitForTimeout(1000);
          } else {
            // Session 2: Use flashcards
            await sessionPage.click('[data-testid="topic-card"]:first-child');
            await sessionPage.waitForSelector('[data-testid="flashcard-interface"]');
            await sessionPage.keyboard.press('ArrowRight');
            await sessionPage.keyboard.press('ArrowRight');
          }
          
          const endTime = Date.now();
          return {
            sessionId: index,
            duration: endTime - startTime,
            success: true,
          };
        } catch (error) {
          return {
            sessionId: index,
            duration: Date.now() - startTime,
            success: false,
            error: error.message,
          };
        }
      });
      
      const results = await Promise.all(sessionPromises);
      
      // Clean up contexts
      for (const { context } of contexts) {
        await context.close();
      }
      
      return {
        concurrentSessions,
        results,
        averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        successRate: (results.filter(r => r.success).length / results.length) * 100,
      };
    },
  },
];

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  console.log('🚀 Starting performance testing for Discussion Topics feature');
  
  const results = {
    timestamp: new Date().toISOString(),
    config: PERFORMANCE_CONFIG,
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    for (const test of performanceTests) {
      console.log(`🧪 Running: ${test.name}`);
      
      const page = await browser.newPage();
      const startTime = Date.now();
      
      try {
        const testResult = await test.test(page);
        const duration = Date.now() - startTime;
        
        const result = {
          name: test.name,
          description: test.description,
          status: 'passed',
          duration,
          data: testResult,
          warnings: [],
        };
        
        // Check for performance warnings
        if (test.name === 'Component Render Performance') {
          if (testResult.navigationTime > PERFORMANCE_CONFIG.thresholds.componentRender) {
            result.warnings.push(`Slow navigation: ${testResult.navigationTime.toFixed(2)}ms`);
          }
        }
        
        if (test.name === 'Memory Usage Monitoring') {
          if (testResult.peakMemory > PERFORMANCE_CONFIG.thresholds.memoryUsage) {
            result.warnings.push(`High memory usage: ${testResult.peakMemory.toFixed(2)}MB`);
          }
          if (testResult.memoryGrowth > 50) {
            result.warnings.push(`Memory growth detected: ${testResult.memoryGrowth.toFixed(2)}MB`);
          }
        }
        
        if (test.name === 'Database Operation Performance') {
          if (testResult.slowOperations.length > 0) {
            result.warnings.push(`${testResult.slowOperations.length} slow database operations`);
          }
        }
        
        results.tests.push(result);
        results.summary.total++;
        results.summary.passed++;
        
        if (result.warnings.length > 0) {
          results.summary.warnings++;
          console.log(`⚠️  Completed with warnings: ${test.name}`);
          result.warnings.forEach(warning => console.log(`   - ${warning}`));
        } else {
          console.log(`✅ Passed: ${test.name}`);
        }
        
      } catch (error) {
        const result = {
          name: test.name,
          description: test.description,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error.message,
          warnings: [],
        };
        
        results.tests.push(result);
        results.summary.total++;
        results.summary.failed++;
        
        console.log(`❌ Failed: ${test.name} - ${error.message}`);
      }
      
      await page.close();
    }
    
  } finally {
    await browser.close();
  }
  
  // Generate report
  const resultsDir = 'test-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const reportPath = path.join(resultsDir, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n📊 Performance Test Summary:');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Warnings: ${results.summary.warnings}`);
  
  if (results.summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }
  
  if (results.summary.warnings > 0) {
    console.log('\n⚠️  Performance Warnings:');
    results.tests
      .filter(t => t.warnings.length > 0)
      .forEach(t => {
        console.log(`  - ${t.name}:`);
        t.warnings.forEach(w => console.log(`    * ${w}`));
      });
  }
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('❌ Performance test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests,
  performanceTests,
  PERFORMANCE_CONFIG,
};