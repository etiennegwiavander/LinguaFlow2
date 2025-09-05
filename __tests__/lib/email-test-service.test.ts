/**
 * Tests for Email Test Service
 */

import { EmailTestService } from '@/lib/email-test-service';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { access_token: 'test-token' } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(),
            gte: jest.fn(() => ({
              lte: jest.fn()
            }))
          })),
          gte: jest.fn(() => ({
            lte: jest.fn()
          })),
          lte: jest.fn(() => ({
            gte: jest.fn()
          })),
          lt: jest.fn()
        })),
        range: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          lt: jest.fn(() => ({
            select: jest.fn()
          }))
        }))
      }))
    }))
  }))
}));

describe('EmailTestService', () => {
  let service: EmailTestService;

  beforeEach(() => {
    service = new EmailTestService();
    jest.clearAllMocks();
  });

  describe('sendTestEmail', () => {
    it('should send test email successfully', async () => {
      const mockResponse = {
        testId: 'test-1',
        status: 'sent',
        message: 'Test email sent successfully',
        previewHtml: '<h1>Welcome John!</h1>'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const request = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        testParameters: { user_name: 'John' }
      };

      const result = await service.sendTestEmail(request);

      expect(fetch).toHaveBeenCalledWith('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(request)
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Template not found' })
      });

      const request = {
        templateId: 'nonexistent',
        recipientEmail: 'test@example.com',
        testParameters: { user_name: 'John' }
      };

      await expect(service.sendTestEmail(request)).rejects.toThrow('Template not found');
    });
  });

  describe('getTestStatus', () => {
    it('should get test status successfully', async () => {
      const mockStatus = {
        testId: 'test-1',
        status: 'sent',
        recipientEmail: 'test@example.com',
        subject: 'Welcome John!',
        sentAt: '2023-01-01T00:00:00Z',
        retryAttempts: 0
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      });

      const result = await service.getTestStatus('test-1');

      expect(fetch).toHaveBeenCalledWith('/api/admin/email/test/test-1/status', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(result).toEqual(mockStatus);
    });

    it('should handle not found error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Test email not found' })
      });

      await expect(service.getTestStatus('nonexistent')).rejects.toThrow('Test email not found');
    });
  });

  describe('getTestHistory', () => {
    it('should get test history successfully', async () => {
      const mockTests = [
        {
          id: 'test-1',
          status: 'sent',
          recipient_email: 'test1@example.com',
          subject: 'Welcome John!',
          sent_at: '2023-01-01T00:00:00Z',
          template_type: 'welcome',
          metadata: {}
        },
        {
          id: 'test-2',
          status: 'failed',
          recipient_email: 'test2@example.com',
          subject: 'Welcome Jane!',
          sent_at: '2023-01-01T01:00:00Z',
          template_type: 'welcome',
          error_message: 'SMTP error',
          metadata: { retry_attempt: 1 }
        }
      ];

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockTests,
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const result = await service.getTestHistory(1, 20);

      expect(result.tests).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.tests[0].testId).toBe('test-1');
      expect(result.tests[1].retryAttempts).toBe(1);
    });

    it('should apply filters correctly', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await service.getTestHistory(1, 20, {
        templateType: 'welcome',
        status: 'sent',
        dateFrom: '2023-01-01',
        dateTo: '2023-01-31'
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('template_type', 'welcome');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'sent');
      expect(mockQuery.gte).toHaveBeenCalledWith('sent_at', '2023-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('sent_at', '2023-01-31');
    });
  });

  describe('generatePreview', () => {
    it('should generate email preview successfully', async () => {
      const mockTemplate = {
        subject: 'Welcome {{user_name}}!',
        html_content: '<h1>Welcome {{user_name}}!</h1><p>Your email is {{user_email}}</p>',
        text_content: 'Welcome {{user_name}}! Your email is {{user_email}}'
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTemplate,
              error: null
            })
          })
        })
      });

      const result = await service.generatePreview('template-1', {
        user_name: 'John Doe',
        user_email: 'john@example.com'
      });

      expect(result.subject).toBe('Welcome John Doe!');
      expect(result.htmlContent).toBe('<h1>Welcome John Doe!</h1><p>Your email is john@example.com</p>');
      expect(result.textContent).toBe('Welcome John Doe! Your email is john@example.com');
    });

    it('should handle template not found', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(service.generatePreview('nonexistent', {})).rejects.toThrow('Template not found');
    });
  });

  describe('validateTestParameters', () => {
    it('should validate parameters successfully', async () => {
      const mockTemplate = {
        placeholders: ['user_name', 'user_email']
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTemplate,
              error: null
            })
          })
        })
      });

      const result = await service.validateTestParameters('template-1', {
        user_name: 'John Doe',
        user_email: 'john@example.com'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing required parameters', async () => {
      const mockTemplate = {
        placeholders: ['user_name', 'user_email']
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTemplate,
              error: null
            })
          })
        })
      });

      const result = await service.validateTestParameters('template-1', {
        user_name: 'John Doe'
        // Missing user_email
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: user_email');
    });

    it('should detect extra parameters', async () => {
      const mockTemplate = {
        placeholders: ['user_name']
      };

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTemplate,
              error: null
            })
          })
        })
      });

      const result = await service.validateTestParameters('template-1', {
        user_name: 'John Doe',
        extra_param: 'Extra value'
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Extra parameter provided: extra_param');
    });
  });

  describe('getTestStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const mockTests = [
        {
          status: 'sent',
          template_type: 'welcome',
          sent_at: '2023-01-01T00:00:00Z',
          delivered_at: '2023-01-01T00:01:00Z'
        },
        {
          status: 'sent',
          template_type: 'welcome',
          sent_at: '2023-01-01T01:00:00Z',
          delivered_at: '2023-01-01T01:02:00Z'
        },
        {
          status: 'failed',
          template_type: 'reminder',
          sent_at: '2023-01-01T02:00:00Z',
          delivered_at: null
        }
      ];

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockTests,
            error: null
          })
        })
      });

      const result = await service.getTestStatistics();

      expect(result.totalTests).toBe(3);
      expect(result.successfulTests).toBe(2);
      expect(result.failedTests).toBe(1);
      expect(result.successRate).toBe(66.66666666666666);
      expect(result.testsByTemplate).toEqual({
        welcome: 2,
        reminder: 1
      });
    });
  });

  describe('cleanupOldTests', () => {
    it('should cleanup old tests successfully', async () => {
      const mockDeletedTests = [
        { id: 'test-1' },
        { id: 'test-2' }
      ];

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      
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

      const result = await service.cleanupOldTests(30);

      expect(result.deletedCount).toBe(2);
    });
  });
});