/**
 * Example integration of TokenValidationService in reset password component
 * 
 * This file demonstrates how to use the centralized token validation service
 * to replace the existing token validation logic in the reset password page.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.4
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  TokenValidationService, 
  ResetTokens, 
  ValidationResult,
  extractTokensFromBrowser,
  validateUrlForAuthErrors
} from './password-reset-token-validation';

/**
 * Custom hook for password reset token validation
 * Replaces the complex useEffect logic in the reset password component
 */
export function usePasswordResetTokens() {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetTokens, setResetTokens] = useState<ResetTokens | null>(null);
  const [errorDetails, setErrorDetails] = useState<ValidationResult | null>(null);
  const searchParams = useSearchParams();

  const validateTokens = useCallback(async () => {
    try {
      // Check for explicit auth errors first
      const authError = validateUrlForAuthErrors(searchParams);
      if (authError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('🚨 Auth error detected:', authError);
        }
        setErrorDetails(authError);
        setIsValidToken(false);
        return;
      }

      // Extract tokens from URL
      const tokens = extractTokensFromBrowser();
      
      if (!tokens) {
        const errorInfo: ValidationResult = {
          isValid: false,
          errorType: 'missing_tokens',
          error: 'No valid reset tokens found in URL parameters or hash fragment',
          userMessage: 'This reset link appears to be incomplete. Please check that you clicked the full link from your email, or request a new password reset.'
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('❌ Missing tokens:', {
            searchParams: Object.fromEntries(searchParams.entries()),
            hash: typeof window !== 'undefined' ? window.location.hash : 'N/A'
          });
        }
        
        setErrorDetails(errorInfo);
        setIsValidToken(false);
        return;
      }

      // Validate token structure
      const validation = await TokenValidationService.validateTokensSecurely(tokens);
      
      if (!validation.isValid) {
        setErrorDetails(validation);
        setIsValidToken(false);
        return;
      }

      // Enhanced debug logging for development only
      if (process.env.NODE_ENV === 'development') {
        console.group('🔐 Password Reset Token Validation');
        console.log('Token validation successful:', {
          tokenType: tokens.type,
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          hasTokenHash: !!tokens.tokenHash,
          accessTokenLength: tokens.accessToken?.length || 0
        });
        console.groupEnd();
      }

      // Store validated tokens and mark as valid
      setResetTokens(tokens);
      setErrorDetails(null);
      setIsValidToken(true);
      
    } catch (error: any) {
      const errorInfo: ValidationResult = {
        isValid: false,
        errorType: 'malformed_url',
        error: `Unexpected error during token validation: ${error.message}`,
        userMessage: 'There was a problem processing your reset link. Please try requesting a new password reset.'
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Unexpected validation error:', {
          message: error.message,
          stack: error.stack,
          url: typeof window !== 'undefined' ? window.location.href : 'N/A'
        });
      }
      
      setErrorDetails(errorInfo);
      setIsValidToken(false);
    }
  }, [searchParams]);

  useEffect(() => {
    validateTokens();

    // Cleanup function to reset validation state if component unmounts during validation
    return () => {
      setIsValidToken(null);
      setErrorDetails(null);
    };
  }, [validateTokens]);

  return {
    isValidToken,
    resetTokens,
    errorDetails,
    validateTokens
  };
}

/**
 * Simplified password update function using the service
 * Replaces the complex onSubmit logic in the reset password component
 */
export async function updatePasswordWithService(
  tokens: ResetTokens, 
  newPassword: string
): Promise<void> {
  if (!tokens) {
    throw new Error('INTERNAL_ERROR: No reset tokens available');
  }

  try {
    await TokenValidationService.updatePasswordSecurely(tokens, newPassword);
  } catch (error: any) {
    // Enhanced error handling with categorization and sanitization
    let userFriendlyMessage: string;
    let errorType: string;
    
    if (error.message?.startsWith('INTERNAL_ERROR:')) {
      errorType = 'internal';
      userFriendlyMessage = 'An internal error occurred. Please try again or request a new password reset.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = 'network';
      userFriendlyMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message?.includes('expired') || error.message?.includes('invalid') || error.message?.includes('used')) {
      errorType = 'token';
      userFriendlyMessage = error.message; // These are already user-friendly
    } else if (error.message?.includes('weak') || error.message?.includes('same')) {
      errorType = 'password';
      userFriendlyMessage = error.message; // These are already user-friendly
    } else {
      errorType = 'unknown';
      userFriendlyMessage = 'Failed to update password. Please try again or request a new password reset.';
    }
    
    // Comprehensive error logging for debugging (development only, no sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Password reset operation failed:', {
        errorType,
        userMessage: userFriendlyMessage,
        originalMessage: error.message,
        tokenInfo: {
          hasAccessToken: !!tokens.accessToken,
          accessTokenLength: tokens.accessToken?.length || 0,
          hasRefreshToken: !!tokens.refreshToken,
          refreshTokenLength: tokens.refreshToken?.length || 0,
          tokenFormat: tokens.type
        },
        timestamp: new Date().toISOString()
      });
    }
    
    throw new Error(userFriendlyMessage);
  }
}

/**
 * Example usage in a React component:
 * 
 * ```typescript
 * function ResetPasswordContent() {
 *   const { isValidToken, resetTokens, errorDetails } = usePasswordResetTokens();
 *   const [isLoading, setIsLoading] = useState(false);
 *   const [resetComplete, setResetComplete] = useState(false);
 *   const router = useRouter();
 * 
 *   async function onSubmit(values: { password: string }) {
 *     if (!resetTokens) return;
 *     
 *     setIsLoading(true);
 *     try {
 *       await updatePasswordWithService(resetTokens, values.password);
 *       setResetComplete(true);
 *       toast.success('Password updated successfully!');
 *       setTimeout(() => {
 *         router.push('/auth/login?reset=success');
 *       }, 2000);
 *     } catch (error: any) {
 *       toast.error(error.message);
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   }
 * 
 *   // Rest of component logic...
 * }
 * ```
 */