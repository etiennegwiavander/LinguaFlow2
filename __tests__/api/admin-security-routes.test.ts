import { NextRequest } from 'next/server';
import { GET as getRetention, POST as postRetention, PUT as putRetention } from '@/app/api/admin/security/retention/route';
import { GET as getPermissions, POST as postPermissions, PUT as putPermissions, DELETE as deletePermissions } from '@/app/api/admin/security/permissions/route';
import { GET as getGDPR, POST as postGDPR } from '@/app/api/admin/security/gdpr/route';
import { GET as getAuditLogs, POST as postAuditLogs } from '@/app/api/admin/security/audit-logs/route';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock admin auth middleware
jest.mock('@/lib/admin-auth-middleware', () => ({
  verifyAdminAccess: jest.fn().mockResolvedValue({
    isValid: true,
    user: { id: 'admin-user-id', email: 'admin@example.com' },
  }),
}));

describe('Admin Security API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Retention Routes', () => {
    describe('GET /api/admin/security/retention', () => {
      it('should return retention policies and compliance report', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/retention');
        
        const response = await getRetention(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('policies');
        expect(data).toHaveProperty('complianceReport');
      });

      it('should handle unauthorized access', async () => {
        const { verifyAdminAccess } = require('@/lib/admin-auth-middleware');
        verifyAdminAccess.mockResolvedValueOnce({
          isValid: false,
          error: 'Unauthorized',
        });

        const request = new NextRequest('http://localhost:3000/api/admin/security/retention');
        
        const response = await getRetention(request);

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/admin/security/retention', () => {
      it('should create new retention policy', async () => {
        const requestBody = {
          name: 'Email Logs Retention',
          description: 'Retain email logs for 2 years',
          dataType: 'email_logs',
          retentionPeriodDays: 730,
          isActive: true,
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/retention', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postRetention(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('policy');
        expect(data.policy.name).toBe(requestBody.name);
      });

      it('should validate required fields', async () => {
        const requestBody = {
          name: '',
          dataType: 'email_logs',
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/retention', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postRetention(request);

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/admin/security/retention/execute', () => {
      it('should execute retention policies', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/retention/execute', {
          method: 'PUT',
        });

        const response = await putRetention(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('executionReport');
      });
    });
  });

  describe('Permissions Routes', () => {
    describe('GET /api/admin/security/permissions', () => {
      it('should return admin users and permissions', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/permissions');
        
        const response = await getPermissions(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('adminUsers');
        expect(data).toHaveProperty('permissions');
      });
    });

    describe('POST /api/admin/security/permissions', () => {
      it('should add new admin user', async () => {
        const requestBody = {
          email: 'newadmin@example.com',
          permissions: ['email_management', 'user_management'],
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/permissions', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postPermissions(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('adminUser');
      });

      it('should validate email format', async () => {
        const requestBody = {
          email: 'invalid-email',
          permissions: ['email_management'],
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/permissions', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postPermissions(request);

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/admin/security/permissions', () => {
      it('should update admin user permissions', async () => {
        const requestBody = {
          userId: 'admin-user-id',
          permissions: ['email_management', 'analytics_access'],
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/permissions', {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        });

        const response = await putPermissions(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('adminUser');
      });
    });

    describe('DELETE /api/admin/security/permissions', () => {
      it('should remove admin user', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/permissions?userId=admin-user-id', {
          method: 'DELETE',
        });

        const response = await deletePermissions(request);

        expect(response.status).toBe(200);
      });

      it('should prevent removing last admin', async () => {
        // Mock scenario where this is the last admin
        const { createClient } = require('@supabase/supabase-js');
        const mockSupabase = createClient();
        mockSupabase.from().select().mockResolvedValueOnce({
          data: [{ id: 'admin-user-id' }], // Only one admin
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/admin/security/permissions?userId=admin-user-id', {
          method: 'DELETE',
        });

        const response = await deletePermissions(request);

        expect(response.status).toBe(400);
      });
    });
  });

  describe('GDPR Routes', () => {
    describe('GET /api/admin/security/gdpr', () => {
      it('should return GDPR compliance report', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/gdpr');
        
        const response = await getGDPR(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('complianceReport');
        expect(data).toHaveProperty('dataProcessingActivities');
      });
    });

    describe('POST /api/admin/security/gdpr/validate-template', () => {
      it('should validate template for GDPR compliance', async () => {
        const requestBody = {
          templateId: 'template-123',
          content: 'Hello {{user.name}}, welcome to our service!',
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/gdpr/validate-template', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postGDPR(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('isCompliant');
        expect(data).toHaveProperty('issues');
      });

      it('should detect GDPR compliance issues', async () => {
        const requestBody = {
          templateId: 'template-123',
          content: 'Hello {{user.name}}, we collected your data from {{user.location}} and {{user.browsing_history}}',
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/gdpr/validate-template', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postGDPR(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.isCompliant).toBe(false);
        expect(data.issues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Audit Logs Routes', () => {
    describe('GET /api/admin/security/audit-logs', () => {
      it('should return audit logs with filtering', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/audit-logs?action=email_sent&startDate=2024-01-01');
        
        const response = await getAuditLogs(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('logs');
        expect(data).toHaveProperty('pagination');
      });

      it('should handle date range filtering', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/security/audit-logs?startDate=2024-01-01&endDate=2024-12-31');
        
        const response = await getAuditLogs(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.logs).toBeDefined();
      });
    });

    describe('POST /api/admin/security/audit-logs/export', () => {
      it('should export audit logs', async () => {
        const requestBody = {
          format: 'csv',
          filters: {
            action: 'email_sent',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          },
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/audit-logs/export', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postAuditLogs(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/csv');
      });

      it('should support JSON export format', async () => {
        const requestBody = {
          format: 'json',
          filters: {
            action: 'template_updated',
          },
        };

        const request = new NextRequest('http://localhost:3000/api/admin/security/audit-logs/export', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        const response = await postAuditLogs(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/json');
      });
    });
  });
});