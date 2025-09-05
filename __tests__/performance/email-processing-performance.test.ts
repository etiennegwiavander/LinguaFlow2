import { performance } from 'perf_hooks';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: { success: true }, error: null })
  },
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'admin-user-id' } },
      error: null
    })
  }
};

jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock services
jest.mock('../../lib/email-encryption', () => ({
  encryptPassword: jest.fn().mockImplementation(async (password) => {
    // Simulate encryption time
    await new Promise(resolve => setTimeout(resolve, 10));
    return `encrypted_${password}`;
  }),
  decryptPassword: jest.fn().mockImplementation(async (encrypted) => {
    // Simulate decryption time
    await new Promise(resolve => setTimeout(resolve, 5));
    return encrypted.replace('encrypted_', '');
  })
}));

jest.mock('../../lib/smtp-valida