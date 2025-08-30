/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { interceptPasswordResetTokens, usePasswordResetInterceptor } from '@/lib/password-reset-url-interceptor';

// Mock window.location and history
const mockReplaceState = jest.fn();

// Store original values
const originalLocation = window.location;
const originalHistory = window.history;

// Mock location object
const mockLocation = {
  pathname: '/auth/reset-password',
  search: '',
  hash: '',
  href: 'http://localhost:3000/auth/reset-password'
};

// Mock history object
const mockHistory = {
  replaceState: mockReplaceState
};

beforeAll(() => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  delete window.history;
  
  // @ts-ignore
  window.location = mockLocation;
  // @ts-ignore
  window.history = mockHistory;
});

afterAll(() => {
  // Restore original values
  // @ts-ignore
  window.location = originalLocation;
  // @ts-ignore
  window.history = originalHistory;
});

describe('Password Reset URL Interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReplaceState.mockClear();
    
    // Reset location mock
    mockLocation.pathname = '/auth/reset-password';
    mockLocation.search = '';
    mockLocation.hash = '';
    mockLocation.href = 'http://localhost:3000/auth/reset-password';
  });

  describe('interceptPasswordResetTokens', () => {
    it('should not intercept on non-reset-password pages', () => {
      mockLocation.pathname = '/auth/login';
      
      const result = interceptPasswordResetTokens();
      
      expect(result).toEqual({
        tokens: null,
        hasError: false,
        wasIntercepted: false
      });
      expect(mockReplaceState).not.toHaveBeenCalled();
    });

    it('should intercept standard access/refresh tokens from search params', () => {
      mockLocation.search = '?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature&type=recovery';
      
      const result = interceptPasswordResetTokens();
      
      expect(result.wasIntercepted).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.tokens).toEqual({
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature',
        type: 'recovery',
        tokenHash: undefined,
        error: undefined,
        errorDescription: undefined
      });
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });

    it('should intercept token hash from search params', () => {
      mockLocation.search = '?token_hash=abcdef123456789&type=recovery';
      
      const result = interceptPasswordResetTokens();
      
      expect(result.wasIntercepted).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.tokens).toEqual({
        accessToken: undefined,
        refreshToken: undefined,
        tokenHash: 'abcdef123456789',
        type: 'recovery',
        error: undefined,
        errorDescription: undefined
      });
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });

    it('should intercept tokens from hash fragment', () => {
      mockLocation.hash = '#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature&type=recovery';
      
      const result = interceptPasswordResetTokens();
      
      expect(result.wasIntercepted).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.tokens?.accessToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
      expect(result.tokens?.refreshToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature');
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });

    it('should handle auth errors', () => {
      mockLocation.search = '?error=access_denied&error_description=User%20denied%20access';
      
      const result = interceptPasswordResetTokens();
      
      expect(result.wasIntercepted).toBe(true);
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('Auth error: access_denied - User denied access');
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });

    it('should return error for missing tokens', () => {
      mockLocation.search = '?type=recovery'; // No actual tokens
      
      const result = interceptPasswordResetTokens();
      
      expect(result.wasIntercepted).toBe(true);
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe('No valid reset tokens found in URL');
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });

    it('should not intercept when no reset-related parameters are present', () => {
      mockLocation.search = '?some_other_param=value';
      
      const result = interceptPasswordResetTokens();
      
      expect(result).toEqual({
        tokens: null,
        hasError: false,
        wasIntercepted: false
      });
      expect(mockReplaceState).not.toHaveBeenCalled();
    });
  });

  describe('usePasswordResetInterceptor hook', () => {
    function TestComponent() {
      const { tokens, hasError, errorMessage, isReady, wasIntercepted } = usePasswordResetInterceptor();
      
      return (
        <div>
          <div data-testid="is-ready">{isReady ? 'ready' : 'loading'}</div>
          <div data-testid="has-error">{hasError ? 'error' : 'no-error'}</div>
          <div data-testid="was-intercepted">{wasIntercepted ? 'intercepted' : 'not-intercepted'}</div>
          <div data-testid="error-message">{errorMessage || 'no-message'}</div>
          <div data-testid="has-tokens">{tokens ? 'has-tokens' : 'no-tokens'}</div>
        </div>
      );
    }

    it('should return ready state with valid tokens', async () => {
      mockLocation.search = '?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.signature';
      
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('ready');
      });
      
      expect(screen.getByTestId('has-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('was-intercepted')).toHaveTextContent('intercepted');
      expect(screen.getByTestId('has-tokens')).toHaveTextContent('has-tokens');
    });

    it('should return error state for auth errors', async () => {
      mockLocation.search = '?error=invalid_request&error_description=Invalid%20request';
      
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('ready');
      });
      
      expect(screen.getByTestId('has-error')).toHaveTextContent('error');
      expect(screen.getByTestId('was-intercepted')).toHaveTextContent('intercepted');
      expect(screen.getByTestId('error-message')).toHaveTextContent('Auth error: invalid_request - Invalid request');
    });

    it('should return no-intercept state for non-reset pages', async () => {
      mockLocation.pathname = '/auth/login';
      mockLocation.search = '?access_token=some_token';
      
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-ready')).toHaveTextContent('ready');
      });
      
      expect(screen.getByTestId('has-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('was-intercepted')).toHaveTextContent('not-intercepted');
      expect(screen.getByTestId('has-tokens')).toHaveTextContent('no-tokens');
    });
  });

  describe('URL cleaning behavior', () => {
    it('should clean URL immediately when tokens are detected', () => {
      mockLocation.search = '?access_token=test_token&refresh_token=test_refresh&type=recovery';
      mockLocation.href = 'http://localhost:3000/auth/reset-password?access_token=test_token&refresh_token=test_refresh&type=recovery';
      
      interceptPasswordResetTokens();
      
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });

    it('should clean URL even when there are errors', () => {
      mockLocation.search = '?error=access_denied';
      
      interceptPasswordResetTokens();
      
      expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/auth/reset-password');
    });
  });
});