/**
 * Unit tests for Email Integration Service
 * Tests the core email integration functionality that connects all email management components
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { emailIntegrationService } from '@/lib/email-integration-service';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
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

// Mock other services
jest.mock('@/lib/email-template-utils', () => ({
  renderTemplate: jest.fn(),
  validateTemplate: jest.fn(() => ({ isValid: true, errors: [] })),
  extractPlaceholders: jest.fn(() => ['{{user_name}}', '{{user_email}}'])
}));

jest.mock('@/lib/smtp-validation', () => ({
  validateSMTPConfig: jest.fn(() => Promise.resolve({ isValid: true, errors: [] })),
  testSMTPConnection: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('@/lib/email-encryption', () => ({
  decryptPassword: jest.fn((encrypted) => encrypted.replace('encrypted_', ''))
}));

describe('Email Integration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendIntegratedEmail', () => {
    it('should send email with complete integration workflow', async () => {
      // Mock template retrieval
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'template-1',
          type: 'welcome',
          subject: 'Welcome {{user_name}}!',
          html_content: '<h1>Welcome {{user_name}}!</h1>',
          text_content: 'Welcome {{user_name}}!',
          is_active: true
        }],
        error: null
      });

      // Mock SMTP config retrieval
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'smtp-1',
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          username: 'test@gmail.com',
          password_encrypted: 'encrypted_password123',
          encryption: 'tls',
          is_active: true
        }],
        error: null
      });

      // Mock email sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'msg-123' },
        error: null
      });

      // Mock email log creation
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'log-1' },
        error: null
      });

      const result = await emailIntegrationService.sendIntegratedEmail({
        templateType: 'welcome',
        recipientEmail: 'user@example.com',
        templateData: {
          user_name: 'John Doe',
          user_email: 'user@example.com'
        },
        userId: 'user-1'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'send-integrated-email',
        expect.objectContaining({
          templateData: expect.objectContaining({
            user_name: 'John Doe'
          }),
          recipientEmail: 'user@example.com'
        })
      );
    });

    it('should handle missing template gracefully', async () => {
      // Mock empty template result
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await emailIntegrationService.sendIntegratedEmail({
        templateType: 'nonexistent',
        recipientEmail: 'user@example.com',
        templateData: {},
        userId: 'user-1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template not found');
    });

    it('should handle missing SMTP configuration', async () => {
      // Mock template found
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'template-1',
          type: 'welcome',
          is_active: true
        }],
        error: null
      });

      // Mock no SMTP configs
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await emailIntegrationService.sendIntegratedEmail({
        templateType: 'welcome',
        recipientEmail: 'user@example.com',
        templateData: {},
        userId: 'user-1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP configuration');
    });

    it('should handle email sending failure with retry logic', async () => {
      // Mock template and SMTP config
      mockSupabase.from().select
        .mockResolvedValueOnce({
          data: [{ id: 'template-1', type: 'welcome', is_active: true }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [{ id: 'smtp-1', is_active: true }],
          error: null
        });

      // Mock failed email sending
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'SMTP connection failed' }
        })
        .mockResolvedValueOnce({
          data: { success: true, messageId: 'msg-retry-123' },
          error: null
        });

      // Mock log creation for both attempts
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'log-1' },
        error: null
      });

      const result = await emailIntegrationService.sendIntegratedEmail({
        templateType: 'welcome',
        recipientEmail: 'user@example.com',
        templateData: {},
        userId: 'user-1',
        retryAttempts: 1
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-retry-123');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateEmailConfiguration', () => {
    it('should validate complete email system configuration', async () => {
      // Mock active templates
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { type: 'welcome', is_active: true },
          { type: 'password_reset', is_active: true }
        ],
        error: null
      });

      // Mock active SMTP configs
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { provider: 'gmail', is_active: true }
        ],
        error: null
      });

      const validation = await emailIntegrationService.validateEmailConfiguration();

      expect(validation.isValid).toBe(true);
      expect(validation.activeTemplates).toHaveLength(2);
      expect(validation.activeSMTPConfigs).toHaveLength(1);
      expect(validation.issues).toHaveLength(0);
    });

    it('should identify missing critical templates', async () => {
      // Mock missing welcome template
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { type: 'password_reset', is_active: true }
        ],
        error: null
      });

      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ provider: 'gmail', is_active: true }],
        error: null
      });

      const validation = await emailIntegrationService.validateEmailConfiguration();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Missing critical template: welcome');
    });

    it('should identify missing SMTP configuration', async () => {
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ type: 'welcome', is_active: true }],
        error: null
      });

      // Mock no SMTP configs
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const validation = await emailIntegrationService.validateEmailConfiguration();

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('No active SMTP configuration found');
    });
  });

  describe('getEmailSystemHealth', () => {
    it('should return comprehensive system health status', async () => {
      // Mock recent email logs
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { status: 'delivered', sent_at: new Date().toISOString() },
          { status: 'delivered', sent_at: new Date().toISOString() },
          { status: 'failed', sent_at: new Date().toISOString() }
        ],
        error: null
      });

      // Mock template count
      mockSupabase.from().select.mockResolvedValueOnce({
        count: 5,
        error: null
      });

      // Mock SMTP config count
      mockSupabase.from().select.mockResolvedValueOnce({
        count: 2,
        error: null
      });

      const health = await emailIntegrationService.getEmailSystemHealth();

      expect(health.status).toBe('healthy');
      expect(health.metrics.deliveryRate).toBeCloseTo(66.67, 1);
      expect(health.metrics.totalTemplates).toBe(5);
      expect(health.metrics.activeSMTPConfigs).toBe(2);
      expect(health.lastChecked).toBeDefined();
    });

    it('should identify unhealthy system with high failure rate', async () => {
      // Mock high failure rate
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { status: 'failed', sent_at: new Date().toISOString() },
          { status: 'failed', sent_at: new Date().toISOString() },
          { status: 'delivered', sent_at: new Date().toISOString() }
        ],
        error: null
      });

      mockSupabase.from().select.mockResolvedValueOnce({
        count: 5,
        error: null
      });

      mockSupabase.from().select.mockResolvedValueOnce({
        count: 1,
        error: null
      });

      const health = await emailIntegrationService.getEmailSystemHealth();

      expect(health.status).toBe('degraded');
      expect(health.metrics.deliveryRate).toBeCloseTo(33.33, 1);
      expect(health.alerts).toContain('High email failure rate detected');
    });
  });

  describe('bulkEmailOperation', () => {
    it('should handle bulk email sending with rate limiting', async () => {
      const recipients = [
        { email: 'user1@example.com', data: { user_name: 'User 1' } },
        { email: 'user2@example.com', data: { user_name: 'User 2' } },
        { email: 'user3@example.com', data: { user_name: 'User 3' } }
      ];

      // Mock template and SMTP config for each call
      mockSupabase.from().select
        .mockResolvedValue({
          data: [{ id: 'template-1', type: 'newsletter', is_active: true }],
          error: null
        });

      // Mock successful email sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'msg-bulk-123' },
        error: null
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'log-1' },
        error: null
      });

      const result = await emailIntegrationService.bulkEmailOperation({
        templateType: 'newsletter',
        recipients,
        batchSize: 2,
        delayBetweenBatches: 100
      });

      expect(result.success).toBe(true);
      expect(result.totalSent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.batches).toBe(2); // 3 recipients with batch size 2 = 2 batches
    });

    it('should handle partial failures in bulk operation', async () => {
      const recipients = [
        { email: 'user1@example.com', data: { user_name: 'User 1' } },
        { email: 'invalid-email', data: { user_name: 'User 2' } }
      ];

      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'template-1', type: 'newsletter', is_active: true }],
        error: null
      });

      // Mock mixed success/failure
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { success: true, messageId: 'msg-1' },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Invalid email format' }
        });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'log-1' },
        error: null
      });

      const result = await emailIntegrationService.bulkEmailOperation({
        templateType: 'newsletter',
        recipients,
        batchSize: 1
      });

      expect(result.success).toBe(true); // Partial success
      expect(result.totalSent).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('scheduleEmail', () => {
    it('should schedule email for future delivery', async () => {
      const scheduleTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      mockSupabase.from().insert.mockResolvedValue({
        data: {
          id: 'scheduled-1',
          template_type: 'reminder',
          recipient_email: 'user@example.com',
          scheduled_for: scheduleTime.toISOString(),
          status: 'scheduled'
        },
        error: null
      });

      const result = await emailIntegrationService.scheduleEmail({
        templateType: 'reminder',
        recipientEmail: 'user@example.com',
        templateData: { user_name: 'John' },
        scheduledFor: scheduleTime,
        userId: 'user-1'
      });

      expect(result.success).toBe(true);
      expect(result.scheduledId).toBe('scheduled-1');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          template_type: 'reminder',
          recipient_email: 'user@example.com',
          scheduled_for: scheduleTime.toISOString(),
          status: 'scheduled'
        })
      );
    });

    it('should reject scheduling for past dates', async () => {
      const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const result = await emailIntegrationService.scheduleEmail({
        templateType: 'reminder',
        recipientEmail: 'user@example.com',
        templateData: {},
        scheduledFor: pastTime,
        userId: 'user-1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot schedule emails for past dates');
    });
  });

  describe('processScheduledEmails', () => {
    it('should process due scheduled emails', async () => {
      const now = new Date();
      
      // Mock scheduled emails due for sending
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          {
            id: 'scheduled-1',
            template_type: 'reminder',
            recipient_email: 'user1@example.com',
            template_data: { user_name: 'User 1' },
            scheduled_for: new Date(now.getTime() - 1000).toISOString(), // 1 second ago
            status: 'scheduled'
          },
          {
            id: 'scheduled-2',
            template_type: 'reminder',
            recipient_email: 'user2@example.com',
            template_data: { user_name: 'User 2' },
            scheduled_for: new Date(now.getTime() - 2000).toISOString(), // 2 seconds ago
            status: 'scheduled'
          }
        ],
        error: null
      });

      // Mock template and SMTP config
      mockSupabase.from().select.mockResolvedValue({
        data: [{ id: 'template-1', type: 'reminder', is_active: true }],
        error: null
      });

      // Mock successful sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'msg-scheduled' },
        error: null
      });

      // Mock status updates
      mockSupabase.from().update.mockResolvedValue({
        data: null,
        error: null
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'log-1' },
        error: null
      });

      const result = await emailIntegrationService.processScheduledEmails();

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent'
        })
      );
    });
  });
});