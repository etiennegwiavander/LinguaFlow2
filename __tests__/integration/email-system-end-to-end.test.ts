/**
 * End-to-End Email System Integration Tests
 * Tests complete workflows from admin configuration to email delivery
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock all external dependencies
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn()
  })),
  functions: {
    invoke: jest.fn()
  },
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  createClient: () => mockSupabase
}));

// Mock services
jest.mock('@/lib/email-encryption', () => ({
  encryptPassword: jest.fn((password) => `encrypted_${password}`),
  decryptPassword: jest.fn((encrypted) => encrypted.replace('encrypted_', ''))
}));

jest.mock('@/lib/smtp-validation', () => ({
  validateSMTPConfig: jest.fn(() => Promise.resolve({ isValid: true, errors: [] })),
  testSMTPConnection: jest.fn(() => Promise.resolve({ success: true, message: 'Connection successful' }))
}));

jest.mock('@/lib/email-template-utils', () => ({
  validateTemplate: jest.fn(() => ({ isValid: true, errors: [] })),
  sanitizeHTML: jest.fn((html) => html),
  extractPlaceholders: jest.fn(() => ['{{user_name}}', '{{user_email}}']),
  renderTemplate: jest.fn(() => Promise.resolve({
    subject: 'Welcome John Doe!',
    html: '<h1>Welcome John Doe!</h1>',
    text: 'Welcome John Doe!'
  }))
}));

describe('Email System End-to-End Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default admin authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      error: null
    });

    mockSupabase.from().single.mockResolvedValue({
      data: {
        setting_value: JSON.stringify([
          { id: 'admin-1', email: 'admin@example.com', role: 'admin', permissions: ['system_admin'] }
        ])
      },
      error: null
    });
  });

  describe('Complete Email System Setup Workflow', () => {
    it('should complete full system setup from scratch', async () => {
      // Step 1: Create SMTP Configuration
      const { POST: createSMTPConfig } = await import('@/app/api/admin/email/smtp-config/route');
      
      const smtpData = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'admin@company.com',
        password: 'app-password-123',
        encryption: 'tls',
        is_active: true
      };

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'smtp-1', ...smtpData, password_encrypted: 'encrypted_app-password-123' },
        error: null
      });

      const smtpRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(smtpData),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const smtpResponse = await createSMTPConfig(smtpRequest);
      expect(smtpResponse.status).toBe(201);

      // Step 2: Create Welcome Email Template
      const { POST: createTemplate } = await import('@/app/api/admin/email/templates/route');
      
      const welcomeTemplate = {
        type: 'welcome',
        name: 'User Welcome Email',
        subject: 'Welcome to LinguaFlow, {{user_name}}!',
        html_content: `
          <html>
            <body>
              <h1>Welcome {{user_name}}!</h1>
              <p>Thank you for joining LinguaFlow. Your email is {{user_email}}.</p>
              <p>Get started with your first lesson!</p>
              <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
            </body>
          </html>
        `,
        text_content: 'Welcome {{user_name}}! Thank you for joining LinguaFlow.',
        is_active: true
      };

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'template-1', ...welcomeTemplate, version: 1 },
        error: null
      });

      const templateRequest = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(welcomeTemplate),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const templateResponse = await createTemplate(templateRequest);
      expect(templateResponse.status).toBe(201);

      // Step 3: Test Email Configuration
      const { POST: testEmail } = await import('@/app/api/admin/email/test/route');
      
      // Mock template retrieval for test
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'template-1', ...welcomeTemplate }],
        error: null
      });

      // Mock SMTP config retrieval for test
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'smtp-1', ...smtpData, password_encrypted: 'encrypted_app-password-123' }],
        error: null
      });

      // Mock successful email sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'test-msg-123' },
        error: null
      });

      // Mock test log creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'test-1', status: 'sent' },
        error: null
      });

      const testData = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        testParameters: {
          user_name: 'Test User',
          user_email: 'test@example.com'
        }
      };

      const testRequest = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const testResponse = await testEmail(testRequest);
      const testResult = await testResponse.json();

      expect(testResponse.status).toBe(200);
      expect(testResult.success).toBe(true);
      expect(testResult.testId).toBe('test-1');

      // Step 4: Verify System Health
      const { GET: getHealth } = await import('@/app/api/admin/email/health/route');
      
      // Mock health check data
      mockSupabase.from().select
        .mockResolvedValueOnce({ count: 1, error: null }) // Active templates
        .mockResolvedValueOnce({ count: 1, error: null }) // Active SMTP configs
        .mockResolvedValueOnce({ // Recent email logs
          data: [
            { status: 'delivered', sent_at: new Date().toISOString() }
          ],
          error: null
        });

      const healthRequest = new NextRequest('http://localhost:3000/api/admin/email/health', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const healthResponse = await getHealth(healthRequest);
      const healthData = await healthResponse.json();

      expect(healthResponse.status).toBe(200);
      expect(healthData.success).toBe(true);
      expect(healthData.data.status).toBe('healthy');
    });
  });

  describe('User Registration Email Workflow', () => {
    it('should send welcome email on user registration', async () => {
      // Simulate user registration triggering welcome email
      const { POST: sendWelcomeEmail } = await import('@/app/api/welcome-email/route');
      
      // Mock active welcome template
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'welcome-template',
          type: 'welcome',
          subject: 'Welcome {{user_name}}!',
          html_content: '<h1>Welcome {{user_name}}!</h1>',
          text_content: 'Welcome {{user_name}}!',
          is_active: true
        }],
        error: null
      });

      // Mock active SMTP config
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'smtp-1',
          provider: 'gmail',
          is_active: true,
          password_encrypted: 'encrypted_password'
        }],
        error: null
      });

      // Mock successful email sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'welcome-msg-123' },
        error: null
      });

      // Mock email log creation
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'welcome-log-1' },
        error: null
      });

      const welcomeRequest = new NextRequest('http://localhost:3000/api/welcome-email', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'new-user-1',
          userEmail: 'newuser@example.com',
          userName: 'New User'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const welcomeResponse = await sendWelcomeEmail(welcomeRequest);
      const welcomeResult = await welcomeResponse.json();

      expect(welcomeResponse.status).toBe(200);
      expect(welcomeResult.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'send-integrated-email',
        expect.objectContaining({
          templateType: 'welcome',
          recipientEmail: 'newuser@example.com'
        })
      );
    });
  });

  describe('Password Reset Email Workflow', () => {
    it('should send password reset email with secure token', async () => {
      const { POST: resetPassword } = await import('@/app/api/auth/reset-password/route');
      
      // Mock password reset template
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'reset-template',
          type: 'password_reset',
          subject: 'Reset your password',
          html_content: '<p>Click <a href="{{reset_url}}">here</a> to reset your password.</p>',
          is_active: true
        }],
        error: null
      });

      // Mock SMTP config
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'smtp-1', is_active: true }],
        error: null
      });

      // Mock token creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { 
          id: 'token-1',
          token: 'secure-reset-token-123',
          user_id: 'user-1',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        error: null
      });

      // Mock email sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'reset-msg-123' },
        error: null
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'reset-log-1' },
        error: null
      });

      const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const resetResponse = await resetPassword(resetRequest);
      const resetResult = await resetResponse.json();

      expect(resetResponse.status).toBe(200);
      expect(resetResult.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'send-integrated-email',
        expect.objectContaining({
          templateType: 'password_reset'
        })
      );
    });
  });

  describe('Lesson Reminder Email Workflow', () => {
    it('should schedule and send lesson reminder emails', async () => {
      const { POST: scheduleReminders } = await import('@/app/api/admin/email/schedule-reminders/route');
      
      // Mock upcoming lessons
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          {
            id: 'lesson-1',
            user_id: 'user-1',
            user_email: 'student@example.com',
            user_name: 'Student One',
            lesson_title: 'Spanish Basics',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        error: null
      });

      // Mock reminder template
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'reminder-template',
          type: 'lesson_reminder',
          subject: 'Reminder: {{lesson_title}} tomorrow',
          html_content: '<p>Don\'t forget your lesson: {{lesson_title}}</p>',
          is_active: true
        }],
        error: null
      });

      // Mock scheduled email creation
      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'scheduled-reminder-1' },
        error: null
      });

      const reminderRequest = new NextRequest('http://localhost:3000/api/admin/email/schedule-reminders', {
        method: 'POST',
        body: JSON.stringify({
          reminderType: 'lesson_reminder',
          hoursBeforeLesson: 24
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const reminderResponse = await scheduleReminders(reminderRequest);
      const reminderResult = await reminderResponse.json();

      expect(reminderResponse.status).toBe(200);
      expect(reminderResult.success).toBe(true);
      expect(reminderResult.scheduledCount).toBe(1);
    });
  });

  describe('Email Analytics and Monitoring Workflow', () => {
    it('should track and report email analytics', async () => {
      const { GET: getAnalytics } = await import('@/app/api/admin/email/analytics/route');
      
      // Mock email analytics data
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { status: 'delivered', template_type: 'welcome', sent_at: new Date().toISOString() },
          { status: 'delivered', template_type: 'welcome', sent_at: new Date().toISOString() },
          { status: 'failed', template_type: 'password_reset', sent_at: new Date().toISOString() },
          { status: 'bounced', template_type: 'lesson_reminder', sent_at: new Date().toISOString() }
        ],
        error: null
      });

      const analyticsRequest = new NextRequest('http://localhost:3000/api/admin/email/analytics?period=7d', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const analyticsResponse = await getAnalytics(analyticsRequest);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsData.success).toBe(true);
      expect(analyticsData.data.totalEmails).toBe(4);
      expect(analyticsData.data.deliveryRate).toBe(50); // 2 delivered out of 4
      expect(analyticsData.data.byTemplate).toHaveProperty('welcome');
      expect(analyticsData.data.byTemplate).toHaveProperty('password_reset');
    });
  });

  describe('Error Recovery and Failover Workflow', () => {
    it('should handle SMTP failover when primary config fails', async () => {
      const { POST: sendTestEmail } = await import('@/app/api/admin/email/test/route');
      
      // Mock template
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'template-1', type: 'welcome', is_active: true }],
        error: null
      });

      // Mock multiple SMTP configs (primary and backup)
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { id: 'smtp-primary', provider: 'gmail', is_active: true, priority: 1 },
          { id: 'smtp-backup', provider: 'sendgrid', is_active: true, priority: 2 }
        ],
        error: null
      });

      // Mock primary SMTP failure, backup success
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Primary SMTP connection failed' }
        })
        .mockResolvedValueOnce({
          data: { success: true, messageId: 'backup-msg-123' },
          error: null
        });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'test-failover-1' },
        error: null
      });

      const testRequest = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify({
          templateId: 'template-1',
          recipientEmail: 'test@example.com',
          testParameters: {}
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const testResponse = await sendTestEmail(testRequest);
      const testResult = await testResponse.json();

      expect(testResponse.status).toBe(200);
      expect(testResult.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2); // Primary failed, backup succeeded
    });
  });

  describe('Bulk Email Operations Workflow', () => {
    it('should handle bulk newsletter sending with rate limiting', async () => {
      const { POST: sendBulkEmail } = await import('@/app/api/admin/email/templates/bulk/route');
      
      // Mock newsletter template
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          id: 'newsletter-template',
          type: 'newsletter',
          subject: 'Monthly Newsletter',
          html_content: '<h1>Newsletter for {{user_name}}</h1>',
          is_active: true
        }],
        error: null
      });

      // Mock subscriber list
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { user_id: 'user-1', email: 'user1@example.com', name: 'User One' },
          { user_id: 'user-2', email: 'user2@example.com', name: 'User Two' },
          { user_id: 'user-3', email: 'user3@example.com', name: 'User Three' }
        ],
        error: null
      });

      // Mock SMTP config
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'smtp-1', is_active: true }],
        error: null
      });

      // Mock successful bulk sending
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, messageId: 'bulk-msg-123' },
        error: null
      });

      mockSupabase.from().insert.mockResolvedValue({
        data: { id: 'bulk-log-1' },
        error: null
      });

      const bulkRequest = new NextRequest('http://localhost:3000/api/admin/email/templates/bulk', {
        method: 'POST',
        body: JSON.stringify({
          templateId: 'newsletter-template',
          recipientFilter: 'newsletter_subscribers',
          batchSize: 2,
          delayBetweenBatches: 1000
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const bulkResponse = await sendBulkEmail(bulkRequest);
      const bulkResult = await bulkResponse.json();

      expect(bulkResponse.status).toBe(200);
      expect(bulkResult.success).toBe(true);
      expect(bulkResult.totalRecipients).toBe(3);
      expect(bulkResult.batchCount).toBe(2); // 3 recipients with batch size 2
    });
  });

  describe('GDPR Compliance Workflow', () => {
    it('should handle user data export request', async () => {
      const { GET: exportUserData } = await import('@/app/api/admin/security/gdpr/route');
      
      // Mock user email data
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          {
            id: 'log-1',
            recipient_email: 'user@example.com',
            template_type: 'welcome',
            sent_at: new Date().toISOString(),
            status: 'delivered'
          }
        ],
        error: null
      });

      // Mock user preferences
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          user_id: 'user-1',
          email_preferences: { newsletter: true, reminders: false }
        }],
        error: null
      });

      const exportRequest = new NextRequest('http://localhost:3000/api/admin/security/gdpr?userId=user-1&action=export', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const exportResponse = await exportUserData(exportRequest);
      const exportResult = await exportResponse.json();

      expect(exportResponse.status).toBe(200);
      expect(exportResult.success).toBe(true);
      expect(exportResult.data).toHaveProperty('emailLogs');
      expect(exportResult.data).toHaveProperty('preferences');
      expect(exportResult.data.emailLogs).toHaveLength(1);
    });

    it('should handle user data deletion request', async () => {
      const { DELETE: deleteUserData } = await import('@/app/api/admin/security/gdpr/route');
      
      // Mock verification token validation
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{
          user_id: 'user-1',
          verification_token: 'valid-token',
          status: 'verified',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }],
        error: null
      });

      // Mock data deletion
      mockSupabase.from().delete.mockResolvedValue({
        data: [{ id: 'deleted-log-1' }],
        error: null
      });

      // Mock anonymization
      mockSupabase.from().update.mockResolvedValue({
        data: null,
        error: null
      });

      const deleteRequest = new NextRequest('http://localhost:3000/api/admin/security/gdpr', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user-1',
          verificationToken: 'valid-token'
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const deleteResponse = await deleteUserData(deleteRequest);
      const deleteResult = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.deletedRecords).toHaveProperty('email_logs');
    });
  });
});