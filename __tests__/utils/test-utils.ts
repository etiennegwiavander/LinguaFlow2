// Test utilities for email system tests
import { jest } from '@jest/globals';

// Mock Supabase client factory
export const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => mockQuery),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  };
};

// Mock fetch responses
export const createMockFetchResponse = (data: any, status = 200, ok = true) => {
  return Promise.resolve({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as Response);
};

// Mock nodemailer transporter
export const createMockNodemailerTransporter = () => ({
  verify: jest.fn().mockResolvedValue(true),
  sendMail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    response: '250 OK',
    accepted: ['test@example.com'],
    rejected: [],
    pending: [],
  }),
  close: jest.fn().mockResolvedValue(undefined),
});

// Test data factories
export const createTestSMTPConfig = (overrides = {}) => ({
  id: 'test-smtp-id',
  name: 'Test SMTP Config',
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  username: 'test@gmail.com',
  password: 'test-password',
  encryption: 'tls' as const,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestEmailTemplate = (overrides = {}) => ({
  id: 'test-template-id',
  name: 'Test Template',
  type: 'welcome',
  subject: 'Welcome to {{app_name}}!',
  html_content: '<h1>Welcome {{user_name}}!</h1>',
  text_content: 'Welcome {{user_name}}!',
  placeholders: ['app_name', 'user_name'],
  is_active: true,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestEmailLog = (overrides = {}) => ({
  id: 'test-log-id',
  template_id: 'test-template-id',
  smtp_config_id: 'test-smtp-id',
  recipient_email: 'test@example.com',
  subject: 'Test Email',
  status: 'sent',
  sent_at: new Date().toISOString(),
  delivered_at: new Date().toISOString(),
  error_message: null,
  retry_count: 0,
  ...overrides,
});

// Mock environment setup
export const setupTestEnvironment = () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockReset();
  
  // Set default fetch response
  (global.fetch as jest.Mock).mockImplementation(() =>
    createMockFetchResponse({ success: true })
  );
};

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Error simulation helpers
export const simulateNetworkError = () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
};

export const simulateAPIError = (status: number, message: string) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(
    createMockFetchResponse({ error: message }, status, false)
  );
};

export const simulateDatabaseError = (mockSupabase: any, operation: string) => {
  const error = new Error(`Database ${operation} failed`);
  mockSupabase.from().select.mockRejectedValueOnce(error);
  mockSupabase.from().insert.mockRejectedValueOnce(error);
  mockSupabase.from().update.mockRejectedValueOnce(error);
  mockSupabase.from().delete.mockRejectedValueOnce(error);
};

// Test assertion helpers
export const expectToHaveBeenCalledWithPartial = (mockFn: jest.Mock, expectedPartial: any) => {
  const calls = mockFn.mock.calls;
  const matchingCall = calls.find(call => 
    Object.keys(expectedPartial).every(key => 
      call[0] && call[0][key] === expectedPartial[key]
    )
  );
  expect(matchingCall).toBeDefined();
};

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};

export const expectExecutionTimeUnder = async (fn: () => Promise<any>, maxMs: number) => {
  const duration = await measureExecutionTime(fn);
  expect(duration).toBeLessThan(maxMs);
};