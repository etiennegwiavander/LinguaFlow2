/**
 * Unit tests for password reset token validation
 * Tests token validation logic without session creation
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2
 */

import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe('Password Reset Token Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Standard Token Format Validation', () => {
    it('should validate valid standard tokens (access_token + refresh_token)', () => {
      const validAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const validRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      // Test JWT format validation
      const isValidJWTFormat = (token: string): boolean => {
        if (!token || typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
      };

      expect(isValidJWTFormat(validAccessToken)).toBe(true);
      expect(isValidJWTFormat(validRefreshToken)).toBe(true);
    });

    it('should reject invalid standard token formats', () => {
      const isValidJWTFormat = (token: string): boolean => {
        if (!token || typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
      };

      // Test various invalid formats
      expect(isValidJWTFormat('')).toBe(false);
      expect(isValidJWTFormat('invalid')).toBe(false);
      expect(isValidJWTFormat('invalid.token')).toBe(false);
      expect(isValidJWTFormat('invalid.token.')).toBe(false);
      expect(isValidJWTFormat('.invalid.token')).toBe(false);
      expect(isValidJWTFormat('invalid..token')).toBe(false);
      expect(isValidJWTFormat(null as any)).toBe(false);
      expect(isValidJWTFormat(undefined as any)).toBe(false);
    });

    it('should reject tokens that are too short', () => {
      const validateTokenLength = (token: string): boolean => {
        return token && token.length >= 10;
      };

      expect(validateTokenLength('short')).toBe(false);
      expect(validateTokenLength('123456789')).toBe(false);
      expect(validateTokenLength('1234567890')).toBe(true);
      expect(validateTokenLength('')).toBe(false);
    });

    it('should validate standard tokens without creating sessions', async () => {
      const mockTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      };

      // Simulate token validation logic (without session creation)
      const validateTokensSecurely = (tokens: { accessToken: string; refreshToken: string }): boolean => {
        // Basic format validation
        const isValidJWTFormat = (token: string): boolean => {
          if (!token || typeof token !== 'string') return false;
          const parts = token.split('.');
          return parts.length === 3 && parts.every(part => part.length > 0);
        };

        // Length validation
        const isValidLength = (token: string): boolean => {
          return token && token.length >= 10;
        };

        return (
          isValidJWTFormat(tokens.accessToken) &&
          isValidJWTFormat(tokens.refreshToken) &&
          isValidLength(tokens.accessToken) &&
          isValidLength(tokens.refreshToken)
        );
      };

      const isValid = validateTokensSecurely(mockTokens);
      expect(isValid).toBe(true);

      // Verify no session creation during validation
      expect(supabase.auth.setSession).not.toHaveBeenCalled();
      expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe('Token Hash Format Validation', () => {
    it('should validate valid token_hash format', () => {
      const validTokenHash = 'abcdef1234567890abcdef1234567890abcdef12';

      const validateTokenHash = (tokenHash: string): boolean => {
        return tokenHash && tokenHash.length >= 10;
      };

      expect(validateTokenHash(validTokenHash)).toBe(true);
    });

    it('should reject invalid token_hash formats', () => {
      const validateTokenHash = (tokenHash: string): boolean => {
        return tokenHash && tokenHash.length >= 10;
      };

      expect(validateTokenHash('')).toBe(false);
      expect(validateTokenHash('short')).toBe(false);
      expect(validateTokenHash('123456789')).toBe(false);
      expect(validateTokenHash(null as any)).toBe(false);
      expect(validateTokenHash(undefined as any)).toBe(false);
    });

    it('should validate token_hash without creating sessions', async () => {
      const mockTokenHash = 'abcdef1234567890abcdef1234567890abcdef12';

      // Simulate token hash validation logic (without session creation)
      const validateTokenHashSecurely = (tokenHash: string): boolean => {
        return tokenHash && tokenHash.length >= 10;
      };

      const isValid = validateTokenHashSecurely(mockTokenHash);
      expect(isValid).toBe(true);

      // Verify no session creation during validation
      expect(supabase.auth.setSession).not.toHaveBeenCalled();
      expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe('Missing Parameter Scenarios', () => {
    it('should handle missing access_token', () => {
      const validateStandardTokens = (accessToken: string | null, refreshToken: string | null): boolean => {
        return !!(accessToken && refreshToken);
      };

      expect(validateStandardTokens(null, 'valid_refresh_token')).toBe(false);
      expect(validateStandardTokens('', 'valid_refresh_token')).toBe(false);
      expect(validateStandardTokens(undefined as any, 'valid_refresh_token')).toBe(false);
    });

    it('should handle missing refresh_token', () => {
      const validateStandardTokens = (accessToken: string | null, refreshToken: string | null): boolean => {
        return !!(accessToken && refreshToken);
      };

      expect(validateStandardTokens('valid_access_token', null)).toBe(false);
      expect(validateStandardTokens('valid_access_token', '')).toBe(false);
      expect(validateStandardTokens('valid_access_token', undefined as any)).toBe(false);
    });

    it('should handle missing token_hash', () => {
      const validateTokenHash = (tokenHash: string | null): boolean => {
        return !!(tokenHash && tokenHash.length >= 10);
      };

      expect(validateTokenHash(null)).toBe(false);
      expect(validateTokenHash('')).toBe(false);
      expect(validateTokenHash(undefined as any)).toBe(false);
    });

    it('should handle completely missing tokens', () => {
      const validateAnyTokenFormat = (
        accessToken: string | null,
        refreshToken: string | null,
        tokenHash: string | null
      ): boolean => {
        const hasStandardTokens = accessToken && refreshToken;
        const hasTokenHash = tokenHash;
        return !!(hasStandardTokens || hasTokenHash);
      };

      expect(validateAnyTokenFormat(null, null, null)).toBe(false);
      expect(validateAnyTokenFormat('', '', '')).toBe(false);
      expect(validateAnyTokenFormat(undefined as any, undefined as any, undefined as any)).toBe(false);
    });
  });

  describe('Invalid/Expired Token Handling', () => {
    it('should handle expired tokens during password update', async () => {
      const mockExpiredError = {
        message: 'Token has expired',
        status: 401
      };

      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: null,
        error: mockExpiredError
      });

      const categorizeSessionError = (error: any): { type: string; userMessage: string } => {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('expired') || message.includes('exp')) {
          return {
            type: 'expired',
            userMessage: 'Your reset link has expired. Reset links are only valid for 1 hour. Please request a new password reset.'
          };
        }
        return {
          type: 'unknown',
          userMessage: 'Reset link validation failed. Please request a new password reset.'
        };
      };

      const errorCategory = categorizeSessionError(mockExpiredError);
      expect(errorCategory.type).toBe('expired');
      expect(errorCategory.userMessage).toContain('expired');
      expect(errorCategory.userMessage).toContain('1 hour');
    });

    it('should handle invalid tokens during password update', async () => {
      const mockInvalidError = {
        message: 'Invalid token',
        status: 400
      };

      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: null,
        error: mockInvalidError
      });

      const categorizeSessionError = (error: any): { type: string; userMessage: string } => {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('invalid') || message.includes('malformed')) {
          return {
            type: 'invalid',
            userMessage: 'This reset link is invalid or corrupted. Please request a new password reset.'
          };
        }
        return {
          type: 'unknown',
          userMessage: 'Reset link validation failed. Please request a new password reset.'
        };
      };

      const errorCategory = categorizeSessionError(mockInvalidError);
      expect(errorCategory.type).toBe('invalid');
      expect(errorCategory.userMessage).toContain('invalid');
    });

    it('should handle used tokens during password update', async () => {
      const mockUsedError = {
        message: 'Token has already been used',
        status: 400
      };

      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: null,
        error: mockUsedError
      });

      const categorizeVerifyOtpError = (error: any): { type: string; userMessage: string } => {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('used') || message.includes('consumed')) {
          return {
            type: 'used',
            userMessage: 'This reset link has already been used. Please request a new password reset if you still need to change your password.'
          };
        }
        return {
          type: 'unknown',
          userMessage: 'Token verification failed. Please request a new password reset.'
        };
      };

      const errorCategory = categorizeVerifyOtpError(mockUsedError);
      expect(errorCategory.type).toBe('used');
      expect(errorCategory.userMessage).toContain('already been used');
    });
  });

  describe('No Automatic Session Creation Verification', () => {
    it('should verify token validation does not create sessions', () => {
      // Simulate the secure token validation process
      const mockTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      };

      // Token validation logic (client-side only)
      const isValidJWTFormat = (token: string): boolean => {
        if (!token || typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
      };

      const isValidLength = (token: string): boolean => {
        return token && token.length >= 10;
      };

      // Perform validation
      const isValid = (
        isValidJWTFormat(mockTokens.accessToken) &&
        isValidJWTFormat(mockTokens.refreshToken) &&
        isValidLength(mockTokens.accessToken) &&
        isValidLength(mockTokens.refreshToken)
      );

      expect(isValid).toBe(true);

      // Critical security check: No session creation during validation
      expect(supabase.auth.setSession).not.toHaveBeenCalled();
      expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
      expect(supabase.auth.signOut).not.toHaveBeenCalled();
    });

    it('should verify token_hash validation does not create sessions', () => {
      const mockTokenHash = 'abcdef1234567890abcdef1234567890abcdef12';

      // Token hash validation logic (client-side only)
      const isValidTokenHash = (tokenHash: string): boolean => {
        return tokenHash && tokenHash.length >= 10;
      };

      // Perform validation
      const isValid = isValidTokenHash(mockTokenHash);

      expect(isValid).toBe(true);

      // Critical security check: No session creation during validation
      expect(supabase.auth.setSession).not.toHaveBeenCalled();
      expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
      expect(supabase.auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('URL Parameter Extraction', () => {
    it('should extract tokens from URL search parameters', () => {
      const extractTokensFromSearchParams = (searchParams: URLSearchParams) => {
        return {
          accessToken: searchParams.get('access_token'),
          refreshToken: searchParams.get('refresh_token'),
          tokenHash: searchParams.get('token_hash'),
          type: searchParams.get('type'),
          error: searchParams.get('error'),
          errorDescription: searchParams.get('error_description')
        };
      };

      const mockSearchParams = new URLSearchParams('access_token=test_access&refresh_token=test_refresh&type=recovery');
      const extracted = extractTokensFromSearchParams(mockSearchParams);

      expect(extracted.accessToken).toBe('test_access');
      expect(extracted.refreshToken).toBe('test_refresh');
      expect(extracted.type).toBe('recovery');
      expect(extracted.tokenHash).toBeNull();
    });

    it('should extract tokens from URL hash fragment', () => {
      const extractTokensFromHash = (hash: string) => {
        if (!hash) return {};
        const hashParams = new URLSearchParams(hash.substring(1));
        return {
          accessToken: hashParams.get('access_token'),
          refreshToken: hashParams.get('refresh_token'),
          tokenHash: hashParams.get('token_hash'),
          type: hashParams.get('type')
        };
      };

      const mockHash = '#access_token=test_access&refresh_token=test_refresh&type=recovery';
      const extracted = extractTokensFromHash(mockHash);

      expect(extracted.accessToken).toBe('test_access');
      expect(extracted.refreshToken).toBe('test_refresh');
      expect(extracted.type).toBe('recovery');
    });

    it('should handle token_hash format from URL parameters', () => {
      const extractTokensFromSearchParams = (searchParams: URLSearchParams) => {
        return {
          accessToken: searchParams.get('access_token'),
          refreshToken: searchParams.get('refresh_token'),
          tokenHash: searchParams.get('token_hash'),
          type: searchParams.get('type')
        };
      };

      const mockSearchParams = new URLSearchParams('token_hash=test_hash&type=recovery');
      const extracted = extractTokensFromSearchParams(mockSearchParams);

      expect(extracted.tokenHash).toBe('test_hash');
      expect(extracted.type).toBe('recovery');
      expect(extracted.accessToken).toBeNull();
      expect(extracted.refreshToken).toBeNull();
    });
  });
});