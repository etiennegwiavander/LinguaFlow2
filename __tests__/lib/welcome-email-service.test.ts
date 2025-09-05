import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { WelcomeEmailService } from '@/lib/welcome-email-service';

// Mock Supabase
const mockInvoke = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    },
    from: mockFrom
  }
}));

describe('WelcomeEmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock chain
    mockLimit.mockReturnValue({ data: [], error: null });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true, message: 'Email sent' },
        error: null
      });

      const result = await WelcomeEmailService.sendWelcomeEmail({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('send-welcome-email', {
        body: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      });
    });

    it('should handle email sending errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'SMTP error' }
      });

      const result = await WelcomeEmailService.sendWelcomeEmail({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP error');
    });

    it('should handle unexpected errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const result = await WelcomeEmailService.sendWelcomeEmail({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getWelcomeEmailHistory', () => {
    it('should fetch email history successfully', async () => {
      const mockData = [
        {
          id: '1',
          email: 'test@example.com',
          user_type: 'tutor',
          subject: 'Welcome to LinguaFlow',
          sent_at: '2024-01-01T00:00:00Z',
          status: 'sent'
        }
      ];

      mockLimit.mockReturnValue({ data: mockData, error: null });

      const result = await WelcomeEmailService.getWelcomeEmailHistory('test@example.com');

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('welcome_emails');
    });

    it('should handle database errors', async () => {
      mockLimit.mockReturnValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await WelcomeEmailService.getWelcomeEmailHistory('test@example.com');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('hasWelcomeEmailBeenSent', () => {
    it('should return true when welcome email exists', async () => {
      mockLimit.mockReturnValue({ 
        data: [{ id: '1' }], 
        error: null 
      });

      const result = await WelcomeEmailService.hasWelcomeEmailBeenSent('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false when no welcome email exists', async () => {
      mockLimit.mockReturnValue({ 
        data: [], 
        error: null 
      });

      const result = await WelcomeEmailService.hasWelcomeEmailBeenSent('test@example.com');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockLimit.mockReturnValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await WelcomeEmailService.hasWelcomeEmailBeenSent('test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('resendWelcomeEmail', () => {
    it('should resend welcome email', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      const result = await WelcomeEmailService.resendWelcomeEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('send-welcome-email', {
        body: {
          email: 'test@example.com'
        }
      });
    });
  });
});