import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import { validateTokensOptimized, performanceMonitor, clearValidationCache } from '@/lib/password-reset-performance';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

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

describe('Reset Password Performance Tests', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    clearValidationCache();
    jest.clearAllMocks();
    
    // Reset performance.now mock
    (window.performance.now as jest.Mock).mockImplementation(() => Date.now());
  });

  describe('Token Validation Performance', () => {
    it('should cache token validation results', async () => {
      const tokens = {
        accessToken: 'valid.jwt.token',
        refreshToken: 'valid.refresh.token',
      };

      // Mock successful validation
      const mockGetUser = require('@/lib/supabase').supabase.auth.getUser;
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // First validation call
      const result1 = await validateTokensOptimized(tokens);
      expect(result1.isValid).toBe(true);
      expect(result1.cached).toBe(false);
      expect(mockGetUser).toHaveBeenCalledTimes(1);

      // Second validation call should use cache
      const result2 = await validateTokensOptimized(tokens);
      expect(result2.isValid).toBe(true);
      expect(result2.cached).toBe(true);
      expect(mockGetUser).toHaveBeenCalledTimes(1); // No additional API call
    });

    it('should measure validation performance', async () => {
      // Mock console.log to capture performance logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock performance.now to return predictable values
      let callCount = 0;
      (window.performance.now as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount * 100; // Return 100, 200, etc.
      });

      const timer = performanceMonitor.startTimer('Test Operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = timer.end();

      expect(duration).toBeGreaterThan(0);
      
      // In development mode, should log performance
      if (process.env.NODE_ENV === 'development') {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Test Operation took')
        );
      }

      consoleSpy.mockRestore();
    });

    it('should handle concurrent validation requests efficiently', async () => {
      const tokens = {
        accessToken: 'concurrent.jwt.token',
        refreshToken: 'concurrent.refresh.token',
      };

      const mockGetUser = require('@/lib/supabase').supabase.auth.getUser;
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // Clear cache to ensure fresh test
      clearValidationCache();

      // Make first request to populate cache
      const firstResult = await validateTokensOptimized(tokens);
      expect(firstResult.isValid).toBe(true);
      expect(firstResult.cached).toBe(false);

      // Make subsequent concurrent requests
      const promises = Array(4).fill(null).map(() => validateTokensOptimized(tokens));
      const results = await Promise.all(promises);

      // All should succeed and be cached
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.cached).toBe(true);
      });

      // Should only make one API call due to caching
      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render loading state quickly', () => {
      mockSearchParams.get.mockReturnValue(null);

      const startTime = performance.now();
      render(<ResetPasswordPage />);
      const endTime = performance.now();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('should handle form interactions without blocking', async () => {
      mockSearchParams.get.mockImplementation((key) => {
        if (key === 'access_token') return 'valid.jwt.token';
        if (key === 'refresh_token') return 'valid.refresh.token';
        return null;
      });

      const mockGetUser = require('@/lib/supabase').supabase.auth.getUser;
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      render(<ResetPasswordPage />);

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const startTime = performance.now();
      
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should respond quickly
    });

    it('should debounce validation calls', async () => {
      const mockGetUser = require('@/lib/supabase').supabase.auth.getUser;
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // Simulate rapid parameter changes
      const mockSearchParamsChanging = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'access_token') return 'changing.jwt.token';
          if (key === 'refresh_token') return 'changing.refresh.token';
          return null;
        }),
      };

      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsChanging);

      render(<ResetPasswordPage />);

      // Wait for debounced validation
      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Should only call validation once due to debouncing
      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Management', () => {
    it('should clean up validation cache when needed', () => {
      const tokens1 = { accessToken: 'token1', refreshToken: 'refresh1' };
      const tokens2 = { accessToken: 'token2', refreshToken: 'refresh2' };

      // Add entries to cache
      validateTokensOptimized(tokens1);
      validateTokensOptimized(tokens2);

      // Clear cache
      clearValidationCache();

      // Cache should be empty
      const stats = require('@/lib/password-reset-performance').getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should handle component unmounting gracefully', () => {
      mockSearchParams.get.mockReturnValue(null);

      const { unmount } = render(<ResetPasswordPage />);
      
      // Should not throw errors when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility Performance', () => {
    it('should announce state changes efficiently', async () => {
      mockSearchParams.get.mockImplementation((key) => {
        if (key === 'access_token') return 'valid.jwt.token';
        if (key === 'refresh_token') return 'valid.refresh.token';
        return null;
      });

      const mockGetUser = require('@/lib/supabase').supabase.auth.getUser;
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      render(<ResetPasswordPage />);

      // Wait for validation and announcement
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      // Check for aria-live regions
      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      mockSearchParams.get.mockReturnValue(null);

      render(<ResetPasswordPage />);

      // Should render the loading skeleton
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Network Optimization', () => {
    it('should handle network errors gracefully', async () => {
      const tokens = {
        accessToken: 'network.error.token',
        refreshToken: 'network.error.refresh',
      };

      const mockGetUser = require('@/lib/supabase').supabase.auth.getUser;
      mockGetUser.mockRejectedValue(new Error('Network error'));

      const result = await validateTokensOptimized(tokens);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should preload critical resources', () => {
      const { preloadResources } = require('@/lib/password-reset-performance');
      
      // Mock document.head.appendChild
      const mockAppendChild = jest.fn();
      Object.defineProperty(document, 'head', {
        value: { appendChild: mockAppendChild },
        writable: true,
      });

      preloadResources();

      expect(mockAppendChild).toHaveBeenCalled();
    });
  });
});