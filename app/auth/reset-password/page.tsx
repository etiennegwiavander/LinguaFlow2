"use client";

import * as React from "react";
import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  supabaseResetPassword,
  createTemporaryResetSession,
  verifyResetTokenHash,
  updatePasswordWithReset,
  cleanupResetSession
} from "@/lib/supabase-reset-password";
import { toast } from "sonner";
import LandingLayout from "@/components/landing/LandingLayout";
import { ResetPasswordLoadingState, ResetPasswordSkeleton } from "@/components/auth/ResetPasswordLoadingStates";
import { 
  AccessibilityAnnouncement, 
  AccessibleProgress, 
  SkipLink,
  useFocusManagement,
  useHighContrastMode,
  useReducedMotion 
} from "@/components/auth/ResetPasswordAccessibility";
import { 
  performanceMonitor, 
  preloadResources,
  debounce 
} from "@/lib/password-reset-performance";

const formSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ResetPasswordContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetTokens, setResetTokens] = useState<{accessToken: string, refreshToken: string} | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);
  const [updateProgress, setUpdateProgress] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Accessibility and performance hooks
  const { focusElement, focusFirstError, announceToScreenReader } = useFocusManagement();
  const isHighContrast = useHighContrastMode();
  const prefersReducedMotion = useReducedMotion();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Enhanced error state management
  const [errorDetails, setErrorDetails] = useState<{
    type: 'missing_tokens' | 'invalid_tokens' | 'expired_tokens' | 'malformed_url' | 'auth_error' | null;
    message: string;
    userMessage: string;
  }>({ type: null, message: '', userMessage: '' });

  // Helper method to get user-friendly auth error messages
  const getAuthErrorMessage = React.useCallback((error: string, description?: string): string => {
    switch (error.toLowerCase()) {
      case 'access_denied':
        return 'Access was denied. This may happen if you clicked an old reset link. Please request a new password reset.';
      case 'invalid_request':
        return 'The reset link is malformed. Please check that you clicked the complete link from your email.';
      case 'unauthorized':
        return 'This reset link is not authorized. Please request a new password reset.';
      case 'server_error':
        return 'A server error occurred. Please try again in a few minutes or request a new password reset.';
      case 'temporarily_unavailable':
        return 'The service is temporarily unavailable. Please try again in a few minutes.';
      default:
        return description || 'An authentication error occurred. Please request a new password reset.';
    }
  }, []);

  // Helper method to validate JWT format (basic structure check)
  const isValidJWTFormat = React.useCallback((token: string): boolean => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }, []);

  // Optimized token validation with performance monitoring and caching
  const validateTokensFromUrl = useCallback(async () => {
    const timer = performanceMonitor.startTimer('Token Validation');
    
    try {
      setValidationProgress(10);
      
      // Extract tokens from URL
      let accessToken = searchParams.get('access_token');
      let refreshToken = searchParams.get('refresh_token');
      let tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      setValidationProgress(25);
      
      // Also check URL hash/fragment (Supabase sometimes uses this)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = accessToken || hashParams.get('access_token');
        refreshToken = refreshToken || hashParams.get('refresh_token');
        tokenHash = tokenHash || hashParams.get('token_hash');
      }
      
      setValidationProgress(40);
      
      // Enhanced debug logging for development only (no sensitive data)
      if (process.env.NODE_ENV === 'development') {
        console.group('🔐 Password Reset Token Validation');
        console.log('Token presence check:', {
          accessToken: accessToken ? `present (${accessToken.length} chars)` : 'missing',
          refreshToken: refreshToken ? `present (${refreshToken.length} chars)` : 'missing',
          tokenHash: tokenHash ? `present (${tokenHash.length} chars)` : 'missing',
          type: type || 'not specified',
          hasError: !!error,
          errorType: error || 'none',
          hashFragment: typeof window !== 'undefined' ? (window.location.hash ? 'present' : 'empty') : 'N/A',
          searchParamsCount: Array.from(searchParams.entries()).length
        });
        console.groupEnd();
      }

      // Check for explicit auth errors first
      if (error) {
        const errorInfo = {
          type: 'auth_error' as const,
          message: `Auth error: ${error} - ${errorDescription || 'No description'}`,
          userMessage: getAuthErrorMessage(error, errorDescription || undefined)
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.error('🚨 Auth error detected:', { error, errorDescription });
        }
        
        setErrorDetails(errorInfo);
        setIsValidToken(false);
        announceToScreenReader(`Error: ${errorInfo.userMessage}`, 'assertive');
        return;
      }

      setValidationProgress(60);

      // Validate token presence and format
      const hasStandardTokens = accessToken && refreshToken;
      const hasTokenHash = tokenHash;
      
      if (!hasStandardTokens && !hasTokenHash) {
        const errorInfo = {
          type: 'missing_tokens' as const,
          message: 'No valid reset tokens found in URL parameters or hash fragment',
          userMessage: 'This reset link appears to be incomplete. Please check that you clicked the full link from your email, or request a new password reset.'
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('❌ Missing tokens:', {
            searchParams: Object.fromEntries(searchParams.entries()),
            hashParams: typeof window !== 'undefined' && window.location.hash ? 
              Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)).entries()) : {}
          });
        }
        
        setErrorDetails(errorInfo);
        setIsValidToken(false);
        announceToScreenReader(`Error: ${errorInfo.userMessage}`, 'assertive');
        return;
      }

      setValidationProgress(80);

      // Perform basic format validation only (no API calls to prevent auto-login)
      if (hasStandardTokens) {
        // Basic JWT format validation for standard tokens
        if (!isValidJWTFormat(accessToken!) || !isValidJWTFormat(refreshToken!)) {
          const errorInfo = {
            type: 'invalid_tokens' as const,
            message: 'Tokens do not match expected JWT format',
            userMessage: 'This reset link is not in the correct format. Please request a new password reset.'
          };
          setErrorDetails(errorInfo);
          setIsValidToken(false);
          announceToScreenReader(`Error: ${errorInfo.userMessage}`, 'assertive');
          return;
        }
        
        setResetTokens({ accessToken: accessToken!, refreshToken: refreshToken! });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Standard format tokens validated successfully');
        }
      } else if (hasTokenHash) {
        // Basic validation for token hash
        if (!tokenHash || tokenHash.length < 10) {
          const errorInfo = {
            type: 'invalid_tokens' as const,
            message: 'Token hash is malformed or too short',
            userMessage: 'This reset link appears to be corrupted. Please request a new password reset.'
          };
          setErrorDetails(errorInfo);
          setIsValidToken(false);
          announceToScreenReader(`Error: ${errorInfo.userMessage}`, 'assertive');
          return;
        }
        
        // Store as accessToken for compatibility, empty refreshToken indicates token_hash format
        setResetTokens({ accessToken: tokenHash!, refreshToken: '' });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Token hash format validated successfully');
        }
      }

      setValidationProgress(100);

      // Clear any previous errors and mark as valid
      setErrorDetails({ type: null, message: '', userMessage: '' });
      setIsValidToken(true);
      announceToScreenReader('Reset link verified successfully. You can now enter your new password.', 'polite');
      
      // Focus on the password field after validation
      setTimeout(() => {
        focusElement('input[name="password"]');
      }, 100);
      
    } catch (error: any) {
      const errorInfo = {
        type: 'malformed_url' as const,
        message: `Unexpected error during token validation: ${error.message}`,
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
      announceToScreenReader(`Error: ${errorInfo.userMessage}`, 'assertive');
    } finally {
      timer.end();
    }
  }, [searchParams, announceToScreenReader, getAuthErrorMessage, isValidJWTFormat, focusElement]);

  // Debounced validation to prevent excessive API calls
  const debouncedValidation = useMemo(
    () => debounce(validateTokensFromUrl, 300),
    [validateTokensFromUrl]
  );

  useEffect(() => {
    // Preload resources for better performance
    preloadResources();
    
    // Run validation
    debouncedValidation();

    // Cleanup function to reset validation state if component unmounts during validation
    return () => {
      setIsValidToken(null);
      setErrorDetails({ type: null, message: '', userMessage: '' });
      setValidationProgress(0);
    };
  }, [debouncedValidation]);



  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setUpdateProgress(0);
    
    // Enhanced error tracking for password update flow
    const operationId = Date.now().toString(36);
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔄 Password Update Operation [${operationId}]`);
      console.log('Starting password update with tokens:', {
        hasAccessToken: !!resetTokens?.accessToken,
        hasRefreshToken: !!resetTokens?.refreshToken,
        tokenFormat: resetTokens?.refreshToken ? 'standard' : 'token_hash',
        passwordLength: values.password.length
      });
    }

    // Announce to screen readers
    announceToScreenReader('Updating your password, please wait...', 'polite');
    
    try {
      if (!resetTokens) {
        throw new Error('INTERNAL_ERROR: No reset tokens available');
      }

      const { accessToken, refreshToken } = resetTokens;
      setUpdateProgress(10);

      // SECURE TOKEN HANDLING - NO PERSISTENT SESSIONS
      let updateResult;
      
      if (refreshToken) {
        setUpdateProgress(20);
        // Standard access/refresh token format
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 Using standard token format for password update');
        }
        
        try {
          // Create a temporary session scope for password update only
          setUpdateProgress(30);
          const { data: sessionData, error: sessionError } = await createTemporaryResetSession(accessToken, refreshToken);

          setUpdateProgress(50);

          if (sessionError) {
            // Enhanced session error handling with specific categorization
            const errorCategory = categorizeSessionError(sessionError);
            
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Session creation failed:', {
                category: errorCategory.type,
                originalMessage: sessionError.message,
                code: sessionError.status || 'unknown'
              });
            }
            
            throw new Error(errorCategory.userMessage);
          }

          if (!sessionData.user) {
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Session created but no user data returned');
            }
            throw new Error('Reset link validation failed. Please request a new password reset.');
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Temporary session created successfully');
          }

          // Update the password within the temporary session scope
          setUpdateProgress(70);
          updateResult = await updatePasswordWithReset(values.password);

          setUpdateProgress(85);

          if (updateResult.error) {
            // Enhanced password update error handling
            const errorCategory = categorizePasswordError(updateResult.error);
            
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Password update failed:', {
                category: errorCategory.type,
                originalMessage: updateResult.error.message,
                code: updateResult.error.status || 'unknown'
              });
            }
            
            throw new Error(errorCategory.userMessage);
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Password updated successfully via standard tokens');
          }
        } catch (error) {
          // Ensure cleanup even if password update fails
          try {
            await cleanupResetSession();
            if (process.env.NODE_ENV === 'development') {
              console.log('🧹 Cleanup: Signed out successfully');
            }
          } catch (signOutError: any) {
            // Log sign out error but don't override the main error
            if (process.env.NODE_ENV === 'development') {
              console.error('⚠️ Cleanup warning: Sign out failed:', {
                message: signOutError.message,
                originalError: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
          throw error;
        }

        // CRITICAL SECURITY: Immediately sign out to prevent persistent login
        setUpdateProgress(95);
        await cleanupResetSession();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Security: Final sign out completed');
        }
      } else {
        setUpdateProgress(20);
        // Token hash format - use verifyOtp for secure token validation
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 Using token hash format for password update');
        }
        
        try {
          setUpdateProgress(30);
          const { data, error } = await verifyResetTokenHash(accessToken);

          setUpdateProgress(50);

          if (error) {
            // Enhanced verifyOtp error handling
            const errorCategory = categorizeVerifyOtpError(error);
            
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Token verification failed:', {
                category: errorCategory.type,
                originalMessage: error.message,
                code: error.status || 'unknown'
              });
            }
            
            throw new Error(errorCategory.userMessage);
          }

          if (!data.user) {
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Token verified but no user data returned');
            }
            throw new Error('Reset link validation failed. Please request a new password reset.');
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Token hash verified successfully');
          }

          // Update the password using the session from verifyOtp
          setUpdateProgress(70);
          updateResult = await updatePasswordWithReset(values.password);

          setUpdateProgress(85);

          if (updateResult.error) {
            // Enhanced password update error handling
            const errorCategory = categorizePasswordError(updateResult.error);
            
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Password update failed:', {
                category: errorCategory.type,
                originalMessage: updateResult.error.message,
                code: updateResult.error.status || 'unknown'
              });
            }
            
            throw new Error(errorCategory.userMessage);
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Password updated successfully via token hash');
          }
        } catch (error) {
          // Ensure cleanup even if password update fails
          try {
            await cleanupResetSession();
            if (process.env.NODE_ENV === 'development') {
              console.log('🧹 Cleanup: Signed out successfully');
            }
          } catch (signOutError: any) {
            // Log sign out error but don't override the main error
            if (process.env.NODE_ENV === 'development') {
              console.error('⚠️ Cleanup warning: Sign out failed:', {
                message: signOutError.message,
                originalError: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
          throw error;
        }

        // CRITICAL SECURITY: Immediately sign out to prevent persistent login
        setUpdateProgress(95);
        await cleanupResetSession();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Security: Final sign out completed');
        }
      }

      setUpdateProgress(100);

      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 Password reset completed successfully');
        console.groupEnd();
      }

      setResetComplete(true);
      announceToScreenReader('Password updated successfully! Redirecting to login page.', 'assertive');
      toast.success('Password updated successfully! You can now sign in with your new password.');
      
      // Redirect to login after a short delay
      const redirectDelay = prefersReducedMotion ? 1000 : 2000;
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, redirectDelay);
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
      
      toast.error(userFriendlyMessage);
      announceToScreenReader(`Error: ${userFriendlyMessage}`, 'assertive');
      
      // Focus on first form error if available
      setTimeout(() => {
        focusFirstError();
      }, 100);
      
      // Comprehensive error logging for debugging (development only, no sensitive data)
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Password reset operation failed:', {
          operationId,
          errorType,
          userMessage: userFriendlyMessage,
          originalMessage: error.message,
          stack: error.stack,
          tokenInfo: resetTokens ? {
            hasAccessToken: !!resetTokens.accessToken,
            accessTokenLength: resetTokens.accessToken?.length || 0,
            hasRefreshToken: !!resetTokens.refreshToken,
            refreshTokenLength: resetTokens.refreshToken?.length || 0,
            tokenFormat: resetTokens.refreshToken ? 'standard' : 'token_hash'
          } : 'no_tokens',
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          url: typeof window !== 'undefined' ? window.location.href : 'N/A'
        });
        console.groupEnd();
      }
    } finally {
      setIsLoading(false);
      setUpdateProgress(0);
    }
  }

  // Helper method to categorize session errors
  const categorizeSessionError = (error: any): { type: string; userMessage: string } => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('expired') || message.includes('exp')) {
      return {
        type: 'expired',
        userMessage: 'Your reset link has expired. Reset links are only valid for 1 hour. Please request a new password reset.'
      };
    } else if (message.includes('invalid') || message.includes('malformed')) {
      return {
        type: 'invalid',
        userMessage: 'This reset link is invalid or corrupted. Please request a new password reset.'
      };
    } else if (message.includes('used') || message.includes('consumed')) {
      return {
        type: 'used',
        userMessage: 'This reset link has already been used. Please request a new password reset if you still need to change your password.'
      };
    } else if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network',
        userMessage: 'Network error occurred. Please check your connection and try again.'
      };
    } else {
      return {
        type: 'unknown',
        userMessage: 'Reset link validation failed. Please request a new password reset.'
      };
    }
  };

  // Helper method to categorize verifyOtp errors
  const categorizeVerifyOtpError = (error: any): { type: string; userMessage: string } => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('expired')) {
      return {
        type: 'expired',
        userMessage: 'Your reset link has expired. Reset links are only valid for 1 hour. Please request a new password reset.'
      };
    } else if (message.includes('invalid')) {
      return {
        type: 'invalid',
        userMessage: 'This reset link is invalid. Please request a new password reset.'
      };
    } else if (message.includes('used') || message.includes('consumed')) {
      return {
        type: 'used',
        userMessage: 'This reset link has already been used. Please request a new password reset if you still need to change your password.'
      };
    } else if (message.includes('not found')) {
      return {
        type: 'not_found',
        userMessage: 'Reset link not found. It may have expired or been used already. Please request a new password reset.'
      };
    } else {
      return {
        type: 'unknown',
        userMessage: 'Token verification failed. Please request a new password reset.'
      };
    }
  };

  // Helper method to categorize password update errors
  const categorizePasswordError = (error: any): { type: string; userMessage: string } => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('weak') || message.includes('strength')) {
      return {
        type: 'weak',
        userMessage: 'Password is too weak. Please choose a stronger password with at least 6 characters, including letters and numbers.'
      };
    } else if (message.includes('same') || message.includes('identical')) {
      return {
        type: 'same',
        userMessage: 'New password must be different from your current password. Please choose a different password.'
      };
    } else if (message.includes('length') || message.includes('short')) {
      return {
        type: 'length',
        userMessage: 'Password must be at least 6 characters long. Please choose a longer password.'
      };
    } else if (message.includes('common') || message.includes('dictionary')) {
      return {
        type: 'common',
        userMessage: 'This password is too common. Please choose a more unique password.'
      };
    } else if (message.includes('rate') || message.includes('limit')) {
      return {
        type: 'rate_limit',
        userMessage: 'Too many password update attempts. Please wait a few minutes before trying again.'
      };
    } else {
      return {
        type: 'unknown',
        userMessage: 'Failed to update password. Please try again with a different password.'
      };
    }
  };

  if (isValidToken === null) {
    return (
      <LandingLayout>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <main id="main-content">
              <ResetPasswordLoadingState 
                type="validating" 
                message="Please wait while we verify your password reset link"
                progress={validationProgress}
              />
            </main>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (isValidToken === false) {
    // Enhanced error display with specific messaging based on error type
    const getErrorIcon = () => {
      switch (errorDetails.type) {
        case 'missing_tokens':
          return <AlertTriangle className="w-8 h-8 text-amber-600" />;
        case 'expired_tokens':
          return <AlertTriangle className="w-8 h-8 text-orange-600" />;
        case 'auth_error':
          return <AlertTriangle className="w-8 h-8 text-red-600" />;
        default:
          return <AlertTriangle className="w-8 h-8 text-red-600" />;
      }
    };

    const getErrorTitle = () => {
      switch (errorDetails.type) {
        case 'missing_tokens':
          return 'Incomplete reset link';
        case 'expired_tokens':
          return 'Reset link expired';
        case 'invalid_tokens':
          return 'Invalid reset link';
        case 'malformed_url':
          return 'Malformed reset link';
        case 'auth_error':
          return 'Authentication error';
        default:
          return 'Invalid reset link';
      }
    };

    const getErrorDescription = () => {
      switch (errorDetails.type) {
        case 'missing_tokens':
          return 'This reset link appears to be incomplete or corrupted';
        case 'expired_tokens':
          return 'This password reset link has expired';
        case 'invalid_tokens':
          return 'This password reset link is not valid';
        case 'malformed_url':
          return 'This reset link is not properly formatted';
        case 'auth_error':
          return 'An authentication error occurred';
        default:
          return 'This password reset link is invalid or has expired';
      }
    };

    const getHelpText = () => {
      switch (errorDetails.type) {
        case 'missing_tokens':
          return 'Make sure you clicked the complete link from your email. If you copied and pasted the link, ensure you got the entire URL.';
        case 'expired_tokens':
          return 'Reset links expire after 1 hour for security. Please request a new password reset.';
        case 'invalid_tokens':
          return 'This link may have been used already or is no longer valid. Please request a new password reset.';
        case 'malformed_url':
          return 'The link appears to be corrupted. Please try clicking the link from your email again, or request a new password reset.';
        case 'auth_error':
          return 'There was a problem with authentication. Please try requesting a new password reset.';
        default:
          return 'The reset link may have expired or been used already. Please request a new password reset.';
      }
    };

    return (
      <LandingLayout>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <main id="main-content">
              <Card className="w-full max-w-md cyber-card">
                <CardHeader className="space-y-2 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      {getErrorIcon()}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-red-600">
                    {getErrorTitle()}
                  </CardTitle>
                  <CardDescription>
                    {getErrorDescription()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <AccessibilityAnnouncement
                    type="error"
                    message={errorDetails.userMessage || getHelpText()}
                    id="error-announcement"
                  />

                {/* Additional troubleshooting tips for specific error types */}
                {errorDetails.type === 'missing_tokens' && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <strong>Troubleshooting tips:</strong>
                      <ul className="mt-2 ml-4 list-disc text-sm">
                        <li>Check your email for the complete reset link</li>
                        <li>Avoid copying/pasting - click the link directly</li>
                        <li>Make sure the link wasn&apos;t split across multiple lines</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {errorDetails.type === 'expired_tokens' && (
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <strong>Security Notice:</strong> Reset links expire after 1 hour to protect your account. 
                      This is a security feature to prevent unauthorized access.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col space-y-2">
                  <Button asChild className="w-full focus-cyber">
                    <Link href="/auth/forgot-password">
                      Request new reset link
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full focus-cyber">
                    <Link href="/auth/login">
                      Back to login
                    </Link>
                  </Button>
                </div>

                {/* Development-only error details */}
                {process.env.NODE_ENV === 'development' && errorDetails.message && (
                  <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <summary className="cursor-pointer font-medium">Debug Info (Development Only)</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-all">
                      Error Type: {errorDetails.type}
                      {'\n'}Message: {errorDetails.message}
                      {'\n'}URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                    </pre>
                  </details>
                )}
              </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (resetComplete) {
    return (
      <LandingLayout>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <main id="main-content">
              <ResetPasswordLoadingState 
                type="success" 
                message="Your password has been successfully updated. You can now sign in with your new password."
              />
              <div className="mt-4 flex justify-center">
                <Button asChild className="w-full max-w-md focus-cyber">
                  <Link href="/auth/login">
                    Continue to login
                  </Link>
                </Button>
              </div>
            </main>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <div className="page-container">
        <div className="page-background"></div>
        {!prefersReducedMotion && (
          <>
            <div className="floating-elements"></div>
            <div className="fixed top-40 right-20 w-32 h-32 bg-neon-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
            <div className="fixed bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '4s' }}></div>
          </>
        )}

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <main id="main-content">
            <Card className={`w-full max-w-md cyber-card ${!prefersReducedMotion ? 'animate-scale-in' : ''}`}>
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Image
                      src="/linguaflowfavicon.png"
                      alt="LinguaFlow Logo"
                      width={48}
                      height={60}
                      className="h-12 w-15"
                      priority
                    />
                    {!prefersReducedMotion && (
                      <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl"></div>
                    )}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  Reset your <span className="gradient-text">password</span>
                </CardTitle>
                <CardDescription>
                  Enter your new password below
                </CardDescription>
              </CardHeader>
            
              <CardContent>
                {isLoading && updateProgress > 0 && (
                  <div className="mb-4">
                    <AccessibleProgress
                      value={updateProgress}
                      label="Password Update Progress"
                      description="Securely updating your password..."
                    />
                  </div>
                )}
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="password">New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="password"
                                placeholder="Enter your new password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className="input-cyber focus-cyber"
                                aria-describedby="password-requirements"
                                aria-invalid={!!form.formState.errors.password}
                                disabled={isLoading}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-cyber"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <div id="password-requirements" className="text-xs text-muted-foreground mt-1">
                            Password must be at least 6 characters long
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                placeholder="Confirm your new password"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className="input-cyber focus-cyber"
                                aria-invalid={!!form.formState.errors.confirmPassword}
                                disabled={isLoading}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-cyber"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                                disabled={isLoading}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className={`w-full btn-cyber ${!prefersReducedMotion ? 'hover-lift' : ''}`} 
                      disabled={isLoading}
                      aria-describedby={isLoading ? "update-status" : undefined}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                    
                    {isLoading && (
                      <div id="update-status" className="sr-only" aria-live="polite">
                        Password update in progress, please wait...
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </LandingLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <LandingLayout>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <main id="main-content">
              <ResetPasswordSkeleton />
            </main>
          </div>
        </div>
      </LandingLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}