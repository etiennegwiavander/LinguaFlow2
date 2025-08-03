import { useState, useCallback } from 'react';
import { supabaseRequest } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseSupabaseQueryOptions {
  showErrorToast?: boolean;
  errorMessage?: string;
}

export function useSupabaseQuery<T>(options: UseSupabaseQueryOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await supabaseRequest(queryFn);
      
      if (result.error) {
        const errorMessage = options.errorMessage || result.error.message || 'An error occurred';
        setError(errorMessage);
        
        if (options.showErrorToast !== false) {
          toast.error(errorMessage);
        }
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = options.errorMessage || err.message || 'An unexpected error occurred';
      setError(errorMessage);
      
      if (options.showErrorToast !== false) {
        toast.error(errorMessage);
      }
      
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [options.showErrorToast, options.errorMessage]);

  return {
    execute,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Specialized hooks for common operations
export function useSupabaseMutation<T>(options: UseSupabaseQueryOptions = {}) {
  return useSupabaseQuery<T>({
    showErrorToast: true,
    ...options
  });
}

export function useSupabaseFetch<T>(options: UseSupabaseQueryOptions = {}) {
  return useSupabaseQuery<T>({
    showErrorToast: false,
    ...options
  });
}