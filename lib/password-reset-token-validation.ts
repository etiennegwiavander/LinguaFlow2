/**
 * Password Reset Token Validation Service
 * 
 * Centralized service for secure token validation and password reset operations.
 * Supports multiple token formats (standard and token_hash) while maintaining security.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.4
 */

import { supabase } from '@/lib/supabase';

// TypeScript interfaces for token structures
export interface ResetTokens {
  accessToken: string;
  refreshToken?: string;
  tokenHash?: string;
  type: 'standard' | 'hash';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'missing_tokens' | 'invalid_tokens' | 'expired_tokens' | 'malformed_url' | 'auth_error';
  userMessage?: string;
}

export interface PasswordUpdateRequest {
  tokens: ResetTokens;
  newPassword: string;
}

export interface ErrorCategory {
  type: string;
  userMessage: string;
}

/**
 * Token Validation Service
 * Provides centralized, secure token handling for password reset flows
 */
export class TokenValidationService {
  
  /**
   * Extract tokens from URL parameters and hash fragments
   * Supports both query parameters and URL hash formats
   */
  static extractTokensFromUrl(searchParams: URLSearchParams, hash?: string): ResetTokens | null {
    // Extract from search parameters
    let accessToken = searchParams.get('access_token');
    let refreshToken = searchParams.get('refresh_token');
    let tokenHash = searchParams.get('token_hash');
    
    // Also check URL hash/fragment (Supabase sometimes uses this)
    if (hash) {
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
      accessToken = accessToken || hashParams.get('access_token');
      refreshToken = refreshToken || hashParams.get('refresh_token');
      tokenHash = tokenHash || hashParams.get('token_hash');
    }
    
    // Determine token format and validate presence
    const hasStandardTokens = accessToken && refreshToken;
    const hasTokenHash = tokenHash;
    
    if (!hasStandardTokens && !hasTokenHash) {
      return null;
    }
    
    if (hasStandardTokens) {
      return {
        accessToken: accessToken!,
        refreshToken: refreshToken!,
        type: 'standard'
      };
    } else if (hasTokenHash) {
      return {
        accessToken: tokenHash!,
        tokenHash: tokenHash!,
        type: 'hash'
      };
    }
    
    return null;
  }
  
  /**
   * Validate JWT token format (basic structure check)
   */
  static isValidJWTFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
  
  /**
   * Validate token structure and format without creating sessions
   */
  static validateTokenStructure(tokens: ResetTokens): ValidationResult {
    try {
      if (tokens.type === 'standard') {
        // Validate standard token format
        if (!tokens.accessToken || tokens.accessToken.length < 10) {
          return {
            isValid: false,
            errorType: 'invalid_tokens',
            error: 'Access token is malformed or too short',
            userMessage: 'This reset link appears to be corrupted. Please request a new password reset.'
          };
        }
        
        if (!tokens.refreshToken || tokens.refreshToken.length < 10) {
          return {
            isValid: false,
            errorType: 'invalid_tokens',
            error: 'Refresh token is malformed or too short',
            userMessage: 'This reset link appears to be corrupted. Please request a new password reset.'
          };
        }
        
        // Validate JWT structure
        if (!this.isValidJWTFormat(tokens.accessToken) || !this.isValidJWTFormat(tokens.refreshToken)) {
          return {
            isValid: false,
            errorType: 'invalid_tokens',
            error: 'Tokens do not match expected JWT format',
            userMessage: 'This reset link is not in the correct format. Please request a new password reset.'
          };
        }
      } else if (tokens.type === 'hash') {
        // Validate token hash format
        if (!tokens.tokenHash || tokens.tokenHash.length < 10) {
          return {
            isValid: false,
            errorType: 'invalid_tokens',
            error: 'Token hash is malformed or too short',
            userMessage: 'This reset link appears to be corrupted. Please request a new password reset.'
          };
        }
      }
      
      return { isValid: true };
    } catch (error: any) {
      return {
        isValid: false,
        errorType: 'malformed_url',
        error: `Token structure validation failed: ${error.message}`,
        userMessage: 'There was a problem processing your reset link. Please try requesting a new password reset.'
      };
    }
  }
  
