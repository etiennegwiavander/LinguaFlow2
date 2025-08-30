import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from '@/app/auth/reset-password/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the specialized Supabase client
jest.mock('@/lib/supabase-reset-password', () => ({
  supabaseResetPassword: {
    auth: {
      setSession: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
  createTemporaryResetSession: jest.fn(),
  verifyResetTokenHash: jest.fn(),
  updatePasswordWithReset: jest.fn(),
  cleanupResetSession: jest.fn(),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock performance library
jest.mock('@/lib/password-reset-performance', () => ({
  performanceMonitor: {
    startTimer: jest.fn(() => ({
      end: jest.fn(() => 100),
    })),
  },
  preloadResources: jest.fn(),
  debounce: jest.fn((fn) => {
    // Return a function that immediately calls the original function
    return (...args: any[]) => {
      const result = fn(...args);
      // If it's a promise, return it; otherwise wrap in resolved promise
      return Promise.resolve(result);
    };
  }),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Password Reset - No Auto-Login', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    jest.clearAllMocks();
  });

  it('should not auto-login when valid tokens are present in URL', async () => {
    // Mock valid reset tokens in URL
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'access_token') return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      if (key === 'refresh_token') return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      return null;
    });

    render(<ResetPasswordPage />);

    // Should show the password reset form, not auto-login
    await waitFor(() => {
      expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    });

    // Should show password input fields
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();

    // Should not have redirected to dashboard or logged in automatically
    expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/students');
  });

  it('should show error for missing tokens without auto-login', async () => {
    // Mock missing tokens
    mockSearchParams.get.mockReturnValue(null);

    render(<ResetPasswordPage />);

    // Should show error message, not auto-login
    await waitFor(() => {
      expect(screen.getByText(/incomplete reset link/i)).toBeInTheDocument();
    });

    // Should show request new reset link button
    expect(screen.getByText(/request new reset link/i)).toBeInTheDocument();

    // Should not have auto-logged in
    expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/students');
  });

  it('should show error for malformed tokens without auto-login', async () => {
    // Mock malformed tokens
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'access_token') return 'invalid-token';
      if (key === 'refresh_token') return 'invalid-token';
      return null;
    });

    render(<ResetPasswordPage />);

    // Should show error message for invalid format
    await waitFor(() => {
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });

    // Should not have auto-logged in
    expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/students');
  });

  it('should handle token hash format without auto-login', async () => {
    // Mock token hash format
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'token_hash') return 'valid-token-hash-string-here';
      return null;
    });

    render(<ResetPasswordPage />);

    // Should show the password reset form
    await waitFor(() => {
      expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    });

    // Should show password input fields
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();

    // Should not have auto-logged in
    expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/students');
  });

  it('should handle auth errors without auto-login', async () => {
    // Mock auth error in URL
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'error') return 'access_denied';
      if (key === 'error_description') return 'The user denied the request';
      return null;
    });

    render(<ResetPasswordPage />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });

    // Should not have auto-logged in
    expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/students');
  });
});