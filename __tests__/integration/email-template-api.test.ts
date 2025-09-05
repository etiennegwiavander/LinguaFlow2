// Mock Next.js environment
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    constructor(public url: string, public init: any = {}) {}
    headers = new Map();
    json = async () => JSON.parse(this.init.body || '{}');
  }
});

Object.defineProperty(global, 'Response', {
  value: class MockResponse {
    constructor(public body: any, public init: any = {}) {}
    json = async () => this.body;
    status = this.init.status || 200;
  }
});

import { NextRequest } from 'next/server';
import { GET as getTemplates, POST as createTemplate } from '../../app/api/admin/email/templates/route';
import { GET as getTemplate, PUT as updateTemplate, DELETE as deleteTemplate } from '../../app/api/admin/email/templates/[id]/route';
import { GET as getHistory, POST as rollbackTemplate } from '../../app/api/admin/email/templates/[id]/history/route';
import { GET as getPreview, POST as createPreview } from '../../app/api/admin/email/templates/[id]/preview/route';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      limit: jest.fn().mockReturnThis()
    }))
  }))
}));

// Mock DOMPurify
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((html) => html) // Return input unchanged for tests
}));

const mockSupabase = require('@supabase/supabase-js').createClient();

describe('Email Template Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock admin user authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user-id', email: 'admin@example.com' } },
      error: null
    });
    
    // Mock admin check
    mockSupabase.from().single.mockResolvedValue({
      data: { setting_value: '["admin@example.com"]' },
      error: null
    });
  });

  describe('GET /api/admin/email/templates', () => {
    it('should return list of templates for admin user', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          type: 'welcome',
          name: 'Welcome Email',
          subject: 'Welcome to {{app_name}}!',
          html_content: '<h1>Welcome {{user_name}}!</h1>',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockSupabase.from().single.mockResolvedValueOnce({
        data: { setting_value: '["admin@example.com"]' },
        error: null
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTemplates, error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates', {
        headers: { authorization: 'Bearer valid-token' }
      });

      const response = await getTemplates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toEqual(mockTemplates);
    });

    it('should return 401 for non-admin user', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { setting_value: '["other@example.com"]' },
        error: null
      });

      const request = new NextRequest('http://localhost/api/admin/email/templates', {
        headers: { authorization: 'Bearer invalid-token' }
      });

      const response = await getTemplates(request);
      expect(response.status).toBe(401);
    });

    it('should filter templates by type', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          type: 'welcome',
          name: 'Welcome Email'
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTemplates, error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates?type=welcome', {
        headers: { authorization: 'Bearer valid-token' }
      });

      await getTemplates(request);
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'welcome');
    });
  });

  describe('POST /api/admin/email/templates', () => {
    it('should create new template with valid data', async () => {
      const newTemplate = {
        type: 'welcome',
        name: 'New Welcome Email',
        subject: 'Welcome {{user_name}}!',
        htmlContent: '<h1>Welcome {{user_name}}!</h1>',
        placeholders: ['user_name', 'app_name'],
        isActive: true
      };

      const createdTemplate = {
        id: 'new-template-id',
        ...newTemplate,
        html_content: newTemplate.htmlContent,
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdTemplate, error: null })
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.template).toEqual(createdTemplate);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidTemplate = {
        name: 'Incomplete Template'
        // Missing type, subject, htmlContent
      };

      const request = new NextRequest('http://localhost/api/admin/email/templates', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidTemplate)
      });

      const response = await createTemplate(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid template type', async () => {
      const invalidTemplate = {
        type: 'invalid_type',
        name: 'Test Template',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>'
      };

      const request = new NextRequest('http://localhost/api/admin/email/templates', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidTemplate)
      });

      const response = await createTemplate(request);
      expect(response.status).toBe(400);
    });

    it('should validate placeholders in content', async () => {
      const templateWithInvalidPlaceholders = {
        type: 'welcome',
        name: 'Test Template',
        subject: 'Welcome {{invalid_placeholder}}!',
        htmlContent: '<h1>Welcome {{user_name}}!</h1>',
        placeholders: ['user_name'] // missing invalid_placeholder
      };

      const request = new NextRequest('http://localhost/api/admin/email/templates', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(templateWithInvalidPlaceholders)
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Placeholder validation failed');
      expect(data.details).toContain('Unknown placeholder: {{invalid_placeholder}}');
    });
  });

  describe('PUT /api/admin/email/templates/[id]', () => {
    it('should update existing template', async () => {
      const existingTemplate = {
        id: 'template-1',
        type: 'welcome',
        name: 'Old Name',
        subject: 'Old Subject',
        html_content: '<p>Old content</p>',
        placeholders: ['user_name'],
        is_active: true
      };

      const updateData = {
        name: 'Updated Name',
        subject: 'Updated Subject {{user_name}}'
      };

      const updatedTemplate = {
        ...existingTemplate,
        ...updateData,
        version: 2
      };

      // Mock existing template fetch
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: existingTemplate, error: null })
        .mockResolvedValueOnce({ data: updatedTemplate, error: null });

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedTemplate, error: null })
      };
      mockSupabase.from.mockReturnValue(mockUpdateQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates/template-1', {
        method: 'PUT',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const response = await updateTemplate(request, { params: { id: 'template-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent template', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const request = new NextRequest('http://localhost/api/admin/email/templates/non-existent', {
        method: 'PUT',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: 'Updated Name' })
      });

      const response = await updateTemplate(request, { params: { id: 'non-existent' } });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/email/templates/[id]', () => {
    it('should delete template successfully', async () => {
      const existingTemplate = {
        id: 'template-1',
        type: 'welcome',
        is_active: false
      };

      // Mock template exists and is not the only active one
      mockSupabase.from().single.mockResolvedValue({
        data: existingTemplate,
        error: null
      });

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      mockSupabase.from.mockReturnValue(mockDeleteQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates/template-1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' }
      });

      const response = await deleteTemplate(request, { params: { id: 'template-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Template deleted successfully');
    });

    it('should prevent deletion of only active template', async () => {
      const existingTemplate = {
        id: 'template-1',
        type: 'welcome',
        is_active: true
      };

      // Mock template exists and is the only active one
      mockSupabase.from().single.mockResolvedValue({
        data: existingTemplate,
        error: null
      });

      const mockCountQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      };
      mockCountQuery.eq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 'template-1' }], // Only one active template
          error: null
        })
      });
      mockSupabase.from.mockReturnValue(mockCountQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates/template-1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' }
      });

      const response = await deleteTemplate(request, { params: { id: 'template-1' } });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/email/templates/[id]/history', () => {
    it('should return template history', async () => {
      const template = {
        id: 'template-1',
        name: 'Test Template',
        type: 'welcome'
      };

      const history = [
        {
          id: 'history-1',
          template_id: 'template-1',
          version: 2,
          subject: 'Version 2 Subject',
          html_content: '<p>Version 2 content</p>',
          created_at: '2023-01-02T00:00:00Z',
          created_by: 'user-1',
          created_by_user: { email: 'admin@example.com' }
        },
        {
          id: 'history-2',
          template_id: 'template-1',
          version: 1,
          subject: 'Version 1 Subject',
          html_content: '<p>Version 1 content</p>',
          created_at: '2023-01-01T00:00:00Z',
          created_by: 'user-1',
          created_by_user: { email: 'admin@example.com' }
        }
      ];

      mockSupabase.from().single.mockResolvedValue({
        data: template,
        error: null
      });

      const mockHistoryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: history, error: null })
      };
      mockSupabase.from.mockReturnValue(mockHistoryQuery);

      const request = new NextRequest('http://localhost/api/admin/email/templates/template-1/history', {
        headers: { authorization: 'Bearer valid-token' }
      });

      const response = await getHistory(request, { params: { id: 'template-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template).toEqual(template);
      expect(data.history).toHaveLength(2);
      expect(data.history[0].version).toBe(2);
    });
  });

  describe('POST /api/admin/email/templates/[id]/preview', () => {
    it('should generate template preview with sample data', async () => {
      const template = {
        id: 'template-1',
        type: 'welcome',
        name: 'Welcome Template',
        subject: 'Welcome {{user_name}} to {{app_name}}!',
        html_content: '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{app_name}}.</p>',
        text_content: 'Welcome {{user_name}}! Thank you for joining {{app_name}}.',
        placeholders: ['user_name', 'app_name']
      };

      mockSupabase.from().single.mockResolvedValue({
        data: template,
        error: null
      });

      const customData = {
        user_name: 'Jane Doe',
        app_name: 'TestApp'
      };

      const request = new NextRequest('http://localhost/api/admin/email/templates/template-1/preview', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ customData })
      });

      const response = await createPreview(request, { params: { id: 'template-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preview.subject).toBe('Welcome Jane Doe to TestApp!');
      expect(data.preview.htmlContent).toContain('Welcome Jane Doe!');
      expect(data.preview.htmlContent).toContain('Thank you for joining TestApp.');
      expect(data.unresolvedPlaceholders).toHaveLength(0);
    });

    it('should identify unresolved placeholders', async () => {
      const template = {
        id: 'template-1',
        type: 'welcome',
        subject: 'Welcome {{user_name}} to {{app_name}}! Your {{missing_placeholder}} is ready.',
        html_content: '<h1>Welcome {{user_name}}!</h1>',
        placeholders: ['user_name', 'app_name']
      };

      mockSupabase.from().single.mockResolvedValue({
        data: template,
        error: null
      });

      const request = new NextRequest('http://localhost/api/admin/email/templates/template-1/preview', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const response = await createPreview(request, { params: { id: 'template-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.unresolvedPlaceholders).toContain('missing_placeholder');
      expect(data.warnings).toHaveLength(1);
    });
  });
});