  /**
   * Validate tokens securely without creating persistent sessions
   * This method only validates token structure, not server-side validity
   */
  static async validateTokensSecurely(tokens: ResetTokens): Promise<ValidationResult> {
    // First validate token structure
    const structureValidation = this.validateTokenStructure(tokens);
    if (!structureValidation.isValid) {
      return structureValidation;
    }
    
    // For security, we don't validate tokens server-side here to avoid creating sessions
    // Server-side validation happens during password update operations
    return { isValid: true };
  }
  
  /**
   * Update password securely using validated tokens
   * Ensures immediate sign-out after password update
   */
  static async updatePasswordSecurely(tokens: ResetTokens, newPassword: string): Promise<void> {
    const operationId = Date.now().toString(36);
    
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔄 Secure Password Update Operation [${operationId}]`);
      console.log('Token format:', tokens.type);
      console.log('Password length:', newPassword.length);
    }
    
    try {
      let updateResult;
      
      if (tokens.type === 'standard') {
        // Standard access/refresh token format
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 Using standard token format for password update');
        }
        
        try {
          // Create a temporary session scope for password update only
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken!,
          });

          if (sessionError) {
            const errorCategory = this.categorizeSessionError(sessionError);
            
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
          updateResult = await supabase.auth.updateUser({
            password: newPassword
          });

          if (updateResult.error) {
            const errorCategory = this.categorizePasswordError(updateResult.error);
            
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
            await supabase.auth.signOut();
            if (process.env.NODE_ENV === 'development') {
              console.log('🧹 Cleanup: Signed out successfully');
            }
          } catch (signOutError: any) {
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
        await supabase.auth.signOut();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Security: Final sign out completed');
        }
      } else if (tokens.type === 'hash') {
        // Token hash format - use verifyOtp for secure token validation
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 Using token hash format for password update');
        }
        
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokens.tokenHash!,
            type: 'recovery'
          });

          if (error) {
            const errorCategory = this.categorizeVerifyOtpError(error);
            
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
          updateResult = await supabase.auth.updateUser({
            password: newPassword
          });

          if (updateResult.error) {
            const errorCategory = this.categorizePasswordError(updateResult.error);
            
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
            await supabase.auth.signOut();
            if (process.env.NODE_ENV === 'development') {
              console.log('🧹 Cleanup: Signed out successfully');
            }
          } catch (signOutError: any) {
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
        await supabase.auth.signOut();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Security: Final sign out completed');
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 Password reset completed successfully');
        console.groupEnd();
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Password update operation failed:', {
          operationId,
          originalMessage: error.message,
          tokenFormat: tokens.type,
          timestamp: new Date().toISOString()
        });
        console.groupEnd();
      }
      throw error;
    }
  }
  
  /**
   * Categorize session errors for user-friendly messaging
   */
  static categorizeSessionError(error: any): ErrorCategory {
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
  }
  
  /**
   * Categorize verifyOtp errors for user-friendly messaging
   */
  static categorizeVerifyOtpError(error: any): ErrorCategory {
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
  }
  
  /**
   * Categorize password update errors for user-friendly messaging
   */
  static categorizePasswordError(error: any): ErrorCategory {
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
  }
  
  /**
   * Parse URL parameters and extract auth errors
   */
  static extractAuthErrors(searchParams: URLSearchParams): { error?: string; errorDescription?: string } {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    return { error: error || undefined, errorDescription: errorDescription || undefined };
  }
  
  /**
   * Get user-friendly auth error messages
   */
  static getAuthErrorMessage(error: string, description?: string): string {
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
  }
}

/**
 * Convenience function for extracting tokens from browser environment
 */
export function extractTokensFromBrowser(): ResetTokens | null {
  if (typeof window === 'undefined') return null;
  
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  return TokenValidationService.extractTokensFromUrl(searchParams, hash);
}

/**
 * Convenience function for validating URL parameters for auth errors
 */
export function validateUrlForAuthErrors(searchParams: URLSearchParams): ValidationResult | null {
  const { error, errorDescription } = TokenValidationService.extractAuthErrors(searchParams);
  
  if (error) {
    return {
      isValid: false,
      errorType: 'auth_error',
      error: `Auth error: ${error} - ${errorDescription || 'No description'}`,
      userMessage: TokenValidationService.getAuthErrorMessage(error, errorDescription)
    };
  }
  
  return null;
}