/**
 * Enhanced Error Handling Tests for Password Reset Security Fix
 * 
 * Tests the enhanced error handling and user feedback improvements
 * implemented in task 3 of the password reset security fix.
 * 
 * Requirements tested:
 * - 2.1: Invalid/expired token error messages
 * - 2.2: Missing token parameter error handling
 * - 2.4: Specific error messages for user understanding
 * - 5.1: Error logging for debugging (development only)
 * - 5.2: Clear error messages for users
 * - 5.3: Graceful error handling without exposing sensitive information
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

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

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock console methods for development logging tests
const originalConsole = console;
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
};

describe('Enhanced Password Reset Error Handling', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Reset console mocks
    Object.keys(mockConsole).forEach(key => {
      mockConsole[key as keyof typeof mockConsole].mockClear();
    });

    // Mock window.location
    delete (window as any).location;
    window.location = { hash: '' } as any;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe('Missing Token Parameters (Requirement 2.2)', () => {
    it('should display specific error message for completely missing tokens', async () => {
      // Mock empty search params
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
      
      // Mock empty window.location.hash
      window.location.hash = '';

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete reset link')).toBeInTheDocument();
        expect(screen.getByText('This reset link appears to be incomplete or corrupted')).toBeInTheDocument();
        expect(screen.getByText(/Make sure you clicked the complete link from your email/)).toBeInTheDocument();
      });

      // Check troubleshooting tips are shown
      expect(screen.getByText('Troubleshooting tips:')).toBeInTheDocument();
      expect(screen.getByText(/Check your email for the complete reset link/)).toBeInTheDocument();
    });

    it('should display specific error message for partial token parameters', async () => {
      // Mock search params with only access token (missing refresh token)
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'partial_token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete reset link')).toBeInTheDocument();
      });
    });
  });

  describe('Invalid/Expired Token Error Messages (Requirement 2.1)', () => {
    it('should display specific error message for malformed access tokens', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'short'); // Too short
      searchParams.set('refresh_token', 'valid_refresh_token_here_12345');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
        expect(screen.getByText(/This reset link appears to be corrupted/)).toBeInTheDocument();
      });
    });

    it('should display specific error message for invalid JWT format', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'invalid_jwt_format_no_dots'); // Invalid JWT format
      searchParams.set('refresh_token', 'also.invalid.jwt');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
        expect(screen.getByText(/This reset link is not in the correct format/)).toBeInTheDocument();
      });
    });

    it('should display specific error message for expired tokens', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'valid.jwt.token');
      searchParams.set('refresh_token', 'valid.refresh.token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      // Mock session creation to fail with expired error
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Token expired', status: 401 }
      });

      render(<ResetPasswordPage />);

      // Wait for token validation
      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      // Fill form and submit
      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      const submitButton = screen.getByRole('button', { name: /update password/i });

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Reset link has expired')
        );
      });
    });
  });

  describe('Authentication Error Handling (Requirement 2.4)', () => {
    it('should display user-friendly message for access_denied error', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('error', 'access_denied');
      searchParams.set('error_description', 'Access was denied');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument();
        expect(screen.getByText(/Access was denied/)).toBeInTheDocument();
      });
    });

    it('should display user-friendly message for server_error', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('error', 'server_error');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument();
        expect(screen.getByText(/A server error occurred/)).toBeInTheDocument();
      });
    });
  });

  describe('Password Update Error Categorization (Requirement 2.4)', () => {
    beforeEach(() => {
      // Setup valid tokens
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'valid.jwt.token');
      searchParams.set('refresh_token', 'valid.refresh.token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      // Mock successful session creation
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    });

    it('should display specific error message for weak password', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Password is too weak' }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      const submitButton = screen.getByRole('button', { name: /update password/i });

      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Password is too weak')
        );
      });
    });

    it('should display specific error message for same password', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'New password is the same as the old password' }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      const submitButton = screen.getByRole('button', { name: /update password/i });

      fireEvent.change(passwordInput, { target: { value: 'samepassword' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'samepassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('New password must be different')
        );
      });
    });
  });

  describe('Development Logging (Requirement 5.1)', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      // Mock console for development logging tests
      global.console = mockConsole as any;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
      global.console = originalConsole;
    });

    it('should log detailed token validation info in development', async () => {
      process.env.NODE_ENV = 'development';

      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'valid.jwt.token');
      searchParams.set('refresh_token', 'valid.refresh.token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(mockConsole.group).toHaveBeenCalledWith(
          expect.stringContaining('Password Reset Token Validation')
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          'Token presence check:',
          expect.objectContaining({
            accessToken: expect.stringContaining('present'),
            refreshToken: expect.stringContaining('present'),
          })
        );
        expect(mockConsole.groupEnd).toHaveBeenCalled();
      });
    });

    it('should not log sensitive information in development', async () => {
      process.env.NODE_ENV = 'development';

      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'secret.jwt.token');
      searchParams.set('refresh_token', 'secret.refresh.token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        // Check that actual token values are not logged
        const logCalls = mockConsole.log.mock.calls.flat();
        const logString = JSON.stringify(logCalls);
        
        expect(logString).not.toContain('secret.jwt.token');
        expect(logString).not.toContain('secret.refresh.token');
        
        // But should contain presence indicators
        expect(logString).toContain('present');
      });
    });

    it('should not log anything in production', async () => {
      process.env.NODE_ENV = 'production';

      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'valid.jwt.token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete reset link')).toBeInTheDocument();
      });

      // Should not have any console calls in production
      expect(mockConsole.group).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('Token Hash Format Support (Requirement 4.2, 4.3)', () => {
    it('should handle token_hash format with specific error messages', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('token_hash', 'short'); // Too short
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
        expect(screen.getByText(/This reset link appears to be corrupted/)).toBeInTheDocument();
      });
    });

    it('should handle verifyOtp errors with specific categorization', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('token_hash', 'valid_token_hash_12345');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      // Mock verifyOtp to fail with used token error
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Token has already been used' }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      const submitButton = screen.getByRole('button', { name: /update password/i });

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('This reset link has already been used')
        );
      });
    });
  });

  describe('Sensitive Information Protection (Requirement 5.3)', () => {
    it('should not expose token values in error messages', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'sensitive.token.value');
      searchParams.set('refresh_token', 'sensitive.refresh.value');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      // Mock session creation to fail
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid token format' }
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      const submitButton = screen.getByRole('button', { name: /update password/i });

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check that toast error was called
        expect(toast.error).toHaveBeenCalled();
        
        // Get the error message that was displayed
        const errorMessage = (toast.error as jest.Mock).mock.calls[0][0];
        
        // Ensure sensitive token values are not in the error message
        expect(errorMessage).not.toContain('sensitive.token.value');
        expect(errorMessage).not.toContain('sensitive.refresh.value');
      });
    });

    it('should sanitize error messages from API responses', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('access_token', 'valid.jwt.token');
      searchParams.set('refresh_token', 'valid.refresh.token');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });

      // Mock session creation success but password update failure with sensitive info
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { 
          message: 'Database error: connection failed to db.internal.server.com:5432 with token abc123',
          status: 500
        }
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Reset your password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      const submitButton = screen.getByRole('button', { name: /update password/i });

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = (toast.error as jest.Mock).mock.calls[0][0];
        
        // Should show generic message, not the detailed database error
        expect(errorMessage).toContain('Failed to update password');
        expect(errorMessage).not.toContain('db.internal.server.com');
        expect(errorMessage).not.toContain('abc123');
      });
    });
  });
});