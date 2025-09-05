/**
 * Tests for Email Testing API
 */

// Mock NextRequest and NextResponse
const mockNextResponse = {
  json: jest.fn((data: any, options?: { status?: number }) => ({
    json: () => Promise.resolve(data),
    status: options?.status || 200
  }))
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: mockNextResponse
}));

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn()
  },
  from: jest.fn(),
  functions: {
    invoke: jest.fn()
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock email encryption
jest.mock('@/lib/email-encryption', () => ({
  decryptPassword: jest.fn((encrypted) => 'decrypted-password')
}));

describe('Email Testing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/email/test', () => {
    it('should send test email successfully', async () => {
      // Import after mocks are set up
      const { POST } = await import('@/app/api/admin/email/test/route');
      
      // Mock admin user
      const mockUser = { id: 'user-1', email: 'admin@test.com' };
      const mockTemplate = {
        id: 'template-1',
        type: 'welcome',
        subject: 'Welcome {{user_name}}!',
        html_content: '<h1>Welcome {{user_name}}!</h1>',
        text_content: 'Welcome {{user_name}}!'
      };
      const mockSMTPConfig = {
        id: 'smtp-1',
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@gmail.com',
        password_encrypted: 'encrypted-password',
        encryption: 'tls',
        is_active: true
      };
      const mockTestLog = { id: 'test-1' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'email_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { setting_value: JSON.stringify(['admin@test.com']) },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'email_templates') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockTemplate, error: null })
              })
            })
          };
        }
        if (table === 'email_smtp_configs') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockSMTPConfig, error: null })
              })
            })
          };
        }
        if (table === 'email_logs') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockTestLog, error: null })
              })
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: null })
            })
          };
        }
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });

      const request = {
        headers: {
          get: jest.fn((name) => {
            if (name === 'authorization') return 'Bearer test-token';
            if (name === 'content-type') return 'application/json';
            return null;
          })
        },
        json: jest.fn().mockResolvedValue({
          templateId: 'template-1',
          recipientEmail: 'test@example.com',
          testParameters: { user_name: 'John Doe' }
        })
      } as any;

      const response = await POST(request);
      
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 'test-1',
          status: 'sent',
          message: 'Test email sent successfully'
        }),
        { status: 200 }
      );
    });

    it('should fail with invalid email format', async () => {
      const { POST } = await import('@/app/api/admin/email/test/route');
      
      const mockUser = { id: 'user-1', email: 'admin@test.com' };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'email_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { setting_value: JSON.stringify(['admin@test.com']) },
                  error: null
                })
              })
            })
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn((name) => {
            if (name === 'authorization') return 'Bearer test-token';
            return null;
          })
        },
        json: jest.fn().mockResolvedValue({
          templateId: 'template-1',
          recipientEmail: 'invalid-email',
          testParameters: { user_name: 'John Doe' }
        })
      } as any;

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          message: 'Invalid email format'
        }),
        { status: 400 }
      );
    });

    it('should fail when template not found', async () => {
      const { POST } = await import('@/app/api/admin/email/test/route');
      
      const mockUser = { id: 'user-1', email: 'admin@test.com' };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'email_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { setting_value: JSON.stringify(['admin@test.com']) },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'email_templates') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { message: 'Not found' } })
              })
            })
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn((name) => {
            if (name === 'authorization') return 'Bearer test-token';
            return null;
          })
        },
        json: jest.fn().mockResolvedValue({
          templateId: 'nonexistent-template',
          recipientEmail: 'test@example.com',
          testParameters: { user_name: 'John Doe' }
        })
      } as any;

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          message: 'Template not found'
        }),
        { status: 404 }
      );
    });
  });

  describe('GET /api/admin/email/test/[id]/status', () => {
    it('should return test status successfully', async () => {
      const { GET } = await import('@/app/api/admin/email/test/[id]/status/route');
      
      const mockUser = { id: 'user-1', email: 'admin@test.com' };
      const mockTestLog = {
        id: 'test-1',
        status: 'sent',
        recipient_email: 'test@example.com',
        subject: 'Welcome John Doe!',
        sent_at: '2023-01-01T00:00:00Z',
        delivered_at: '2023-01-01T00:01:00Z',
        error_message: null,
        error_code: null,
        metadata: { retry_attempt: 0 }
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'email_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { setting_value: JSON.stringify(['admin@test.com']) },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'email_logs') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockTestLog, error: null })
                })
              })
            })
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn((name) => {
            if (name === 'authorization') return 'Bearer test-token';
            return null;
          })
        }
      } as any;

      await GET(request, { params: { id: 'test-1' } });

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 'test-1',
          status: 'sent',
          recipientEmail: 'test@example.com',
          retryAttempts: 0
        })
      );
    });
  });

  describe('PUT /api/admin/email/test/[id]/status', () => {
    it('should update test status successfully', async () => {
      const { PUT } = await import('@/app/api/admin/email/test/[id]/status/route');
      
      const mockUser = { id: 'user-1', email: 'admin@test.com' };
      const mockExistingTest = {
        id: 'test-1',
        metadata: { created_at: '2023-01-01T00:00:00Z' }
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'email_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { setting_value: JSON.stringify(['admin@test.com']) },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'email_logs') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockExistingTest, error: null })
                })
              })
            }),
            update: () => ({
              eq: () => Promise.resolve({ error: null })
            })
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn((name) => {
            if (name === 'authorization') return 'Bearer test-token';
            return null;
          })
        },
        json: jest.fn().mockResolvedValue({
          status: 'delivered',
          deliveredAt: '2023-01-01T00:01:00Z'
        })
      } as any;

      await PUT(request, { params: { id: 'test-1' } });

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Test status updated successfully'
        })
      );
    });
  });
});