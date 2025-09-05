/**
 * Integration tests for Email Testing Workflow
 * Tests the complete flow from sending test emails to tracking their status
 */

import { createClient } from '@supabase/supabase-js';
import { EmailTestService } from '@/lib/email-test-service';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('Email Testing Workflow Integration', () => {
  let mockSupabase: any;
  let emailTestService: EmailTestService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(() => Promise.resolve({
          data: { session: { access_token: 'test-token' } }
        }))
      },
      from: jest.fn(),
      functions: {
        invoke: jest.fn()
      }
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    emailTestService = new EmailTestService();
  });

  describe('Complete Test Email Workflow', () => {
    it('should complete full workflow: send test -> track status -> verify delivery', async () => {
      // Mock data
      const templateId = 'template-123';
      const testId = 'test-456';
      const recipientEmail = 'test@example.com';
      const testParameters = { user_name: 'John Doe', app_name: 'TestApp' };

      const mockTemplate = {
        id: templateId,
        type: 'welcome',
        subject: 'Welcome {{user_name}} to {{app_name}}!',
        html_content: '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{app_name}}.</p>',
        text_content: 'Welcome {{user_name}}! Thank you for joining {{app_name}}.',
        placeholders: ['user_name', 'app_name']
      };

      const mockSMTPConfig = {
        id: 'smtp-123',
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password_encrypted: 'encrypted-password',
        encryption: 'tls',
        is_active: true
      };

      // Step 1: Validate test parameters
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'email_templates') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockTemplate, error: null })
              })
            })
          };
        }
      });

      const validation = await emailTestService.validateTestParameters(templateId, testParameters);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 2: Generate preview
      const preview = await emailTestService.generatePreview(templateId, testParameters);
      expect(preview.subject).toBe('Welcome John Doe to TestApp!');
      expect(preview.htmlContent).toContain('Welcome John Doe!');
      expect(preview.htmlContent).toContain('TestApp');

      // Step 3: Send test email
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          testId,
          status: 'sent',
          message: 'Test email sent successfully',
          previewHtml: preview.htmlContent
        })
      });

      const sendResult = await emailTestService.sendTestEmail({
        templateId,
        recipientEmail,
        testParameters
      });

      expect(sendResult.testId).toBe(testId);
      expect(sendResult.status).toBe('sent');
      expect(fetch).toHaveBeenCalledWith('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          templateId,
          recipientEmail,
          testParameters
        })
      });

      // Step 4: Track status immediately after sending
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          testId,
          status: 'sent',
          recipientEmail,
          subject: 'Welcome John Doe to TestApp!',
          sentAt: '2023-01-01T00:00:00Z',
          retryAttempts: 0,
          metadata: { test_parameters: testParameters }
        })
      });

      const initialStatus = await emailTestService.getTestStatus(testId);
      expect(initialStatus.status).toBe('sent');
      expect(initialStatus.recipientEmail).toBe(recipientEmail);

      // Step 5: Simulate status update to delivered
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          testId,
          status: 'delivered',
          recipientEmail,
          subject: 'Welcome John Doe to TestApp!',
          sentAt: '2023-01-01T00:00:00Z',
          deliveredAt: '2023-01-01T00:01:00Z',
          retryAttempts: 0,
          metadata: { test_parameters: testParameters }
        })
      });

      const finalStatus = await emailTestService.getTestStatus(testId);
      expect(finalStatus.status).toBe('delivered');
      expect(finalStatus.deliveredAt).toBeDefined();
    });

    it('should handle failed test email with retry logic', async () => {
      const templateId = 'template-123';
      const testId = 'test-456';
      const recipientEmail = 'test@example.com';
      const testParameters = { user_name: 'John Doe' };

      // Step 1: Send test email that fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          testId,
          status: 'failed',
          message: 'SMTP connection failed'
        })
      });

      await expect(emailTestService.sendTestEmail({
        templateId,
        recipientEmail,
        testParameters
      })).rejects.toThrow('SMTP connection failed');

      // Step 2: Check status shows failed with retry attempt
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          testId,
          status: 'failed',
          recipientEmail,
          subject: 'Welcome John Doe!',
          sentAt: '2023-01-01T00:00:00Z',
          errorMessage: 'SMTP connection failed',
          retryAttempts: 1,
          metadata: { 
            test_parameters: testParameters,
            retry_attempt: 1,
            last_retry_at: '2023-01-01T00:05:00Z'
          }
        })
      });

      const failedStatus = await emailTestService.getTestStatus(testId);
      expect(failedStatus.status).toBe('failed');
      expect(failedStatus.errorMessage).toBe('SMTP connection failed');
      expect(failedStatus.retryAttempts).toBe(1);
    });

    it('should handle test email with missing SMTP configuration', async () => {
      const templateId = 'template-123';
      const recipientEmail = 'test@example.com';
      const testParameters = { user_name: 'John Doe' };

      // Mock API response for missing SMTP config
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          testId: '',
          status: 'failed',
          message: 'No active SMTP configuration found'
        })
      });

      await expect(emailTestService.sendTestEmail({
        templateId,
        recipientEmail,
        testParameters
      })).rejects.toThrow('No active SMTP configuration found');
    });

    it('should handle test email with invalid template', async () => {
      const templateId = 'nonexistent-template';
      const recipientEmail = 'test@example.com';
      const testParameters = { user_name: 'John Doe' };

      // Mock API response for template not found
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          testId: '',
          status: 'failed',
          message: 'Template not found'
        })
      });

      await expect(emailTestService.sendTestEmail({
        templateId,
        recipientEmail,
        testParameters
      })).rejects.toThrow('Template not found');
    });
  });

  describe('Test History and Analytics', () => {
    it('should retrieve and analyze test history', async () => {
      const mockTestHistory = [
        {
          id: 'test-1',
          status: 'delivered',
          recipient_email: 'user1@example.com',
          subject: 'Welcome User 1!',
          sent_at: '2023-01-01T00:00:00Z',
          delivered_at: '2023-01-01T00:01:00Z',
          template_type: 'welcome',
          metadata: {}
        },
        {
          id: 'test-2',
          status: 'failed',
          recipient_email: 'user2@example.com',
          subject: 'Welcome User 2!',
          sent_at: '2023-01-01T01:00:00Z',
          template_type: 'welcome',
          error_message: 'Invalid email address',
          metadata: { retry_attempt: 2 }
        },
        {
          id: 'test-3',
          status: 'sent',
          recipient_email: 'user3@example.com',
          subject: 'Lesson Reminder',
          sent_at: '2023-01-01T02:00:00Z',
          template_type: 'lesson_reminder',
          metadata: {}
        }
      ];

      // Mock Supabase query for test history
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockTestHistory,
                error: null,
                count: 3
              })
            })
          })
        })
      });

      const history = await emailTestService.getTestHistory(1, 10);
      
      expect(history.tests).toHaveLength(3);
      expect(history.totalCount).toBe(3);
      expect(history.tests[0].status).toBe('delivered');
      expect(history.tests[1].retryAttempts).toBe(2);

      // Test statistics calculation
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockTestHistory,
            error: null
          })
        })
      });

      const stats = await emailTestService.getTestStatistics();
      
      expect(stats.totalTests).toBe(3);
      expect(stats.successfulTests).toBe(2); // delivered + sent
      expect(stats.failedTests).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.testsByTemplate).toEqual({
        welcome: 2,
        lesson_reminder: 1
      });
    });

    it('should filter test history by criteria', async () => {
      const mockFilteredTests = [
        {
          id: 'test-1',
          status: 'delivered',
          recipient_email: 'user1@example.com',
          subject: 'Welcome User 1!',
          sent_at: '2023-01-01T00:00:00Z',
          template_type: 'welcome',
          metadata: {}
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockFilteredTests,
          error: null,
          count: 1
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const history = await emailTestService.getTestHistory(1, 10, {
        templateType: 'welcome',
        status: 'delivered',
        dateFrom: '2023-01-01',
        dateTo: '2023-01-31'
      });

      expect(history.tests).toHaveLength(1);
      expect(history.tests[0].status).toBe('delivered');
      expect(mockQuery.eq).toHaveBeenCalledWith('template_type', 'welcome');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'delivered');
    });
  });

  describe('Test Cleanup and Maintenance', () => {
    it('should cleanup old test logs', async () => {
      const mockDeletedTests = [
        { id: 'old-test-1' },
        { id: 'old-test-2' },
        { id: 'old-test-3' }
      ];

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lt: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: mockDeletedTests,
                error: null
              })
            })
          })
        })
      });

      const result = await emailTestService.cleanupOldTests(30);
      
      expect(result.deletedCount).toBe(3);
    });
  });
});