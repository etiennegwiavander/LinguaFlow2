/**
 * Integration tests for SMTP Configuration API endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/email/smtp-config/route';
import { PUT, DELETE } from '@/app/api/admin/email/smtp-config/[id]/route';
import { POST as TEST_POST } from '@/app/api/admin/email/smtp-config/[id]/test/route';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'admin@test.com' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-config-id',
              provider: 'custom',
              host: 'smtp.test.com',
              port: 587,
              username: 'test@test.com',
              password_encrypted: 'encrypted-password',
              encryption: 'tls',
              is_active: true,
            },
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'new-config-id',
              provider: 'custom',
              host: 'smtp.test.com',
              port: 587,
              username: 'test@test.com',
              encryption: 'tls',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'test-config-id',
                provider: 'custom',
                host: 'smtp.updated.com',
                port: 465,
                username: 'test@test.com',
                encryption: 'ssl',
                is_active: true,
              },
              error: null,
            })),
          })),
        })),
        neq: jest.fn(() => ({ error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

// Mock encryption utilities
jest.mock('@/lib/email-encryption', () => ({
  encryptPassword: jest.fn((password) => `encrypted-${password}`),
  decryptPassword: jest.fn((encrypted) => encrypted.replace('encrypted-', '')),
}));

// Mock SMTP tester
jest.mock('@/lib/smtp-tester', () => ({
  testSMTPConnection: jest.fn(() => Promise.resolve({
    success: true,
    message: 'Connection successful',
    details: { connectionTime: 100 },
  })),
  sendTestEmail: jest.fn(() => Promise.resolve({
    success: true,
    message: 'Test email sent',
    details: { connectionTime: 200 },
  })),
  isValidEmail: jest.fn((email) => email.includes('@')),
}));

describe('SMTP Configuration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/email/smtp-config', () => {
    it('should return SMTP configurations', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('configs');
      expect(Array.isArray(data.configs)).toBe(true);
    });
  });

  describe('POST /api/admin/email/smtp-config', () => {
    it('should create a new SMTP configuration', async () => {
      const requestBody = {
        provider: 'custom',
        host: 'smtp.test.com',
        port: 587,
        username: 'test@test.com',
        password: 'test-password',
        encryption: 'tls',
        is_active: true,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('config');
      expect(data.config).toHaveProperty('id');
    });

    it('should reject invalid SMTP configuration', async () => {
      const requestBody = {
        provider: 'custom',
        host: '',
        port: 0,
        username: '',
        password: '',
        encryption: 'invalid',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/email/smtp-config/[id]', () => {
    it('should update an existing SMTP configuration', async () => {
      const requestBody = {
        provider: 'custom',
        host: 'smtp.updated.com',
        port: 465,
        username: 'test@test.com',
        password: '***HIDDEN***', // Indicates no password change
        encryption: 'ssl',
        is_active: true,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/test-id', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('config');
      expect(data.config.host).toBe('smtp.updated.com');
    });
  });

  describe('DELETE /api/admin/email/smtp-config/[id]', () => {
    it('should delete an inactive SMTP configuration', async () => {
      // Mock the config as inactive
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: { is_active: false },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/test-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
    });

    it('should reject deletion of active SMTP configuration', async () => {
      // Mock the config as active
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from().select().eq().single.mockReturnValueOnce({
        data: { is_active: true },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/test-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot delete active SMTP configuration');
    });
  });

  describe('POST /api/admin/email/smtp-config/[id]/test', () => {
    it('should test SMTP connection', async () => {
      const requestBody = {
        testType: 'connection',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/test-id/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await TEST_POST(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(data.testType).toBe('connection');
    });

    it('should send test email', async () => {
      const requestBody = {
        testType: 'email',
        testEmail: {
          to: 'test@example.com',
          subject: 'Test Email',
          text: 'This is a test email',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/test-id/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await TEST_POST(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data.testType).toBe('email');
    });

    it('should reject test email with invalid recipient', async () => {
      const requestBody = {
        testType: 'email',
        testEmail: {
          to: 'invalid-email',
          subject: 'Test Email',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/test-id/test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await TEST_POST(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Valid recipient email address is required');
    });
  });
});