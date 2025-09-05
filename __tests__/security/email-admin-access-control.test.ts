import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
    delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnThis()
  }))
};

jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock admin auth middleware
jest.mock('../../lib/admin-auth-middleware', () => ({
  verifyAdminAccess: jest.fn(),
  checkEmailManagementPermission: jest.fn()
}));

describe('Email Management Admin Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Requirements', () => {
    it('should reject unauthenticated requests to SMTP config endpoints', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user found' }
      });

      const { POST } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify({ provider: 'gmail' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject unauthenticated requests to template endpoints', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user found' }
      });

      const { POST } = await import('../../app/api/admin/email/templates/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Template' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject unauthenticated requests to test email endpoints', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user found' }
      });

      const { POST } = await import('../../app/api/admin/email/test/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify({ templateId: 'test' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Admin Role Verification', () => {
    it('should reject non-admin users from SMTP configuration', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id', email: 'user@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: false,
        error: 'Insufficient permissions'
      });

      const { POST } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify({ provider: 'gmail' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient permissions');
    });

    it('should allow admin users to access email management', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      const { GET } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(verifyAdminAccess).toHaveBeenCalled();
    });
  });

  describe('Permission Granularity', () => {
    it('should check specific email management permissions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess, checkEmailManagementPermission } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });
      checkEmailManagementPermission.mockResolvedValue({
        hasPermission: true,
        permissions: ['smtp_config', 'template_management', 'email_testing']
      });

      const { POST } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify({ provider: 'gmail' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      await POST(request);

      expect(checkEmailManagementPermission).toHaveBeenCalledWith('admin-id', 'smtp_config');
    });

    it('should reject users without specific permissions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess, checkEmailManagementPermission } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });
      checkEmailManagementPermission.mockResolvedValue({
        hasPermission: false,
        error: 'Missing smtp_config permission'
      });

      const { POST } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify({ provider: 'gmail' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Missing smtp_config permission');
    });
  });

  describe('Session Security', () => {
    it('should validate session tokens', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const { GET } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid token');
    });

    it('should handle expired sessions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' }
      });

      const { GET } = await import('../../app/api/admin/email/templates/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        headers: { 'Authorization': 'Bearer expired-token' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Token expired');
    });

    it('should require fresh authentication for sensitive operations', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { 
          user: { 
            id: 'admin-id', 
            email: 'admin@example.com',
            last_sign_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
          } 
        },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        requiresFreshAuth: true,
        error: 'Recent authentication required for sensitive operations'
      });

      const { DELETE } = await import('../../app/api/admin/email/smtp-config/[id]/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config/smtp-id', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const response = await DELETE(request, { params: { id: 'smtp-id' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Recent authentication required');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      // Mock rate limiter
      const mockRateLimiter = {
        isRateLimited: jest.fn().mockReturnValue(true),
        getRemainingRequests: jest.fn().mockReturnValue(0),
        getResetTime: jest.fn().mockReturnValue(Date.now() + 60000)
      };

      jest.doMock('../../lib/rate-limiter', () => ({
        createRateLimiter: () => mockRateLimiter
      }));

      const { POST } = await import('../../app/api/admin/email/test/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/test', {
        method: 'POST',
        body: JSON.stringify({ templateId: 'test' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize SMTP configuration inputs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      const { POST } = await import('../../app/api/admin/email/smtp-config/route');
      
      const maliciousInput = {
        provider: 'gmail',
        host: 'smtp.gmail.com<script>alert("xss")</script>',
        port: 587,
        username: 'test@gmail.com',
        password: 'password123'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify(maliciousInput),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid host format');
    });

    it('should validate email template HTML for XSS', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      const { POST } = await import('../../app/api/admin/email/templates/route');
      
      const maliciousTemplate = {
        name: 'Test Template',
        type: 'welcome',
        subject: 'Welcome',
        html_content: '<h1>Welcome</h1><script>alert("xss")</script>',
        text_content: 'Welcome'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/email/templates', {
        method: 'POST',
        body: JSON.stringify(maliciousTemplate),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid HTML content');
    });

    it('should prevent SQL injection in template queries', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      const { GET } = await import('../../app/api/admin/email/templates/route');
      
      const request = new NextRequest("http://localhost:3000/api/admin/email/templates?type='; DROP TABLE email_templates; --", {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const response = await GET(request);

      // Should not crash and should sanitize the input
      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_templates');
    });
  });

  describe('Audit Logging', () => {
    it('should log all admin actions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      // Mock audit logger
      const mockAuditLogger = {
        logAction: jest.fn()
      };

      jest.doMock('../../lib/audit-logging-service', () => ({
        createAuditLogger: () => mockAuditLogger
      }));

      const { POST } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        method: 'POST',
        body: JSON.stringify({ provider: 'gmail' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        }
      });

      await POST(request);

      expect(mockAuditLogger.logAction).toHaveBeenCalledWith({
        userId: 'admin-id',
        action: 'CREATE_SMTP_CONFIG',
        resource: 'smtp_config',
        details: expect.any(Object),
        timestamp: expect.any(Date),
        ipAddress: expect.any(String)
      });
    });

    it('should log failed authentication attempts', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      });

      // Mock security logger
      const mockSecurityLogger = {
        logSecurityEvent: jest.fn()
      };

      jest.doMock('../../lib/audit-logging-service', () => ({
        createSecurityLogger: () => mockSecurityLogger
      }));

      const { GET } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      await GET(request);

      expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith({
        event: 'FAILED_AUTHENTICATION',
        details: 'Invalid credentials',
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Data Access Control', () => {
    it('should enforce row-level security on database queries', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      const { GET } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      await GET(request);

      // Verify that RLS policies are enforced through proper user context
      expect(mockSupabase.from).toHaveBeenCalledWith('email_smtp_configs');
    });

    it('should not expose sensitive data in responses', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@example.com' } },
        error: null
      });

      const { verifyAdminAccess } = require('../../lib/admin-auth-middleware');
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        user: { id: 'admin-id', email: 'admin@example.com' }
      });

      mockSupabase.from().select.mockResolvedValue({
        data: [{
          id: 'smtp-1',
          provider: 'gmail',
          host: 'smtp.gmail.com',
          username: 'test@gmail.com',
          password_encrypted: 'encrypted_password_data'
        }],
        error: null
      });

      const { GET } = await import('../../app/api/admin/email/smtp-config/route');
      
      const request = new NextRequest('http://localhost:3000/api/admin/email/smtp-config', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      const response = await GET(request);
      const data = await response.json();

      // Should not include encrypted password in response
      expect(data.data[0]).not.toHaveProperty('password_encrypted');
      expect(data.data[0]).not.toHaveProperty('password');
    });
  });
});