import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
    delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
  },
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'admin-user-id', email: 'admin@example.com' } },
      error: null
    })
  }
};

jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock services
jest.mock('../../lib/email-encryption', () => ({
  encryptPassword: jest.fn((password) => `encrypted_${password}`),
  decryptPassword: jest.fn((encrypted) => encrypted.replace('encrypted_', ''))
}));

jest.mock('../../lib/smtp-validation', () => ({
  validateSMTPConfig: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
  testSMTPConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connection successful' })
}));

jest.mock('../../lib/email-template-utils', () => ({
  validateTemplate: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  sanitizeHTML: jest.fn((html) => html),
  extractPlaceholders: jest.fn(() => ['{{user_name}}', '{{lesson_title}}']),
  renderPreview: jest.fn().mockResolvedValue('<p>Preview content</p>')
}));

jest.mock('../../lib/email-test-service', () => ({
  sendTestEmail: jest.fn().mockResolvedValue({
    success: true,
    testId: 'test-email-id',
    message: 'Test email sent successfully'
  })
}));

describe('Email Management Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete SMTP Configuration Workflow', () => {
    it('should complete full SMTP configuration lifecycle', async () => {
      // Import API handlers
      const { POST: createSMTPConfig } = await import('../../app/api/admin/email/smtp-config/route');
      const { GET: getSMTPConfigs } = await import('../../app/api/admin/email/smtp-config/route');
      const { POST: testSMTPConfig } = await import('../../app/api/admin/email/smtp-config/[id]/test/route');
      const { PUT: updateSMTPConfig } = await import('../../app/api/admin/email/smtp-config/[id]/route');
      const { DELETE: deleteSMTPConfig } = await import('../../app/api/admin/email/smtp-config/[id]/route');

      const smtpConfigData = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      // Step 1: Create SMTP configuration
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'smtp-config-id', ...smtpConfigData, password_encrypted: 'encrypted_password123' },
        error: null
      });

      const createRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(smtpConfigData),
        headers: { 'Content-Type': 'application/json' }
      });

      const createResponse = await createSMTPConfig(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createData.success).toBe(true);

      // Step 2: Test SMTP configuration
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'smtp-config-id', ...smtpConfigData, password_encrypted: 'encrypted_password123' }],
        error: null
      });

      const testRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id/test', {
        method: 'POST'
      });

      const testResponse = await testSMTPConfig(testRequest, { params: { id: 'smtp-config-id' } });
      const testData = await testResponse.json();

      expect(testResponse.status).toBe(200);
      expect(testData.success).toBe(true);
      expect(testData.testResult.success).toBe(true);

      // Step 3: Retrieve configurations
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'smtp-config-id', ...smtpConfigData, password_encrypted: 'encrypted_password123' }],
        error: null
      });

      const getRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config');
      const getResponse = await getSMTPConfigs(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data).toHaveLength(1);

      // Step 4: Update configuration
      const updateData = { port: 465, encryption: 'ssl' };
      mockSupabase.from().update.mockResolvedValueOnce({
        data: { id: 'smtp-config-id', ...smtpConfigData, ...updateData },
        error: null
      });

      const updateRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const updateResponse = await updateSMTPConfig(updateRequest, { params: { id: 'smtp-config-id' } });
      const updateResponseData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResponseData.success).toBe(true);

      // Step 5: Delete configuration
      mockSupabase.from().delete.mockResolvedValueOnce({ data: null, error: null });

      const deleteRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id', {
        method: 'DELETE'
      });

      const deleteResponse = await deleteSMTPConfig(deleteRequest, { params: { id: 'smtp-config-id' } });
      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
    });
  });

  describe('Complete Email Template Workflow', () => {
    it('should complete full email template lifecycle', async () => {
      // Import API handlers
      const { POST: createTemplate } = await import('../../app/api/admin/email/templates/route');
      const { GET: getTemplates } = await import('../../app/api/admin/email/templates/route');
      const { PUT: updateTemplate } = await import('../../app/api/admin/email/templates/[id]/route');
      const { GET: getTemplateHistory } = await import('../../app/api/admin/email/templates/[id]/history/route');

      const templateData = {
        type: 'welcome',
        name: 'Welcome Email Template',
        subject: 'Welcome {{user_name}}!',
        html_content: '<h1>Welcome {{user_name}}</h1><p>Thank you for joining us!</p>',
        text_content: 'Welcome {{user_name}}! Thank you for joining us!'
      };

      // Step 1: Create template
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'template-id', ...templateData, version: 1 },
        error: null
      });

      const createRequest = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const createResponse = await createTemplate(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createData.success).toBe(true);

      // Step 2: Retrieve templates
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'template-id', ...templateData, version: 1 }],
        error: null
      });

      const getRequest = new NextRequest('http://localhost:3000/api/admin/email/templates');
      const getResponse = await getTemplates(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data).toHaveLength(1);

      // Step 3: Update template (creates history entry)
      const updateData = {
        subject: 'Updated Welcome {{user_name}}!',
        html_content: '<h1>Updated Welcome {{user_name}}</h1>'
      };

      // Mock current template retrieval for history creation
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'template-id', ...templateData, version: 1 }],
        error: null
      });

      // Mock history entry creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'history-id' },
        error: null
      });

      // Mock template update
      mockSupabase.from().update.mockResolvedValueOnce({
        data: { id: 'template-id', ...templateData, ...updateData, version: 2 },
        error: null
      });

      const updateRequest = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const updateResponse = await updateTemplate(updateRequest, { params: { id: 'template-id' } });
      const updateResponseData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResponseData.success).toBe(true);

      // Step 4: Retrieve template history
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { id: 'history-1', template_id: 'template-id', version: 1, subject: templateData.subject },
          { id: 'history-2', template_id: 'template-id', version: 2, subject: updateData.subject }
        ],
        error: null
      });

      const historyRequest = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id/history');
      const historyResponse = await getTemplateHistory(historyRequest, { params: { id: 'template-id' } });
      const historyData = await historyResponse.json();

      expect(historyResponse.status).toBe(200);
      expect(historyData.success).toBe(true);
      expect(historyData.data).toHaveLength(2);
    });
  });

  describe('Complete Email Testing Workflow', () => {
    it('should complete full email testing lifecycle', async () => {
      // Import API handlers
      const { POST: sendTestEmail } = await import('../../app/api/admin/email/test/route');
      const { GET: getTestStatus } = await import('../../app/api/admin/email/test/[id]/status/route');
      const { GET: getTestHistory } = await import('../../app/api/admin/email/test/history/route');

      const testEmailData = {
        templateId: 'template-id',
        recipientEmail: 'test@example.com',
        testParameters: {
          user_name: 'Test User',
          lesson_title: 'Test Lesson'
        }
      };

      // Step 1: Send test email
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'test-email-id', ...testEmailData, status: 'sent' },
        error: null
      });

      const sendRequest = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(testEmailData),
        headers: { 'Content-Type': 'application/json' }
      });

      const sendResponse = await sendTestEmail(sendRequest);
      const sendData = await sendResponse.json();

      expect(sendResponse.status).toBe(200);
      expect(sendData.success).toBe(true);
      expect(sendData.testId).toBe('test-email-id');

      // Step 2: Check test status
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ 
          id: 'test-email-id', 
          status: 'delivered',
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString()
        }],
        error: null
      });

      const statusRequest = new NextRequest('http://localhost:3000/api/admin/email/test/test-email-id/status');
      const statusResponse = await getTestStatus(statusRequest, { params: { id: 'test-email-id' } });
      const statusData = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(statusData.success).toBe(true);
      expect(statusData.data.status).toBe('delivered');

      // Step 3: Retrieve test history
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [
          { 
            id: 'test-email-id',
            template_type: 'welcome',
            recipient_email: 'test@example.com',
            status: 'delivered',
            sent_at: new Date().toISOString()
          }
        ],
        error: null
      });

      const historyRequest = new NextRequest('http://localhost:3000/api/admin/email/test/history');
      const historyResponse = await getTestHistory(historyRequest);
      const historyData = await historyResponse.json();

      expect(historyResponse.status).toBe(200);
      expect(historyData.success).toBe(true);
      expect(historyData.data).toHaveLength(1);
    });
  });

  describe('End-to-End Email System Integration', () => {
    it('should integrate SMTP config, template, and testing', async () => {
      // Import all necessary handlers
      const { POST: createSMTPConfig } = await import('../../app/api/admin/email/smtp-config/route');
      const { POST: createTemplate } = await import('../../app/api/admin/email/templates/route');
      const { POST: sendTestEmail } = await import('../../app/api/admin/email/test/route');

      // Step 1: Create SMTP configuration
      const smtpConfigData = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'smtp-config-id', ...smtpConfigData },
        error: null
      });

      const smtpRequest = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(smtpConfigData),
        headers: { 'Content-Type': 'application/json' }
      });

      const smtpResponse = await createSMTPConfig(smtpRequest);
      expect(smtpResponse.status).toBe(201);

      // Step 2: Create email template
      const templateData = {
        type: 'welcome',
        name: 'Welcome Email Template',
        subject: 'Welcome {{user_name}}!',
        html_content: '<h1>Welcome {{user_name}}</h1>',
        text_content: 'Welcome {{user_name}}!'
      };

      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'template-id', ...templateData },
        error: null
      });

      const templateRequest = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const templateResponse = await createTemplate(templateRequest);
      expect(templateResponse.status).toBe(201);

      // Step 3: Test email with created template and SMTP config
      const testEmailData = {
        templateId: 'template-id',
        recipientEmail: 'test@example.com',
        testParameters: { user_name: 'Test User' }
      };

      // Mock template retrieval for test
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'template-id', ...templateData }],
        error: null
      });

      // Mock SMTP config retrieval for test
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [{ id: 'smtp-config-id', ...smtpConfigData, is_active: true }],
        error: null
      });

      // Mock test email creation
      mockSupabase.from().insert.mockResolvedValueOnce({
        data: { id: 'test-email-id', ...testEmailData },
        error: null
      });

      const testRequest = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(testEmailData),
        headers: { 'Content-Type': 'application/json' }
      });

      const testResponse = await sendTestEmail(testRequest);
      const testData = await testResponse.json();

      expect(testResponse.status).toBe(200);
      expect(testData.success).toBe(true);

      // Verify that all components worked together
      expect(mockSupabase.from().insert).toHaveBeenCalledTimes(3); // SMTP, Template, Test
      expect(mockSupabase.functions.invoke).toHaveBeenCalled(); // Email sending
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cascading failures gracefully', async () => {
      const { POST: sendTestEmail } = await import('../../app/api/admin/email/test/route');

      // Mock template not found
      mockSupabase.from().select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const testEmailData = {
        templateId: 'non-existent-template',
        recipientEmail: 'test@example.com',
        testParameters: {}
      };

      const testRequest = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(testEmailData),
        headers: { 'Content-Type': 'application/json' }
      });

      const testResponse = await sendTestEmail(testRequest);
      const testData = await testResponse.json();

      expect(testResponse.status).toBe(404);
      expect(testData.success).toBe(false);
      expect(testData.error).toContain('Template not found');
    });

    it('should handle SMTP configuration missing', async () => {
      const { POST: sendTestEmail } = await import('../../app/api/admin/email/test/route');

      // Mock template found but no SMTP config
      mockSupabase.from().select
        .mockResolvedValueOnce({
          data: [{ id: 'template-id', type: 'welcome' }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [], // No SMTP configs
          error: null
        });

      const testEmailData = {
        templateId: 'template-id',
        recipientEmail: 'test@example.com',
        testParameters: {}
      };

      const testRequest = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify(testEmailData),
        headers: { 'Content-Type': 'application/json' }
      });

      const testResponse = await sendTestEmail(testRequest);
      const testData = await testResponse.json();

      expect(testResponse.status).toBe(500);
      expect(testData.success).toBe(false);
      expect(testData.error).toContain('SMTP configuration');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent operations efficiently', async () => {
      const { GET: getTemplates } = await import('../../app/api/admin/email/templates/route');
      const { GET: getSMTPConfigs } = await import('../../app/api/admin/email/smtp-config/route');

      // Mock multiple concurrent requests
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        mockSupabase.from().select.mockResolvedValueOnce({
          data: [{ id: `template-${i}`, name: `Template ${i}` }],
          error: null
        });

        const request = new NextRequest('http://localhost:3000/api/admin/email/templates');
        promises.push(getTemplates(request));
      }

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
      });

      // Verify all database calls were made
      expect(mockSupabase.from).toHaveBeenCalledTimes(10);
    });
  });
});