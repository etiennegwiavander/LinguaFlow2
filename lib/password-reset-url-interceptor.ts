"use client";

import * as React from 'react';

/**
 * Password Reset URL Interceptor
 * 
 * This module prevents Supabase from automatically processing password reset tokens
 * by intercepting and cleaning the URL before Supabase's detectSessionInUrl can process them.
 * 
 * SECURITY: This ensures users see the password reset form instead of being auto-logged in.
 */

interface ResetTokens {
  accessToken?: string;
  refreshToken?: string;
  tokenHash?: string;
  type?: string;
  error?: string;
  errorDescription?: string;
}

interface InterceptorResult {
  tokens: ResetTokens | null;
  hasError: boolean;
  errorMessage?: string;
  wasIntercepted: boolean;
}

/**
 * Intercepts password reset tokens from URL before Supabase can process them
 * This prevents automatic session creation while preserving tokens for manual processing
 */
export function interceptPasswordResetTokens(): InterceptorResult {
  if (typeof window === 'undefined') {
    return { tokens: null, hasError: false, wasIntercepted: false };
  }

  const currentPath = window.location.pathname;
  
  // Only intercept on password reset pages
  if (currentPath !== '/auth/reset-password') {
    return { tokens: null, hasError: false, wasIntercepted: false };
  }

  try {
    // Extract tokens from both search params and hash fragment
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const tokens: ResetTokens = {
      accessToken: urlParams.get('access_token') || hashParams.get('access_token') || undefined,
      refreshToken: urlParams.get('refresh_token') || hashParams.get('refresh_token') || undefined,
      tokenHash: urlParams.get('token_hash') || hashParams.get('token_hash') || undefined,
      type: urlParams.get('type') || hashParams.get('type') || undefined,
      error: urlParams.get('error') || hashParams.get('error') || undefined,
      errorDescription: urlParams.get('error_description') || hashParams.get('error_description') || undefined,
    };

    // Check if we have any reset-related parameters
    const hasResetTokens = tokens.accessToken || tokens.tokenHash || tokens.error;
    
    if (!hasResetTokens) {
      return { tokens: null, hasError: false, wasIntercepted: false };
    }

    // CRITICAL: Clean the URL immediately to prevent Supabase auto-processing
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // Check for auth errors
    if (tokens.error) {
      return {
        tokens,
        hasError: true,
        errorMessage: `Auth error: ${tokens.error} - ${tokens.errorDescription || 'No description'}`,
        wasIntercepted: true
      };
    }

    // Validate token presence
    if (!tokens.accessToken && !tokens.tokenHash) {
      return {
        tokens,
        hasError: true,
        errorMessage: 'No valid reset tokens found in URL',
        wasIntercepted: true
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Password Reset URL Interceptor: Successfully intercepted tokens', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasTokenHash: !!tokens.tokenHash,
        hasError: !!tokens.error,
        urlCleaned: true
      });
    }

    return {
      tokens,
      hasError: false,
      wasIntercepted: true
    };

  } catch (error) {
    console.error('Error intercepting password reset tokens:', error);
    return {
      tokens: null,
      hasError: true,
      errorMessage: 'Failed to process reset link',
      wasIntercepted: false
    };
  }
}

/**
 * Hook to use the password reset URL interceptor
 * This should be called as early as possible in the reset password component
 */
export function usePasswordResetInterceptor() {
  const [result, setResult] = React.useState<InterceptorResult>({
    tokens: null,
    hasError: false,
    wasIntercepted: false
  });
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Run interceptor immediately on mount
    const interceptResult = interceptPasswordResetTokens();
    setResult(interceptResult);
    setIsReady(true);
  }, []);

  return {
    ...result,
    isReady
  };
}