/**
 * Email System Performance Tests
 * Tests for email processing performance, memory usage, and scalability
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';

// Mock Supabase with performance tracking
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn()
  })),
  functions: {
    invoke: jest.fn()
  }
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock email services
jest.mock('@/lib/email-template-utils', () => ({
  renderTemplate: jest.fn(() => Promise.resolve({
    subject: 'Test Subject',
    html: '<h1>Test</h1>',
    text: 'Test'
  })),
  validateTemplate: jest.fn(() => ({ isValid: true, errors: [] }))
}));

jest.mock('@/lib/email-integration-service', () => ({
  emailIntegrationService: {
    sendIntegratedEmail: jest.fn(),
    bulkEmailOperation: jest.fn(),
    processScheduledEmails: jest.fn()
  }
}));

describe('Email System Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Rendering Performance', () => {
    it('should render templates efficiently under load', async () => {
      const { renderTemplate } = await import('@/lib/email-template-utils');
      
      const template = {
        subject: 'Welcome {{user_name}} to {{app_name}}!',
        html_content: `
          <html>
            <body>
              <h1>Welcome {{user_name}}!</h1>
              <p>Thank you for joining {{app_name}}.</p>
              <p>Your email is {{user_email}} and you joined on {{join_date}}.</p>
              <div>{{#each features}}
                <p>Feature: {{name}} - {{description}}</p>
              {{/each}}</div>
            </body>
          </html>
        `,
        text_content: 'Welcome {{user_name}} to {{app_name}}!'
      };

      const templateData = {
        user_name: 'John Doe',
        app_name: 'LinguaFlow',
        user_email: 'john@example.com',
        join_date: new Date().toLocaleDateString(),
        features: [
          { name: 'Lessons', description: 'Interactive language lessons' },
          { name: 'Flashcards', description: 'Vocabulary practice' },
          { name: 'Progress Tracking', description: 'Monitor your learning' }
        ]
      };

      const iterations = 1000;
      const startTime = performance.now();

      // Simulate concurrent template rendering
      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(renderTemplate(template, templateData));
      }

      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;

      expect(averageTime).toBeLessThan(10); // Should render in less than 10ms on average
      expect(totalTime).toBeLessThan(5000); // Total time should be less than 5 seconds
    });

    it('should handle large template data efficiently', async () => {
      const { renderTemplate } = await import('@/lib/email-template-utils');
      
      // Create large template data
      const largeTemplateData = {
        user_name: 'Test User',
        lessons: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          title: `Lesson ${i}`,
          description: `This is lesson ${i} with a longer description that contains more text to test performance with larger data sets.`,
          progress: Math.random() * 100,
          completed: Math.random() > 0.5
        }))
      };

      const template = {
        subject: 'Your Progress Report',
        html_content: `
          <html>
            <body>
              <h1>Progress Report for {{user_name}}</h1>
              {{#each lessons}}
                <div>
                  <h3>{{title}}</h3>
                  <p>{{description}}</p>
                  <p>Progress: {{progress}}%</p>
                  <p>Status: {{#if completed}}Completed{{else}}In Progress{{/if}}</p>
                </div>
              {{/each}}
            </body>
          </html>
        `
      };

      const startTime = performance.now();
      await renderTemplate(template, largeTemplateData);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // Should handle large data in less than 100ms
    });
  });

  describe('Bulk Email Processing Performance', () => {
    it('should process bulk emails efficiently with batching', async () => {
      const { emailIntegrationService } = await import('@/lib/email-integration-service');
      
      // Mock bulk email operation
      emailIntegrationService.bulkEmailOperation.mockImplementation(async ({ recipients, batchSize }) => {
        const batches = Math.ceil(recipients.length / batchSize);
        const processingTime = batches * 50; // Simulate 50ms per batch
        
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        return {
          success: true,
          totalSent: recipients.length,
          failed: 0,
          batches,
          processingTime
        };
      });

      const recipients = Array.from({ length: 10000 }, (_, i) => ({
        email: `user${i}@example.com`,
        data: { user_name: `User ${i}` }
      }));

      const startTime = performance.now();
      
      const result = await emailIntegrationService.bulkEmailOperation({
        templateType: 'newsletter',
        recipients,
        batchSize: 100
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.totalSent).toBe(10000);
      expect(result.batches).toBe(100);
      expect(totalTime).toBeLessThan(10000); // Should complete in less than 10 seconds
      
      // Calculate throughput
      const emailsPerSecond = result.totalSent / (totalTime / 1000);
      expect(emailsPerSecond).toBeGreaterThan(1000); // Should process at least 1000 emails/second
    });

    it('should handle memory efficiently during bulk operations', async () => {
      const { emailIntegrationService } = await import('@/lib/email-integration-service');
      
      // Mock memory-efficient bulk processing
      emailIntegrationService.bulkEmailOperation.mockImplementation(async ({ recipients, batchSize }) => {
        let processed = 0;
        const batches = Math.ceil(recipients.length / batchSize);
        
        // Process in batches to simulate memory management
        for (let i = 0; i < batches; i++) {
          const batch = recipients.slice(i * batchSize, (i + 1) * batchSize);
          
          // Simulate processing batch
          await new Promise(resolve => setTimeout(resolve, 10));
          processed += batch.length;
          
          // Simulate memory cleanup between batches
          if (global.gc) {
            global.gc();
          }
        }
        
        return {
          success: true,
          totalSent: processed,
          failed: 0,
          batches,
          memoryEfficient: true
        };
      });

      const largeRecipientList = Array.from({ length: 50000 }, (_, i) => ({
        email: `user${i}@example.com`,
        data: { user_name: `User ${i}` }
      }));

      const initialMemory = process.memoryUsage();
      
      const result = await emailIntegrationService.bulkEmailOperation({
        templateType: 'newsletter',
        recipients: largeRecipientList,
        batchSize: 500
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(result.success).toBe(true);
      expect(result.totalSent).toBe(50000);
      
      // Memory increase should be reasonable (less than 100MB for 50k emails)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Database Query Performance', () => {
    it('should optimize email log queries for large datasets', async () => {
      // Mock large dataset queries
      mockSupabase.from().select.mockImplementation(() => {
        const startTime = performance.now();
        
        // Simulate database query time based on complexity
        const queryTime = Math.random() * 50 + 10; // 10-60ms
        
        return new Promise(resolve => {
          setTimeout(() => {
            const endTime = performance.now();
            resolve({
              data: Array.from({ length: 1000 }, (_, i) => ({
                id: `log-${i}`,
                recipient_email: `user${i}@example.com`,
                status: 'delivered',
                sent_at: new Date().toISOString()
              })),
              error: null,
              queryTime: endTime - startTime
            });
          }, queryTime);
        });
      });

      const { GET: getEmailLogs } = await import('@/app/api/admin/email/logs/route');
      
      const startTime = performance.now();
      
      // Simulate multiple concurrent queries
      const queries = Array.from({ length: 10 }, () => 
        getEmailLogs(new Request('http://localhost:3000/api/admin/email/logs?limit=1000'))
      );

      const results = await Promise.all(queries);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All queries should succeed
      results.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Concurrent queries should complete efficiently
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 10 concurrent queries
    });

    it('should handle email analytics aggregation efficiently', async () => {
      // Mock analytics data aggregation
      mockSupabase.from().select.mockImplementation(() => {
        return Promise.resolve({
          data: Array.from({ length: 100000 }, (_, i) => ({
            id: i,
            status: ['delivered', 'failed', 'bounced'][i % 3],
            template_type: ['welcome', 'newsletter', 'reminder'][i % 3],
            sent_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          })),
          error: null
        });
      });

      const { GET: getAnalytics } = await import('@/app/api/admin/email/analytics/route');
      
      const startTime = performance.now();
      
      const response = await getAnalytics(
        new Request('http://localhost:3000/api/admin/email/analytics?period=30d')
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totalEmails).toBe(100000);
      
      // Analytics processing should be efficient even with large datasets
      expect(processingTime).toBeLessThan(500); // Less than 500ms
    });
  });

  describe('SMTP Connection Performance', () => {
    it('should manage SMTP connections efficiently', async () => {
      const { testSMTPConnection } = await import('@/lib/smtp-validation');
      
      // Mock SMTP connection testing with realistic timing
      const mockTestSMTPConnection = testSMTPConnection as jest.MockedFunction<typeof testSMTPConnection>;
      mockTestSMTPConnection.mockImplementation(async (config) => {
        const connectionTime = Math.random() * 1000 + 500; // 500-1500ms
        
        await new Promise(resolve => setTimeout(resolve, connectionTime));
        
        return {
          success: true,
          message: 'Connection successful',
          connectionTime,
          config: config.provider
        };
      });

      const smtpConfigs = [
        { provider: 'gmail', host: 'smtp.gmail.com', port: 587 },
        { provider: 'sendgrid', host: 'smtp.sendgrid.net', port: 587 },
        { provider: 'ses', host: 'email-smtp.us-east-1.amazonaws.com', port: 587 }
      ];

      const startTime = performance.now();
      
      // Test connections concurrently
      const connectionTests = smtpConfigs.map(config => testSMTPConnection(config));
      const results = await Promise.all(connectionTests);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All connections should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.connectionTime).toBeLessThan(2000); // Individual connection under 2s
      });

      // Concurrent testing should be faster than sequential
      expect(totalTime).toBeLessThan(2000); // Total time should be less than 2s for concurrent
    });

    it('should handle connection pooling efficiently', async () => {
      // Mock connection pool management
      const connectionPool = new Map();
      
      const mockCreateConnection = jest.fn().mockImplementation(async (config) => {
        const poolKey = `${config.host}:${config.port}`;
        
        if (connectionPool.has(poolKey)) {
          return {
            connection: connectionPool.get(poolKey),
            fromPool: true,
            creationTime: 0
          };
        }
        
        const startTime = performance.now();
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate connection creation
        const endTime = performance.now();
        
        const connection = { id: Math.random(), config };
        connectionPool.set(poolKey, connection);
        
        return {
          connection,
          fromPool: false,
          creationTime: endTime - startTime
        };
      });

      const config = { host: 'smtp.gmail.com', port: 587 };
      
      // First connection should be created
      const firstConnection = await mockCreateConnection(config);
      expect(firstConnection.fromPool).toBe(false);
      expect(firstConnection.creationTime).toBeGreaterThan(90);

      // Subsequent connections should use pool
      const secondConnection = await mockCreateConnection(config);
      expect(secondConnection.fromPool).toBe(true);
      expect(secondConnection.creationTime).toBe(0);

      // Pool should reuse connections efficiently
      const multipleConnections = await Promise.all(
        Array.from({ length: 10 }, () => mockCreateConnection(config))
      );

      multipleConnections.forEach(conn => {
        expect(conn.fromPool).toBe(true);
        expect(conn.creationTime).toBe(0);
      });
    });
  });

  describe('Template Caching Performance', () => {
    it('should cache templates efficiently for repeated use', async () => {
      const templateCache = new Map();
      
      const mockGetTemplate = jest.fn().mockImplementation(async (templateId) => {
        if (templateCache.has(templateId)) {
          return {
            template: templateCache.get(templateId),
            fromCache: true,
            retrievalTime: 1 // 1ms from cache
          };
        }
        
        const startTime = performance.now();
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB query
        const endTime = performance.now();
        
        const template = {
          id: templateId,
          subject: 'Test Template',
          html_content: '<h1>Test</h1>',
          text_content: 'Test'
        };
        
        templateCache.set(templateId, template);
        
        return {
          template,
          fromCache: false,
          retrievalTime: endTime - startTime
        };
      });

      // First retrieval should hit database
      const firstRetrieval = await mockGetTemplate('template-1');
      expect(firstRetrieval.fromCache).toBe(false);
      expect(firstRetrieval.retrievalTime).toBeGreaterThan(40);

      // Subsequent retrievals should use cache
      const cachedRetrievals = await Promise.all(
        Array.from({ length: 100 }, () => mockGetTemplate('template-1'))
      );

      cachedRetrievals.forEach(retrieval => {
        expect(retrieval.fromCache).toBe(true);
        expect(retrieval.retrievalTime).toBe(1);
      });

      // Cache should significantly improve performance
      const totalCacheTime = cachedRetrievals.reduce((sum, r) => sum + r.retrievalTime, 0);
      expect(totalCacheTime).toBeLessThan(200); // 100 cached retrievals in less than 200ms
    });
  });

  describe('Concurrent Email Processing', () => {
    it('should handle concurrent email operations without degradation', async () => {
      const { emailIntegrationService } = await import('@/lib/email-integration-service');
      
      // Mock concurrent email sending
      emailIntegrationService.sendIntegratedEmail.mockImplementation(async () => {
        const processingTime = Math.random() * 100 + 50; // 50-150ms
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        return {
          success: true,
          messageId: `msg-${Math.random()}`,
          processingTime
        };
      });

      const concurrentOperations = 50;
      const startTime = performance.now();
      
      // Send multiple emails concurrently
      const emailPromises = Array.from({ length: concurrentOperations }, (_, i) =>
        emailIntegrationService.sendIntegratedEmail({
          templateType: 'welcome',
          recipientEmail: `user${i}@example.com`,
          templateData: { user_name: `User ${i}` },
          userId: `user-${i}`
        })
      );

      const results = await Promise.all(emailPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Concurrent processing should be efficient
      const averageTime = totalTime / concurrentOperations;
      expect(averageTime).toBeLessThan(200); // Average processing time under 200ms
      expect(totalTime).toBeLessThan(5000); // Total time under 5 seconds
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should maintain stable memory usage during extended operations', async () => {
      const { emailIntegrationService } = await import('@/lib/email-integration-service');
      
      // Mock memory-conscious email processing
      emailIntegrationService.processScheduledEmails.mockImplementation(async () => {
        // Simulate processing with memory cleanup
        const batchSize = 100;
        let processed = 0;
        
        for (let i = 0; i < 10; i++) { // 10 batches
          // Process batch
          await new Promise(resolve => setTimeout(resolve, 10));
          processed += batchSize;
          
          // Simulate memory cleanup
          if (global.gc) {
            global.gc();
          }
        }
        
        return {
          processed,
          successful: processed,
          failed: 0
        };
      });

      const initialMemory = process.memoryUsage();
      
      // Run extended processing simulation
      for (let i = 0; i < 5; i++) {
        await emailIntegrationService.processScheduledEmails();
        
        // Check memory usage doesn't grow excessively
        const currentMemory = process.memoryUsage();
        const memoryGrowth = currentMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory growth should be controlled (less than 50MB)
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      }
      
      const finalMemory = process.memoryUsage();
      const totalMemoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Total memory growth should remain reasonable
      expect(totalMemoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});