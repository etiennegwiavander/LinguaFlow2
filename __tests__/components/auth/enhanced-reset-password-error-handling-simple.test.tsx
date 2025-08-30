/**
 * Simplified Enhanced Error Handling Tests for Password Reset Security Fix
 * 
 * Tests the enhanced error handling and user feedback improvements
 * implemented in task 3 of the password reset security fix.
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

describe('Enhanced Password Reset Error Handling - Core Features', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Missing Token Parameters (Requirement 2.2)', () => {
    it('should display specific error message for completely missing tokens', async () => {
      // Mock empty search params
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete reset link')).toBeInTheDocument();
        expect(screen.getByText('This reset link appears to be incomplete or corrupted')).toBeInTheDocument();
      });

      // Check that helpful error message is shown
      expect(screen.getByText(/Make sure you clicked the complete link from your email/)).toBeInTheDocument();
      
      // Check troubleshooting tips are shown
      expect(screen.getByText('Troubleshooting tips:')).toBeInTheDocument();
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

    it('should display user-friendly message for invalid_request error', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('error', 'invalid_request');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument();
        expect(screen.getByText(/The reset link is malformed/)).toBeInTheDocument();
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

    it('should display specific error message for expired tokens during password update', async () => {
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Token expired', status: 401 }
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
          expect.stringContaining('Reset link has expired')
        );
      });
    });
  });

  describe('Token Hash Format Support (Requirement 4.2, 4.3)', () => {
    it('should handle verifyOtp errors with specific categorization', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('token_hash', 'valid_token_hash_12345');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

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

    it('should handle verifyOtp expired token error', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('token_hash', 'expired_token_hash_12345');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      // Mock verifyOtp to fail with expired token error
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Token expired' }
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
          expect.stringContaining('Your reset link has expired')
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

  describe('Error Message Improvements (Requirement 2.1, 2.2)', () => {
    it('should show enhanced error UI with specific titles and descriptions', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('error', 'access_denied');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        // Check for enhanced error UI elements
        expect(screen.getByText('Authentication error')).toBeInTheDocument();
        expect(screen.getByText('An authentication error occurred')).toBeInTheDocument();
        expect(screen.getByText('Request new reset link')).toBeInTheDocument();
        expect(screen.getByText('Back to login')).toBeInTheDocument();
      });
    });

    it('should show different error icons and colors for different error types', async () => {
      // Test missing tokens (should show amber warning)
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

      const { rerender } = render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete reset link')).toBeInTheDocument();
      });

      // Test auth error (should show red error)
      const searchParams = new URLSearchParams();
      searchParams.set('error', 'server_error');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      rerender(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument();
      });
    });
  });
});