// Comprehensive mocks for email system testing
import { jest } from '@jest/globals';
import { createMockSupabaseClient, createMockNodemailerTransporter } from '../utils/test-utils';

// Mock Supabase
export const mockSupabaseClient = createMockSupabaseClient();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Nodemailer
export const mockTransporter = createMockNodemailerTransporter();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// Mock admin auth middleware
export const mockAdminAuth = {
  verifyAdminAccess: jest.fn().mockResolvedValue({
    isValid: true,
    user: { id: 'admin-user-id', email: 'admin@example.com', role: 'admin' },
  }),
};

jest.mock('@/lib/admin-auth-middleware', () => mockAdminAuth);

// Mock audit logging service
export const mockAuditLogger = {
  logEvent: jest.fn().mockResolvedValue({ success: true }),
  logEmailAction: jest.fn().mockResolvedValue({ success: true }),
  logSecurityEvent: jest.fn().mockResolvedValue({ success: true }),
};

jest.mock('@/lib/audit-logging-service', () => ({
  auditLogger: mockAuditLogger,
}));

// Mock email encryption
export const mockEmailEncryption = {
  encrypt: jest.fn().mockImplementation((text: string) => `encrypted_${text}`),
  decrypt: jest.fn().mockImplementation((text: string) => text.replace('encrypted_', '')),
  generateSalt: jest.fn().mockReturnValue('test-salt'),
  hashPassword: jest.fn().mockImplementation((password: string) => `hashed_${password}`),
};

jest.mock('@/lib/email-encryption', () => mockEmailEncryption);

// Mock SMTP validation
export const mockSMTPValidation = {
  validateSMTPConfig: jest.fn().mockResolvedValue({
    isValid: true,
    errors: [],
    warnings: [],
  }),
  testSMTPConnection: jest.fn().mockResolvedValue({
    success: true,
    message: 'Connection successful',
    responseTime: 150,
  }),
  getProviderDefaults: jest.fn().mockImplementation((provider: string) => {
    const defaults = {
      gmail: { host: 'smtp.gmail.com', port: 587, encryption: 'tls' },
      sendgrid: { host: 'smtp.sendgrid.net', port: 587, encryption: 'tls' },
      'aws-ses': { host: 'email-smtp.us-east-1.amazonaws.com', port: 587, encryption: 'tls' },
      custom: { port: 587, encryption: 'tls' },
    };
    return defaults[provider as keyof typeof defaults] || {};
  }),
};

jest.mock('@/lib/smtp-validation', () => mockSMTPValidation);

// Mock email template utils
export const mockEmailTemplateUtils = {
  validateTemplate: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    warnings: [],
  }),
  renderTemplate: jest.fn().mockImplementation((template: string, data: any) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
  }),
  extractPlaceholders: jest.fn().mockImplementation((template: string) => {
    const matches = template.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  }),
  sanitizeHTML: jest.fn().mockImplementation((html: string) => html),
};

jest.mock('@/lib/email-template-utils', () => mockEmailTemplateUtils);

// Mock Next.js API route handlers
export const mockNextRequest = (method: string, body?: any, headers?: Record<string, string>) => ({
  method,
  json: jest.fn().mockResolvedValue(body || {}),
  headers: new Map(Object.entries(headers || {})),
  url: 'http://localhost:3000/api/test',
  nextUrl: { searchParams: new URLSearchParams() },
});

export const mockNextResponse = () => {
  const response = {
    json: jest.fn().mockImplementation((data) => ({
      ...response,
      body: JSON.stringify(data),
      status: response.status || 200,
    })),
    status: 200,
  };
  return response;
};

// Mock React hooks
export const mockUseRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/admin-portal/email',
  query: {},
  asPath: '/admin-portal/email',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter,
  usePathname: () => mockUseRouter.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Mock React state hooks for components
export const mockReactHooks = {
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn(),
  useMemo: jest.fn(),
  useRef: jest.fn(() => ({ current: null })),
};

// Email service mocks with realistic behavior
export const mockEmailServices = {
  EmailTestService: jest.fn().mockImplementation(() => ({
    sendTestEmail: jest.fn().mockResolvedValue({
      success: true,
      testId: 'test-email-id',
      status: 'sent',
      messageId: 'test-message-id',
    }),
    getTestStatus: jest.fn().mockResolvedValue({
      testId: 'test-email-id',
      status: 'sent',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    }),
    getTestHistory: jest.fn().mockResolvedValue({
      tests: [],
      totalCount: 0,
      page: 1,
      limit: 20,
    }),
    generatePreview: jest.fn().mockResolvedValue({
      html: '<h1>Preview</h1>',
      text: 'Preview',
      subject: 'Test Subject',
    }),
    validateTestParameters: jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    }),
  })),
  
  EmailIntegrationService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    sendLessonReminder: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
  })),
  
  EmailAnalyticsService: jest.fn().mockImplementation(() => ({
    getDeliveryMetrics: jest.fn().mockResolvedValue({
      total_sent: 100,
      successful: 95,
      failed: 5,
      success_rate: 0.95,
      bounce_rate: 0.02,
      complaint_rate: 0.01,
    }),
    getEmailLogs: jest.fn().mockResolvedValue({
      logs: [],
      totalCount: 0,
      page: 1,
      limit: 20,
    }),
    exportLogs: jest.fn().mockResolvedValue({
      downloadUrl: 'https://example.com/export.csv',
      expiresAt: new Date().toISOString(),
    }),
    checkAlertConditions: jest.fn().mockResolvedValue([]),
  })),
};

// Reset all mocks function
export const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset Supabase mocks
  Object.values(mockSupabaseClient).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach(nestedMock => {
        if (typeof nestedMock === 'function') nestedMock.mockClear();
      });
    }
  });
  
  // Reset Nodemailer mocks
  Object.values(mockTransporter).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  
  // Reset other service mocks
  Object.values(mockAdminAuth).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  
  Object.values(mockAuditLogger).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  
  // Reset fetch mock
  if (global.fetch && typeof global.fetch === 'function') {
    (global.fetch as jest.Mock).mockClear();
  }
};

// Export all mocks for easy access
export {
  mockSupabaseClient,
  mockTransporter,
  mockAdminAuth,
  mockAuditLogger,
  mockEmailEncryption,
  mockSMTPValidation,
  mockEmailTemplateUtils,
  mockUseRouter,
  mockReactHooks,
  mockEmailServices,
};