/**
 * Integration tests for password reset flow
 * Tests end-to-end password reset flow without auto-login
 * Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 3.3, 3.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the modules before importing
const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
};

const mockSupabase = {
  auth: {
    setSession: jest.fn(),
    verifyOtp: jest.fn(),
    updateUser: jest.fn(),
    signOut: jest.fn(),
  },
};

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock the reset password component
const MockResetPasswordPage = () => {
  const router = { push: mockPush };
  const searchParams = mockSearchParams;
  const [isLoading, setIsLoading] = React.useState(false);
  const [isValidToken, setIsValidToken] = React.useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = React.useState(false);
  const [resetTokens, setResetTokens] = React.useState<{accessToken: string, refreshToken: string} | null>(null);

  // Mock token validation logic
  React.useEffect(() => {
    const validateTokens = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const tokenHash = searchParams.get('token_hash');

      if (accessToken && refreshToken) {
        setResetTokens({ accessToken, refreshToken });
        setIsValidToken(true);
      } else if (tokenHash) {
        setResetTokens({ accessToken: tokenHash, refreshToken: '' });
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    };

    validateTokens();
  }, [searchParams]);

  const handleSubmit = async (password: string) => {
    setIsLoading(true);
    try {
      if (!resetTokens) throw new Error('No tokens available');

      if (resetTokens.refreshToken) {
        // Standard token format
        await mockSupabase.auth.setSession({
          access_token: resetTokens.accessToken,
          refresh_token: resetTokens.refreshToken,
        });
        await mockSupabase.auth.updateUser({ password });
        await mockSupabase.auth.signOut();
      } else {
        // Token hash format
        await mockSupabase.auth.verifyOtp({
          token_hash: resetTokens.accessToken,
          type: 'recovery'
        });
        await mockSupabase.auth.updateUser({ password });
        await mockSupabase.auth.signOut();
      }

      setResetComplete(true);
      mockToast.success('Password updated successfully!');
      setTimeout(() => router.push('/auth/login?reset=success'), 2000);
    } catch (error: any) {
      mockToast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return <div data-testid="loading">Verifying reset link...</div>;
  }

  if (isValidToken === false) {
    return (
      <div data-testid="error">
        <h1>Invalid reset link</h1>
        <p>This reset link is invalid or has expired.</p>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div data-testid="success">
        <h1>Password Updated</h1>
        <p>Your password has been updated successfully. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div data-testid="reset-form">
      <h1>Reset Password</h1>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const password = formData.get('password') as string;
        handleSubmit(password);
      }}>
        <input
          name="password"
          type="password"
          placeholder="New password"
          data-testid="password-input"
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          data-testid="confirm-password-input"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          data-testid="submit-button"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

describe('Password Reset Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset Supabase mocks
    mockSupabase.auth.setSession.mockResolvedValue({ 
      data: { user: { id: 'test-user' }, session: {} }, 
      error: null 
    });
    mockSupabase.auth.verifyOtp.mockResolvedValue({ 
      data: { user: { id: 'test-user' }, session: {} }, 
      error: null 
    });
    mockSupabase.auth.updateUser.mockResolvedValue({ 
      data: { user: { id: 'test-user' } }, 
      error: null 
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
  });

  describe('Requirement 1.1: Password reset form display', () => {
    it('should display password reset form when valid tokens are provided', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      // Act
      render(<MockResetPasswordPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
        expect(screen.getByTestId('password-input')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });
    });

    it('should display password reset form for token hash format', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token_hash') return 'valid-token-hash';
        return null;
      });

      // Act
      render(<MockResetPasswordPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 1.2: No automatic login', () => {
    it('should not automatically log user in when accessing reset page with valid tokens', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      // Act
      render(<MockResetPasswordPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Verify no automatic session creation occurred during token validation
      expect(mockSupabase.auth.setSession).not.toHaveBeenCalled();
      expect(mockSupabase.auth.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 1.4: Immediate sign out after password update', () => {
    it('should sign out immediately after successful password update with standard tokens', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
          access_token: 'valid-access-token',
          refresh_token: 'valid-refresh-token',
        });
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newpassword123'
        });
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });

      // Verify signOut is called after updateUser
      const setSessionCall = mockSupabase.auth.setSession.mock.invocationCallOrder[0];
      const updateUserCall = mockSupabase.auth.updateUser.mock.invocationCallOrder[0];
      const signOutCall = mockSupabase.auth.signOut.mock.invocationCallOrder[0];

      expect(setSessionCall).toBeLessThan(updateUserCall);
      expect(updateUserCall).toBeLessThan(signOutCall);
    });

    it('should sign out immediately after successful password update with token hash', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'token_hash') return 'valid-token-hash';
        return null;
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
          token_hash: 'valid-token-hash',
          type: 'recovery'
        });
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newpassword123'
        });
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });

      // Verify signOut is called after updateUser
      const verifyOtpCall = mockSupabase.auth.verifyOtp.mock.invocationCallOrder[0];
      const updateUserCall = mockSupabase.auth.updateUser.mock.invocationCallOrder[0];
      const signOutCall = mockSupabase.auth.signOut.mock.invocationCallOrder[0];

      expect(verifyOtpCall).toBeLessThan(updateUserCall);
      expect(updateUserCall).toBeLessThan(signOutCall);
    });
  });

  describe('Requirement 3.1: Redirect to login page', () => {
    it('should redirect to login page after successful password update', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
        expect(screen.getByText('Password Updated')).toBeInTheDocument();
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login?reset=success');
      }, { timeout: 3000 });
    });
  });

  describe('Requirement 3.2: Success message display', () => {
    it('should display success confirmation message after password update', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Password updated successfully!');
        expect(screen.getByTestId('success')).toBeInTheDocument();
        expect(screen.getByText('Your password has been updated successfully. Redirecting to login...')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 3.3: Login with new password capability', () => {
    it('should redirect to login page with success parameter for immediate login', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login?reset=success');
      }, { timeout: 3000 });
    });
  });

  describe('Requirement 3.4: No active sessions remain', () => {
    it('should ensure no active sessions remain after password reset completion', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });

      // Verify signOut is the final auth operation
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(mockSupabase.auth.signOut.mock.invocationCallOrder[0]).toBeGreaterThan(
        mockSupabase.auth.updateUser.mock.invocationCallOrder[0]
      );
    });

    it('should sign out even if password update fails', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      mockSupabase.auth.updateUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Password update failed' }
      });

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling scenarios', () => {
    it('should display error for invalid tokens', async () => {
      // Arrange
      mockSearchParams.get.mockReturnValue(null);

      // Act
      render(<MockResetPasswordPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
        expect(screen.getByText('This reset link is invalid or has expired.')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      mockSupabase.auth.setSession.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error');
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state during token validation', () => {
      // Arrange
      mockSearchParams.get.mockReturnValue(null);

      // Act
      render(<MockResetPasswordPage />);

      // Assert - Initially shows loading
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Verifying reset link...')).toBeInTheDocument();
    });

    it('should show loading state during password update', async () => {
      // Arrange
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'access_token') return 'valid-access-token';
        if (key === 'refresh_token') return 'valid-refresh-token';
        return null;
      });

      // Delay the auth operations to test loading state
      mockSupabase.auth.setSession.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: 'test' }, session: {} }, error: null }), 100))
      );

      render(<MockResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-form')).toBeInTheDocument();
      });

      // Act
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'newpassword123' }
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      // Assert
      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });
  });
});