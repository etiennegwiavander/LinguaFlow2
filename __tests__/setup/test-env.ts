// Test environment configuration
export const TEST_ENV = {
  // Supabase test configuration
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  
  // Email test configuration
  SMTP_TEST_HOST: 'smtp.test.com',
  SMTP_TEST_PORT: 587,
  SMTP_TEST_USER: 'test@example.com',
  SMTP_TEST_PASS: 'test-password',
  
  // Admin test configuration
  ADMIN_TEST_EMAIL: 'admin@example.com',
  ADMIN_TEST_ID: 'admin-user-id',
  
  // API test configuration
  API_BASE_URL: 'http://localhost:3000',
  TEST_TIMEOUT: 10000,
  
  // Performance test thresholds
  MAX_RESPONSE_TIME: 1000,
  MAX_CONCURRENT_REQUESTS: 50,
  MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
};

// Set environment variables for tests
export const setupTestEnv = () => {
  Object.entries(TEST_ENV).forEach(([key, value]) => {
    process.env[key] = String(value);
  });
  
  // Additional Next.js specific env vars
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_ENV.SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = TEST_ENV.SUPABASE_ANON_KEY;
};

// Clean up test environment
export const cleanupTestEnv = () => {
  Object.keys(TEST_ENV).forEach(key => {
    delete process.env[key];
  });
};