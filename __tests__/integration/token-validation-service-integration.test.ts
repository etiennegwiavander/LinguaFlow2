/**
 * Integration tests for TokenValidationService
 * 
 * Tests the service integration with mocked Supabase calls
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.4
 */

import { 
  TokenValidationService, 
  ResetTokens
} from '@/lib/password-reset-token-validation';
import { supabase } from '@/lib/supabase';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn()
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('TokenValidationService Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePasswordSecurely - Standard Token Flow', () => {
    it('should successfully update password with standard tokens', async () => {
      const tokens: ResetTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        type: 'standard'
      };

      // Mock successful session creation
      mockSupabase.auth.setSession.mockResolvedValue({
        data: {
          session: { access_token: 'test', refresh_token: 'test' },
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      } as any);

      // Mock successful password update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      } as any);

      // Mock successful sign out
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await TokenValidationService.updatePasswordSecurely(tokens, 'newPassword123');

      // Verify the flow
      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123'
      });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle session creation errors', async () => {
      const tokens: ResetTokens = {
        accessToken: 'invalid_token',
        refreshToken: 'invalid_refresh',
        type: 'standard'
      };

      // Mock session creation error
      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Token has expired', status: 401 }
      } as any);

      // Mock sign out for cleanup
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(
        TokenValidationService.updatePasswordSecurely(tokens, 'newPassword123')
      ).rejects.toThrow('Your reset link has expired');

      expect(mockSupabase.auth.setSession).toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1); // Cleanup
    });

    it('should handle password update errors', async () => {
      const tokens: ResetTokens = {
        accessToken: 'valid_token',
        refreshToken: 'valid_refresh',
        type: 'standard'
      };

      // Mock successful session creation
      mockSupabase.auth.setSession.mockResolvedValue({
        data: {
          session: { access_token: 'test', refresh_token: 'test' },
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      } as any);

      // Mock password update error
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password is too weak', status: 400 }
      } as any);

      // Mock sign out for cleanup
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(
        TokenValidationService.updatePasswordSecurely(tokens, 'weak')
      ).rejects.toThrow('Password is too weak');

      expect(mockSupabase.auth.setSession).toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1); // Cleanup
    });
  });

  describe('updatePasswordSecurely - Token Hash Flow', () => {
    it('should successfully update password with token hash', async () => {
      const tokens: ResetTokens = {
        accessToken: 'valid_token_hash_12345',
        tokenHash: 'valid_token_hash_12345',
        type: 'hash'
      };

      // Mock successful token verification
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          session: { access_token: 'test', refresh_token: 'test' },
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      } as any);

      // Mock successful password update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      } as any);

      // Mock successful sign out
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await TokenValidationService.updatePasswordSecurely(tokens, 'newPassword123');

      // Verify the flow
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: tokens.tokenHash,
        type: 'recovery'
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123'
      });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle token verification errors', async () => {
      const tokens: ResetTokens = {
        accessToken: 'invalid_hash',
        tokenHash: 'invalid_hash',
        type: 'hash'
      };

      // Mock token verification error
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Token not found', status: 404 }
      } as any);

      // Mock sign out for cleanup
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(
        TokenValidationService.updatePasswordSecurely(tokens, 'newPassword123')
      ).rejects.toThrow('Reset link not found');

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1); // Cleanup
    });
  });

  describe('End-to-End Token Validation Flow', () => {
    it('should validate and process standard tokens end-to-end', async () => {
      // Step 1: Extract tokens from URL
      const searchParams = new URLSearchParams('access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      
      const tokens = TokenValidationService.extractTokensFromUrl(searchParams);
      expect(tokens).not.toBeNull();
      expect(tokens!.type).toBe('standard');

      // Step 2: Validate token structure
      const validation = await TokenValidationService.validateTokensSecurely(tokens!);
      expect(validation.isValid).toBe(true);

      // Step 3: Mock successful password update
      mockSupabase.auth.setSession.mockResolvedValue({
        data: {
          session: { access_token: 'test', refresh_token: 'test' },
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      } as any);

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      } as any);

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Step 4: Update password
      await TokenValidationService.updatePasswordSecurely(tokens!, 'newSecurePassword123');

      // Verify complete flow
      expect(mockSupabase.auth.setSession).toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should validate and process token hash end-to-end', async () => {
      // Step 1: Extract token hash from URL
      const searchParams = new URLSearchParams('token_hash=secure_hash_token_12345');
      
      const tokens = TokenValidationService.extractTokensFromUrl(searchParams);
      expect(tokens).not.toBeNull();
      expect(tokens!.type).toBe('hash');

      // Step 2: Validate token structure
      const validation = await TokenValidationService.validateTokensSecurely(tokens!);
      expect(validation.isValid).toBe(true);

      // Step 3: Mock successful password update
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          session: { access_token: 'test', refresh_token: 'test' },
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      } as any);

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      } as any);

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Step 4: Update password
      await TokenValidationService.updatePasswordSecurely(tokens!, 'newSecurePassword123');

      // Verify complete flow
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });
});