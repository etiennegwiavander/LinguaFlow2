import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { POST as sendTestEmail } from '../../app/api/admin/email/test/route';
import { GET as getTestStatus } from '../../app/api/admin/email/test/[id]/status/route';
import { GET as getTestHistory } from '../../app/api/admin/email/test/history/route';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: mockTestEmail, error: null }),
      select: jest.fn().mockResolvedValue({ data: [mockTestEmail], error: null }),
      update: jest.fn().mockResolvedValue({ data: mockTestEmail, error: null }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })
    }
  }))
}));

// Mock email test service
jest.mock('../../lib/email-test-service', () => ({
  sendTestEmail: jest.fn().mockResolvedValue({
    success: true,
    testId: 'test-email-id',
    message: 'Test email sent successfully'
  }),
  getTestStatus: jest.fn().mockResolvedValue({
    id: 'test-email-id',
    status: 'delivered',
    sentAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString()
  }),
  generatePreview: jest.fn().mockResolvedValue('<p>Test email preview</p>')
}));

// Mock Supabase Edge Functions
jest.mock('../../lib/supabase', () => ({
  ...jest.requireActual('../../lib/supabase'),
  createClient: jest.fn(() => ({
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { success: true, messageId: 'msg-123' },
        error: null
      })
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: mockTestEmail, error: null }),
      select: jest.fn().mockResolvedValue({ data: [mockTestEmail], error: null }),
      update: jest.fn().mockResolvedValue({ data: mockTestEmail, error: null }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })
    }
  }))
}));

const mockTestEmail = {
  id: 'test-email-id',
  template_id: 'template-id',
  template_type: 'welcome',
  recipient_email: 'test@example.com',
  subject: 'Test Welcome Email',
  status: 'sent',
  sent_at: new Date().toISOString(),
  delivered_at: null,
  error_code: null,
  error_message: null,
  is_test: true,
  metadata: {
    test_parameters: {
      user_name: 'Test User',
      lesson_title: 'Test Lesson'
    }
  }
};

describe('/api/admin/email/test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/email/test', () => {
    it('should send test email successfully', async () => {
      const requestBody = {
        templateId: 'template-id',
        recipientEmail: 'test@example.com',
        testParameters: {
          user_name: 'Test User',
          lesson_title: 'Test Lesson'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendTestEmail(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.testId).toBe('test-email-id');
    });

    it('should validate required fields', async () => {
      const requestBody = {
        templateId: 'template-id',
        // Missing recipientEmail
        testParameters: {}
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendTestEmail(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('recipientEmail');
    });

    it('should validate email format', async () => {
      const requestBody = {
        templateId: 'template-id',
        recipientEmail: 'invalid-email',
        testParameters: {}
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendTestEmail(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('email');
    });

    it('should generate preview before sending', async () => {
      const requestBody = {
        templateId: 'template-id',
        recipientEmail: 'test@example.com',
        testParameters: {
          user_name: 'Test User'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await sendTestEmail(request);

      const { generatePreview } = require('../../lib/email-test-service');
      expect(generatePreview).toHaveBeenCalledWith('template-id', requestBody.testParameters);
    });

    it('should handle template not found', async () => {
      const { sendTestEmail: mockSendTestEmail } = require('../../lib/email-test-service');
      mockSendTestEmail.mockResolvedValueOnce({
        success: false,
        error: 'Template not found'
      });

      const requestBody = {
        templateId: 'non-existent-template',
        recipientEmail: 'test@example.com',
        testParameters: {}
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendTestEmail(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Template not found');
    });

    it('should handle SMTP configuration errors', async () => {
      const { sendTestEmail: mockSendTestEmail } = require('../../lib/email-test-service');
      mockSendTestEmail.mockResolvedValueOnce({
        success: false,
        error: 'SMTP configuration not found'
      });

      const requestBody = {
        templateId: 'template-id',
        recipientEmail: 'test@example.com',
        testParameters: {}
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await sendTestEmail(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('SMTP configuration');
    });
  });

  describe('GET /api/admin/email/test/:id/status', () => {
    it('should retrieve test email status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/test/test-email-id/status');

      const response = await getTestStatus(request, { params: { id: 'test-email-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('test-email-id');
      expect(data.data.status).toBe('delivered');
    });

    it('should handle non-existent test', async () => {
      const { getTestStatus: mockGetTestStatus } = require('../../lib/email-test-service');
      mockGetTestStatus.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/admin/email/test/non-existent/status');

      const response = await getTestStatus(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should include delivery timestamps', async () => {
      const mockStatus = {
        id: 'test-email-id',
        status: 'delivered',
        sentAt: '2023-01-01T10:00:00Z',
        deliveredAt: '2023-01-01T10:01:00Z'
      };

      const { getTestStatus: mockGetTestStatus } = require('../../lib/email-test-service');
      mockGetTestStatus.mockResolvedValueOnce(mockStatus);

      const request = new NextRequest('http://localhost:3000/api/admin/email/test/test-email-id/status');

      const response = await getTestStatus(request, { params: { id: 'test-email-id' } });
      const data = await response.json();

      expect(data.data.sentAt).toBe('2023-01-01T10:00:00Z');
      expect(data.data.deliveredAt).toBe('2023-01-01T10:01:00Z');
    });

    it('should include error details for failed tests', async () => {
      const mockStatus = {
        id: 'test-email-id',
        status: 'failed',
        sentAt: '2023-01-01T10:00:00Z',
        errorCode: 'SMTP_AUTH_FAILED',
        errorMessage: 'Authentication failed'
      };

      const { getTestStatus: mockGetTestStatus } = require('../../lib/email-test-service');
      mockGetTestStatus.mockResolvedValueOnce(mockStatus);

      const request = new NextRequest('http://localhost:3000/api/admin/email/test/test-email-id/status');

      const response = await getTestStatus(request, { params: { id: 'test-email-id' } });
      const data = await response.json();

      expect(data.data.status).toBe('failed');
      expect(data.data.errorCode).toBe('SMTP_AUTH_FAILED');
      expect(data.data.errorMessage).toBe('Authentication failed');
    });
  });

  describe('GET /api/admin/email/test/history', () => {
    it('should retrieve test email history', async () => {
      const mockHistory = [
        mockTestEmail,
        {
          ...mockTestEmail,
          id: 'test-email-id-2',
          status: 'failed',
          error_message: 'Connection timeout'
        }
      ];

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      mockSupabase.from().select.mockResolvedValueOnce({ 
        data: mockHistory, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/admin/email/test/history');

      const response = await getTestHistory(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/test/history?from=2023-01-01&to=2023-01-31');

      await getTestHistory(request);

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      expect(mockSupabase.from().select).toHaveBeenCalled();
    });

    it('should filter by template type', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/test/history?templateType=welcome');

      await getTestHistory(request);

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('template_type', 'welcome');
    });

    it('should filter by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/test/history?status=failed');

      await getTestHistory(request);

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('status', 'failed');
    });

    it('should order by sent date descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/test/history');

      await getTestHistory(request);

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      expect(mockSupabase.from().order).toHaveBeenCalledWith('sent_at', { ascending: false });
    });

    it('should limit results for pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/test/history?limit=10&offset=20');

      await getTestHistory(request);

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      // Verify pagination parameters are used
      expect(mockSupabase.from().select).toHaveBeenCalled();
    });
  });
});