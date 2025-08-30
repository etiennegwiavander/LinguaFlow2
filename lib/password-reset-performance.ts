import { supabase } from '@/lib/supabase';

// Token validation cache to minimize API calls
const tokenValidationCache = new Map<string, {
  isValid: boolean;
  timestamp: number;
  error?: string;
}>();

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Debounce utility for token validation
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Optimized token validation with caching
export const validateTokensOptimized = async (tokens: {
  accessToken: string;
  refreshToken?: string;
}): Promise<{ isValid: boolean; error?: string; cached?: boolean }> => {
  const cacheKey = `${tokens.accessToken}_${tokens.refreshToken || ''}`;
  
  // Check cache first
  const cached = tokenValidationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return { 
      isValid: cached.isValid, 
      error: cached.error,
      cached: true 
    };
  }

  try {
    let result: { isValid: boolean; error?: string };

    if (tokens.refreshToken) {
      // Standard token format - lightweight validation
      result = await validateStandardTokens(tokens.accessToken, tokens.refreshToken);
    } else {
      // Token hash format - lightweight validation
      result = await validateTokenHash(tokens.accessToken);
    }

    // Cache the result
    tokenValidationCache.set(cacheKey, {
      isValid: result.isValid,
      error: result.error,
      timestamp: Date.now()
    });

    return { ...result, cached: false };
  } catch (error: any) {
    const errorResult = {
      isValid: false,
      error: error.message || 'Validation failed'
    };

    // Cache error result for shorter duration
    tokenValidationCache.set(cacheKey, {
      ...errorResult,
      timestamp: Date.now() - (CACHE_DURATION - 60000) // Cache errors for 1 minute
    });

    return { ...errorResult, cached: false };
  }
};

// Lightweight token format validation without creating sessions
const validateStandardTokens = async (
  accessToken: string, 
  refreshToken: string
): Promise<{ isValid: boolean; error?: string }> => {
  // Basic JWT format validation
  if (!isValidJWTFormat(accessToken) || !isValidJWTFormat(refreshToken)) {
    return { isValid: false, error: 'Invalid token format' };
  }

  try {
    // Use getUser to validate tokens without creating persistent sessions
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      return { isValid: false, error: categorizeAuthError(error.message) };
    }

    if (!data.user) {
      return { isValid: false, error: 'Invalid user token' };
    }

    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
};

// Lightweight token hash validation
const validateTokenHash = async (
  tokenHash: string
): Promise<{ isValid: boolean; error?: string }> => {
  if (!tokenHash || tokenHash.length < 10) {
    return { isValid: false, error: 'Invalid token hash format' };
  }

  // For token hash, we can only validate format here
  // Actual validation happens during password update
  return { isValid: true };
};

// JWT format validation utility
const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Error categorization for better user feedback
const categorizeAuthError = (errorMessage: string): string => {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('expired') || message.includes('exp')) {
    return 'Token has expired';
  } else if (message.includes('invalid') || message.includes('malformed')) {
    return 'Invalid token format';
  } else if (message.includes('used') || message.includes('consumed')) {
    return 'Token has already been used';
  } else if (message.includes('network') || message.includes('fetch')) {
    return 'Network error occurred';
  } else {
    return 'Token validation failed';
  }
};

// Performance monitoring utilities
export const performanceMonitor = {
  startTimer: (operation: string) => {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ ${operation} took ${duration.toFixed(2)}ms`);
        }
        return duration;
      }
    };
  },

  measureAsync: async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
    const timer = performanceMonitor.startTimer(operation);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }
};

// Preload critical resources
export const preloadResources = () => {
  // Preload Supabase auth endpoints
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    document.head.appendChild(link);
  }
};

// Clear validation cache (useful for testing or memory management)
export const clearValidationCache = () => {
  tokenValidationCache.clear();
};

// Get cache statistics (for debugging)
export const getCacheStats = () => {
  return {
    size: tokenValidationCache.size,
    entries: Array.from(tokenValidationCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 20) + '...', // Truncate for security
      isValid: value.isValid,
      age: Date.now() - value.timestamp,
      error: value.error
    }))
  };
};