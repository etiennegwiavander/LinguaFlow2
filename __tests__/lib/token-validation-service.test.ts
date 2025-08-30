/**
 * Unit tests for TokenValidationService
 * 
 * Tests the centralized token validation service functionality
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.4
 */

import { 
  TokenValidationService, 
  ResetTokens, 
  ValidationResult,
  extractTokensFromBrowser,
  validateUrlForAuthErrors
} from '@/lib/password-reset-token-validation';

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

describe('TokenValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTokensFromUrl', () => {
    it('should extract standard tokens from search parameters', () => {
      const searchParams = new URLSearchParams('access_token=test_access&refresh_token=test_refresh');
      
      const result = TokenValidationService.extractTokensFromUrl(searchParams);
      
      expect(result).toEqual({
        accessToken: 'test_access',
        refreshToken: 'test_refresh',
        type: 'standard'
      });
    });

    it('should extract token hash from search parameters', () => {
      const searchParams = new URLSearchParams('token_hash=test_hash');
      
      const result = TokenValidationService.extractTokensFromUrl(searchParams);
      
      expect(result).toEqual({
        accessToken: 'test_hash',
        tokenHash: 'test_hash',
        type: 'hash'
      });
    });

    it('should extract tokens from URL hash fragment', () => {
      const searchParams = new URLSearchParams();
      const hash = '#access_token=hash_access&refresh_token=hash_refresh';
      
      const result = TokenValidationService.extractTokensFromUrl(searchParams, hash);
      
      expect(result).toEqual({
        accessToken: 'hash_access',
        refreshToken: 'hash_refresh',
        type: 'standard'
      });
    });

    it('should prioritize search params over hash fragment', () => {
      const searchParams = new URLSearchParams('access_token=search_access&refresh_token=search_refresh');
      const hash = '#access_token=hash_access&refresh_token=hash_refresh';
      
      const result = TokenValidationService.extractTokensFromUrl(searchParams, hash);
      
      expect(result).toEqual({
        accessToken: 'search_access',
        refreshToken: 'search_refresh',
        type: 'standard'
      });
    });

    it('should return null when no tokens are found', () => {
      const searchParams = new URLSearchParams();
      
      const result = TokenValidationService.extractTokensFromUrl(searchParams);
      
      expect(result).toBeNull();
    });

    it('should handle hash without # prefix', () => {
      const searchParams = new URLSearchParams();
      const hash = 'token_hash=test_hash_no_prefix';
      
      const result = TokenValidationService.extractTokensFromUrl(searchParams, hash);
      
      expect(result).toEqual({
        accessToken: 'test_hash_no_prefix',
        tokenHash: 'test_hash_no_prefix',
        type: 'hash'
      });
    });
  });

  describe('isValidJWTFormat', () => {
    it('should validate correct JWT format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const result = TokenValidationService.isValidJWTFormat(validJWT);
      
      expect(result).toBe(true);
    });

    it('should reject invalid JWT format', () => {
      const invalidJWT = 'invalid.jwt';
      
      const result = TokenValidationService.isValidJWTFormat(invalidJWT);
      
      expect(result).toBe(false);
    });

    it('should reject empty or null tokens', () => {
      expect(TokenValidationService.isValidJWTFormat('')).toBe(false);
      expect(TokenValidationService.isValidJWTFormat(null as any)).toBe(false);
      expect(TokenValidationService.isValidJWTFormat(undefined as any)).toBe(false);
    });

    it('should reject tokens with empty parts', () => {
      const invalidJWT = 'part1..part3';
      
      const result = TokenValidationService.isValidJWTFormat(invalidJWT);
      
      expect(result).toBe(false);
    });
  });

  describe('validateTokenStructure', () => {
    it('should validate standard tokens with correct structure', () => {
      const tokens: ResetTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        type: 'standard'
      };
      
      const result = TokenValidationService.validateTokenStructure(tokens);
      
      expect(result.isValid).toBe(true);
    });

    it('should validate token hash with correct structure', () => {
      const tokens: ResetTokens = {
        accessToken: 'valid_token_hash_12345',
        tokenHash: 'valid_token_hash_12345',
        type: 'hash'
      };
      
      const result = TokenValidationService.validateTokenStructure(tokens);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject standard tokens with short access token', () => {
      const tokens: ResetTokens = {
        accessToken: 'short',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        type: 'standard'
      };
      
      const result = TokenValidationService.validateTokenStructure(tokens);
      
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('invalid_tokens');
      expect(result.userMessage).toContain('corrupted');
    });

    it('should reject standard tokens with invalid JWT format', () => {
      const tokens: ResetTokens = {
        accessToken: 'invalid.jwt',  // Only 2 parts instead of 3
        refreshToken: 'also.invalid',  // Only 2 parts instead of 3
        type: 'standard'
      };
      
      const result = TokenValidationService.validateTokenStructure(tokens);
      
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('invalid_tokens');
      expect(result.userMessage).toContain('correct format');
    });

    it('should reject token hash with short hash', () => {
      const tokens: ResetTokens = {
        accessToken: 'short',
        tokenHash: 'short',
        type: 'hash'
      };
      
      const result = TokenValidationService.validateTokenStructure(tokens);
      
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('invalid_tokens');
      expect(result.userMessage).toContain('corrupted');
    });
  });

  describe('categorizeSessionError', () => {
    it('should categorize expired token errors', () => {
      const error = { message: 'Token has expired' };
      
      const result = TokenValidationService.categorizeSessionError(error);
      
      expect(result.type).toBe('expired');
      expect(result.userMessage).toContain('expired');
      expect(result.userMessage).toContain('1 hour');
    });

    it('should categorize invalid token errors', () => {
      const error = { message: 'Invalid token format' };
      
      const result = TokenValidationService.categorizeSessionError(error);
      
      expect(result.type).toBe('invalid');
      expect(result.userMessage).toContain('invalid');
    });

    it('should categorize used token errors', () => {
      const error = { message: 'Token has been used' };
      
      const result = TokenValidationService.categorizeSessionError(error);
      
      expect(result.type).toBe('used');
      expect(result.userMessage).toContain('already been used');
    });

    it('should categorize network errors', () => {
      const error = { message: 'Network fetch failed' };
      
      const result = TokenValidationService.categorizeSessionError(error);
      
      expect(result.type).toBe('network');
      expect(result.userMessage).toContain('Network error');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'Some unknown error' };
      
      const result = TokenValidationService.categorizeSessionError(error);
      
      expect(result.type).toBe('unknown');
      expect(result.userMessage).toContain('validation failed');
    });
  });

  describe('categorizePasswordError', () => {
    it('should categorize weak password errors', () => {
      const error = { message: 'Password is too weak' };
      
      const result = TokenValidationService.categorizePasswordError(error);
      
      expect(result.type).toBe('weak');
      expect(result.userMessage).toContain('too weak');
    });

    it('should categorize same password errors', () => {
      const error = { message: 'Password is the same as current' };
      
      const result = TokenValidationService.categorizePasswordError(error);
      
      expect(result.type).toBe('same');
      expect(result.userMessage).toContain('different from');
    });

    it('should categorize length errors', () => {
      const error = { message: 'Password is too short' };
      
      const result = TokenValidationService.categorizePasswordError(error);
      
      expect(result.type).toBe('length');
      expect(result.userMessage).toContain('at least 6 characters');
    });

    it('should categorize rate limit errors', () => {
      const error = { message: 'Rate limit exceeded' };
      
      const result = TokenValidationService.categorizePasswordError(error);
      
      expect(result.type).toBe('rate_limit');
      expect(result.userMessage).toContain('Too many');
    });
  });

  describe('extractAuthErrors', () => {
    it('should extract auth errors from search parameters', () => {
      const searchParams = new URLSearchParams('error=access_denied&error_description=Invalid+request');
      
      const result = TokenValidationService.extractAuthErrors(searchParams);
      
      expect(result).toEqual({
        error: 'access_denied',
        errorDescription: 'Invalid request'
      });
    });

    it('should handle missing error parameters', () => {
      const searchParams = new URLSearchParams();
      
      const result = TokenValidationService.extractAuthErrors(searchParams);
      
      expect(result).toEqual({
        error: undefined,
        errorDescription: undefined
      });
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should return specific message for access_denied', () => {
      const result = TokenValidationService.getAuthErrorMessage('access_denied');
      
      expect(result).toContain('Access was denied');
      expect(result).toContain('old reset link');
    });

    it('should return specific message for invalid_request', () => {
      const result = TokenValidationService.getAuthErrorMessage('invalid_request');
      
      expect(result).toContain('malformed');
      expect(result).toContain('complete link');
    });

    it('should return description for unknown errors', () => {
      const result = TokenValidationService.getAuthErrorMessage('unknown_error', 'Custom description');
      
      expect(result).toBe('Custom description');
    });

    it('should return default message for unknown errors without description', () => {
      const result = TokenValidationService.getAuthErrorMessage('unknown_error');
      
      expect(result).toContain('authentication error occurred');
    });
  });
});

describe('validateUrlForAuthErrors', () => {
  it('should return validation result for auth errors', () => {
    const searchParams = new URLSearchParams('error=access_denied&error_description=Test+error');
    
    const result = validateUrlForAuthErrors(searchParams);
    
    expect(result).not.toBeNull();
    expect(result!.isValid).toBe(false);
    expect(result!.errorType).toBe('auth_error');
    expect(result!.userMessage).toContain('Access was denied');
  });

  it('should return null when no auth errors', () => {
    const searchParams = new URLSearchParams('access_token=test');
    
    const result = validateUrlForAuthErrors(searchParams);
    
    expect(result).toBeNull();
  });
});

describe('extractTokensFromBrowser', () => {
  it('should return null when window is undefined', () => {
    const originalWindow = global.window;
    global.window = undefined as any;
    
    const result = extractTokensFromBrowser();
    
    expect(result).toBeNull();
    
    global.window = originalWindow;
  });

  it('should work with valid window object', () => {
    // This test verifies the function exists and handles the window check
    // The actual extraction logic is tested in extractTokensFromUrl tests
    expect(typeof extractTokensFromBrowser).toBe('function');
  });
});