import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { POST as createSMTPConfig } from '../../app/api/admin/email/smtp-config/route';
import { GET as getSMTPConfigs } from '../../app/api/admin/email/smtp-config/route';
import { PUT as updateSMTPConfig } from '../../app/api/admin/email/smtp-config/[id]/route';
import { DELETE as deleteSMTPConfig } from '../../app/api/admin/email/smtp-config/[id]/route';
import { POST as testSMTPConfig } from '../../app/api/admin/email/smtp-config/[id]/test/route';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: mockSMTPConfig, error: null }),
      select: jest.fn().mockResolvedValue({ data: [mockSMTPConfig], error: null }),
      update: jest.fn().mockResolvedValue({ data: mockSMTPConfig, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
      eq: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null
      })
    }
  }))
}));

// Mock email encryption
jest.mock('../../lib/email-encryption', () => ({
  encryptPassword: jest.fn((password) => `encrypted_${password}`),
  decryptPassword: jest.fn((encrypted) => encrypted.replace('encrypted_', ''))
}));

// Mock SMTP validation
jest.mock('../../lib/smtp-validation', () => ({
  validateSMTPConfig: jest.fn().mockResolvedValue({ isValid: true }),
  testSMTPConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connection successful' })
}));

const mockSMTPConfig = {
  id: 'smtp-config-id',
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  username: 'test@gmail.com',
  password_encrypted: 'encrypted_password123',
  encryption: 'tls',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('/api/admin/email/smtp-config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/email/smtp-config', () => {
    it('should create SMTP configuration successfully', async () => {
      const requestBody = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createSMTPConfig(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSMTPConfig);
    });

    it('should validate required fields', async () => {
      const requestBody = {
        provider: 'gmail',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createSMTPConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should encrypt password before storage', async () => {
      const requestBody = {
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123',
        encryption: 'tls'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await createSMTPConfig(request);

      const { encryptPassword } = require('../../lib/email-encryption');
      expect(encryptPassword).toHaveBeenCalledWith('password123');
    });
  });

  describe('GET /api/admin/email/smtp-config', () => {
    it('should retrieve SMTP configurations', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config');

      const response = await getSMTPConfigs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockSMTPConfig]);
    });

    it('should not expose encrypted passwords', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config');

      const response = await getSMTPConfigs(request);
      const data = await response.json();

      expect(data.data[0]).not.toHaveProperty('password_encrypted');
      expect(data.data[0]).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/admin/email/smtp-config/:id', () => {
    it('should update SMTP configuration', async () => {
      const requestBody = {
        host: 'smtp.updated.com',
        port: 465,
        encryption: 'ssl'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await updateSMTPConfig(request, { params: { id: 'smtp-config-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should re-encrypt password if provided', async () => {
      const requestBody = {
        password: 'newpassword123'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await updateSMTPConfig(request, { params: { id: 'smtp-config-id' } });

      const { encryptPassword } = require('../../lib/email-encryption');
      expect(encryptPassword).toHaveBeenCalledWith('newpassword123');
    });
  });

  describe('DELETE /api/admin/email/smtp-config/:id', () => {
    it('should delete SMTP configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id', {
        method: 'DELETE'
      });

      const response = await deleteSMTPConfig(request, { params: { id: 'smtp-config-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle non-existent configuration', async () => {
      const { createClient } = require('../../lib/supabase');
      const mockSupabase = createClient();
      mockSupabase.from().delete.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/non-existent', {
        method: 'DELETE'
      });

      const response = await deleteSMTPConfig(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/admin/email/smtp-config/:id/test', () => {
    it('should test SMTP connection successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id/test', {
        method: 'POST'
      });

      const response = await testSMTPConfig(request, { params: { id: 'smtp-config-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.testResult.success).toBe(true);
    });

    it('should handle connection failures', async () => {
      const { testSMTPConnection } = require('../../lib/smtp-validation');
      testSMTPConnection.mockResolvedValueOnce({ 
        success: false, 
        message: 'Authentication failed' 
      });

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-config-id/test', {
        method: 'POST'
      });

      const response = await testSMTPConfig(request, { params: { id: 'smtp-config-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.testResult.success).toBe(false);
      expect(data.testResult.message).toBe('Authentication failed');
    });
  });
});