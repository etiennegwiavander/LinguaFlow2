import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET as getTemplates, POST as createTemplate } from '../../app/api/admin/email/templates/route';
import { GET as getTemplate, PUT as updateTemplate, DELETE as deleteTemplate } from '../../app/api/admin/email/templates/[id]/route';
import { GET as getTemplateHistory } from '../../app/api/admin/email/templates/[id]/history/route';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: mockTemplate, error: null }),
      select: jest.fn().mockResolvedValue({ data: [mockTemplate], error: null }),
      update: jest.fn().mockResolvedValue({ data: mockTemplate, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
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

// Mock email template utils
jest.mock('../../lib/email-template-utils', () => ({
  validateTemplate: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  sanitizeHTML: jest.fn((html) => html),
  extractPlaceholders: jest.fn(() => ['{{user_name}}', '{{lesson_title}}']),
  renderPreview: jest.fn().mockResolvedValue('<p>Preview content</p>')
}));

const mockTemplate = {
  id: 'template-id',
  type: 'welcome',
  name: 'Welcome Email Template',
  subject: 'Welcome to our platform, {{user_name}}!',
  html_content: '<h1>Welcome {{user_name}}</h1><p>Thank you for joining us!</p>',
  text_content: 'Welcome {{user_name}}! Thank you for joining us!',
  placeholders: ['{{user_name}}'],
  is_active: true,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'admin-user-id'
};

const mockTemplateHistory = [
  {
    id: 'history-1',
    template_id: 'template-id',
    version: 1,
    subject: 'Welcome to our platform, {{user_name}}!',
    html_content: '<h1>Welcome {{user_name}}</h1>',
    text_content: 'Welcome {{user_name}}!',
    created_at: new Date().toISOString(),
    created_by: 'admin-user-id'
  }
];

describe('/api/admin/email/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/email/templates', () => {
    it('should retrieve all email templates', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates');

      const response = await getTemplates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockTemplate]);
    });

    it('should filter templates by type', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates?type=welcome');

      const response = await getTemplates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter active templates only', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates?active=true');

      const response = await getTemplates(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/admin/email/templates', () => {
    it('should create email template successfully', async () => {
      const requestBody = {
        type: 'welcome',
        name: 'New Welcome Template',
        subject: 'Welcome {{user_name}}!',
        html_content: '<h1>Welcome {{user_name}}</h1>',
        text_content: 'Welcome {{user_name}}!'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTemplate);
    });

    it('should validate template content', async () => {
      const { validateTemplate } = require('../../lib/email-template-utils');
      validateTemplate.mockReturnValueOnce({ 
        isValid: false, 
        errors: ['Invalid placeholder syntax'] 
      });

      const requestBody = {
        type: 'welcome',
        name: 'Invalid Template',
        subject: 'Welcome {user_name}!', // Invalid placeholder
        html_content: '<h1>Welcome {user_name}</h1>',
        text_content: 'Welcome {user_name}!'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createTemplate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid placeholder syntax');
    });

    it('should sanitize HTML content', async () => {
      const requestBody = {
        type: 'welcome',
        name: 'Template with Script',
        subject: 'Welcome!',
        html_content: '<h1>Welcome</h1><script>alert("xss")</script>',
        text_content: 'Welcome!'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await createTemplate(request);

      const { sanitizeHTML } = require('../../lib/email-template-utils');
      expect(sanitizeHTML).toHaveBeenCalledWith(requestBody.html_content);
    });

    it('should extract placeholders automatically', async () => {
      const requestBody = {
        type: 'welcome',
        name: 'Template with Placeholders',
        subject: 'Welcome {{user_name}}!',
        html_content: '<h1>Welcome {{user_name}}</h1><p>Your lesson: {{lesson_title}}</p>',
        text_content: 'Welcome {{user_name}}! Your lesson: {{lesson_title}}'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await createTemplate(request);

      const { extractPlaceholders } = require('../../lib/email-template-utils');
      expect(extractPlaceholders).toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/email/templates/:id', () => {
    it('should retrieve specific template', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id');

      const response = await getTemplate(request, { params: { id: 'template-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTemplate);
    });

    it('should handle non-existent template', async () => {
      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      mockSupabase.from().select.mockResolvedValueOnce({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/non-existent');

      const response = await getTemplate(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/admin/email/templates/:id', () => {
    it('should update template and create history entry', async () => {
      const requestBody = {
        subject: 'Updated Welcome {{user_name}}!',
        html_content: '<h1>Updated Welcome {{user_name}}</h1>'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await updateTemplate(request, { params: { id: 'template-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should increment version number', async () => {
      const requestBody = {
        subject: 'Updated subject'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await updateTemplate(request, { params: { id: 'template-id' } });

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({ version: expect.any(Number) })
      );
    });
  });

  describe('DELETE /api/admin/email/templates/:id', () => {
    it('should delete template', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id', {
        method: 'DELETE'
      });

      const response = await deleteTemplate(request, { params: { id: 'template-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should prevent deletion of active templates', async () => {
      // Mock template as active and in use
      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      mockSupabase.from().select.mockResolvedValueOnce({ 
        data: [{ ...mockTemplate, is_active: true }], 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id', {
        method: 'DELETE'
      });

      const response = await deleteTemplate(request, { params: { id: 'template-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('active');
    });
  });

  describe('GET /api/admin/email/templates/:id/history', () => {
    it('should retrieve template version history', async () => {
      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      mockSupabase.from().select.mockResolvedValueOnce({ 
        data: mockTemplateHistory, 
        error: null 
      });

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id/history');

      const response = await getTemplateHistory(request, { params: { id: 'template-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTemplateHistory);
    });

    it('should order history by version descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates/template-id/history');

      await getTemplateHistory(request, { params: { id: 'template-id' } });

      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      expect(mockSupabase.from().order).toHaveBeenCalledWith('version', { ascending: false });
    });
  });
});