/**
 * Mock SMTP Configuration Data Service
 * Provides realistic mock data for SMTP configuration management
 */

export interface SMTPConfig {
  id: string;
  provider: string;
  host: string;
  port: number;
  username: string;
  encryption: 'tls' | 'ssl' | 'none';
  is_active: boolean;
  last_tested: string | null;
  test_status: 'success' | 'failed' | 'pending' | 'never_tested';
  created_at: string;
  updated_at: string;
  test_results?: {
    response_time?: number;
    error_message?: string;
    last_error?: string;
    success_count: number;
    failure_count: number;
  };
  settings?: {
    timeout: number;
    max_connections: number;
    rate_limit?: number;
  };
}

/**
 * Common SMTP providers with their default configurations
 */
const SMTP_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    encryption: 'tls' as const,
    description: 'Google Gmail SMTP'
  },
  outlook: {
    name: 'Outlook',
    host: 'smtp-mail.outlook.com',
    port: 587,
    encryption: 'tls' as const,
    description: 'Microsoft Outlook SMTP'
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    encryption: 'tls' as const,
    description: 'SendGrid Email API'
  },
  mailgun: {
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    encryption: 'tls' as const,
    description: 'Mailgun Email Service'
  },
  ses: {
    name: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    encryption: 'tls' as const,
    description: 'Amazon Simple Email Service'
  },
  custom: {
    name: 'Custom SMTP',
    host: 'mail.example.com',
    port: 587,
    encryption: 'tls' as const,
    description: 'Custom SMTP Server'
  }
};

/**
 * Generate test results for SMTP configuration
 */
function generateTestResults(status: SMTPConfig['test_status']): SMTPConfig['test_results'] {
  const baseResults = {
    success_count: Math.floor(Math.random() * 50) + 10,
    failure_count: Math.floor(Math.random() * 5)
  };

  switch (status) {
    case 'success':
      return {
        ...baseResults,
        response_time: Math.floor(Math.random() * 500) + 100, // 100-600ms
      };
    
    case 'failed':
      const errors = [
        'Authentication failed',
        'Connection timeout',
        'Invalid host or port',
        'SSL/TLS handshake failed',
        'Rate limit exceeded',
        'Invalid credentials'
      ];
      return {
        ...baseResults,
        error_message: errors[Math.floor(Math.random() * errors.length)],
        last_error: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      };
    
    case 'pending':
      return {
        ...baseResults,
        response_time: undefined
      };
    
    default:
      return baseResults;
  }
}

/**
 * Generate SMTP settings
 */
function generateSMTPSettings(): SMTPConfig['settings'] {
  return {
    timeout: Math.floor(Math.random() * 20) + 10, // 10-30 seconds
    max_connections: Math.floor(Math.random() * 10) + 5, // 5-15 connections
    rate_limit: Math.floor(Math.random() * 100) + 50 // 50-150 emails per hour
  };
}

/**
 * Generate a single mock SMTP configuration
 */
function generateMockSMTPConfig(
  provider: keyof typeof SMTP_PROVIDERS,
  isActive: boolean = false,
  customConfig?: Partial<SMTPConfig>
): SMTPConfig {
  const providerConfig = SMTP_PROVIDERS[provider];
  const testStatus: SMTPConfig['test_status'] = 
    Math.random() > 0.8 ? 'failed' : 
    Math.random() > 0.1 ? 'success' : 'pending';
  
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const lastTested = testStatus !== 'never_tested' ? 
    new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null;
  
  return {
    id: `smtp-${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    provider: providerConfig.name,
    host: providerConfig.host,
    port: providerConfig.port,
    username: `user@${provider === 'custom' ? 'example.com' : provider + '.com'}`,
    encryption: providerConfig.encryption,
    is_active: isActive,
    last_tested: lastTested,
    test_status: testStatus,
    created_at: createdAt.toISOString(),
    updated_at: new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime())).toISOString(),
    test_results: generateTestResults(testStatus),
    settings: generateSMTPSettings(),
    ...customConfig
  };
}

/**
 * Generate complete set of mock SMTP configurations
 */
export function generateMockSMTPConfigs(): SMTPConfig[] {
  return [
    generateMockSMTPConfig('sendgrid', true), // Active primary
    generateMockSMTPConfig('gmail', false),   // Backup
    generateMockSMTPConfig('ses', false),     // Alternative
    generateMockSMTPConfig('custom', false)   // Custom setup
  ];
}

/**
 * Get mock SMTP configs with filters
 */
export function getMockSMTPConfigsWithFilters(filters: {
  provider?: string;
  active?: boolean;
  status?: string;
}): SMTPConfig[] {
  let configs = generateMockSMTPConfigs();
  
  if (filters.provider) {
    configs = configs.filter(c => c.provider.toLowerCase().includes(filters.provider!.toLowerCase()));
  }
  
  if (filters.active !== undefined) {
    configs = configs.filter(c => c.is_active === filters.active);
  }
  
  if (filters.status) {
    configs = configs.filter(c => c.test_status === filters.status);
  }
  
  return configs;
}

/**
 * Get a specific mock SMTP config by ID
 */
export function getMockSMTPConfigById(id: string): SMTPConfig | null {
  const configs = generateMockSMTPConfigs();
  return configs.find(c => c.id === id) || null;
}

/**
 * Test a mock SMTP configuration
 */
export function testMockSMTPConfig(id: string): Promise<{
  success: boolean;
  response_time?: number;
  error_message?: string;
}> {
  return new Promise((resolve) => {
    // Simulate test delay
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        resolve({
          success: true,
          response_time: Math.floor(Math.random() * 500) + 100
        });
      } else {
        const errors = [
          'Authentication failed',
          'Connection timeout',
          'Invalid host or port',
          'SSL/TLS handshake failed'
        ];
        resolve({
          success: false,
          error_message: errors[Math.floor(Math.random() * errors.length)]
        });
      }
    }, Math.random() * 2000 + 1000); // 1-3 second delay
  });
}

/**
 * Create a new mock SMTP configuration
 */
export function createMockSMTPConfig(data: {
  provider: string;
  host: string;
  port: number;
  username: string;
  encryption: SMTPConfig['encryption'];
  is_active?: boolean;
}): SMTPConfig {
  return {
    id: `smtp-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    provider: data.provider,
    host: data.host,
    port: data.port,
    username: data.username,
    encryption: data.encryption,
    is_active: data.is_active ?? false,
    last_tested: null,
    test_status: 'never_tested',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    test_results: {
      success_count: 0,
      failure_count: 0
    },
    settings: generateSMTPSettings()
  };
}

/**
 * Update a mock SMTP configuration
 */
export function updateMockSMTPConfig(id: string, updates: Partial<SMTPConfig>): SMTPConfig | null {
  const config = getMockSMTPConfigById(id);
  if (!config) return null;
  
  return {
    ...config,
    ...updates,
    id: config.id, // Ensure ID doesn't change
    updated_at: new Date().toISOString()
  };
}

/**
 * Get SMTP provider templates
 */
export function getSMTPProviderTemplates(): Array<{
  name: string;
  host: string;
  port: number;
  encryption: SMTPConfig['encryption'];
  description: string;
}> {
  return Object.values(SMTP_PROVIDERS);
}