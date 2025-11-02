'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, supabaseRequest } from './supabase';
import { SimpleWelcomeEmailService } from './simple-welcome-email';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { },
  signUp: async () => { },
  signOut: async () => { },
});

const UNPROTECTED_ROUTES = [
  '/',
  '/pricing',
  '/faq',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/reset-password-simple',
  '/auth/deletion-scheduled',
  '/auth/recover-account',
  '/calendar', // Added to prevent premature redirects during OAuth
  '/terms',
  '/privacy',
  '/admin-portal/login' // Allow admin portal login page
];

// Function to check if a path should be unprotected
const isUnprotectedRoute = (path: string): boolean => {
  // Check exact matches first
  if (UNPROTECTED_ROUTES.includes(path)) {
    return true;
  }

  // Check for shared lesson routes (any path starting with /shared-lesson/)
  if (path.startsWith('/shared-lesson/')) {
    return true;
  }

  // Check for admin portal routes (any path starting with /admin-portal/)
  if (path.startsWith('/admin-portal/')) {
    return true;
  }

  return false;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Proactive session refresh to prevent JWT expiration
  const refreshSessionProactively = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // If token expires in less than 10 minutes, refresh it
        if (timeUntilExpiry < 10 * 60 * 1000) {
          console.log('Token expires soon, refreshing proactively...');
          const { data: { session: newSession }, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error('Proactive refresh failed:', error);
            // Don't throw error here, let normal flow handle it
          } else if (newSession) {
            console.log('Session refreshed proactively');
            setUser(newSession.user);
          }
        }
      }
    } catch (error) {
      console.warn('Proactive session refresh failed:', error);
      // Don't throw error, let normal auth flow handle expired tokens
    }
  }, []);

  // Set up interval for proactive session refresh
  useEffect(() => {
    // Check session every 5 minutes
    const interval = setInterval(refreshSessionProactively, 5 * 60 * 1000);

    // Also check immediately if user is logged in
    if (user) {
      refreshSessionProactively();
    }

    return () => clearInterval(interval);
  }, [user, refreshSessionProactively]);

  useEffect(() => {
    let path = window.location.pathname;
    // Normalize path by removing trailing slash if it's not the root
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }

    // CRITICAL: Completely skip auth processing for password reset
    if (path === '/auth/reset-password' || path === '/auth/reset-password-simple') {
      
      setLoading(false);
      setUser(null); // Ensure no user is set
      return;
    }
    
    // Check if password reset is active (more reliable than URL parsing)
    const isPasswordResetActive = typeof window !== 'undefined' && 
      window.localStorage.getItem('password-reset-active') === 'true';
    
    // If password reset is active, completely skip auth processing
    if (isPasswordResetActive) {
      console.log('🚫 Auth context: Password reset active, skipping auth processing');
      setLoading(false);
      setUser(null); // Ensure no user is set
      return;
    }

    // Get initial session only if not password reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Check if we need to redirect
      if (session?.user) {
        // User is logged in
        if (path.startsWith('/auth/') || path === '/') {
          router.replace('/dashboard');
        }
      } else {
        // User is not logged in
        if (!isUnprotectedRoute(path)) {
          router.replace('/auth/login');
        }
      }
    });

    // Listen for auth changes only if not password reset
    let subscription: any = null;
    
    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      let currentPath = window.location.pathname;
      // Normalize path by removing trailing slash if it's not the root
      if (currentPath.endsWith('/') && currentPath.length > 1) {
        currentPath = currentPath.slice(0, -1);
      }
      // CRITICAL: Always check if we're on password reset page
      if (currentPath === '/auth/reset-password' || currentPath === '/auth/reset-password-simple') {
        return;
      }
      
      // Check if password reset is active
      const isCurrentPasswordResetActive = typeof window !== 'undefined' && 
        window.localStorage.getItem('password-reset-active') === 'true';

      if (isCurrentPasswordResetActive) {
        return;
      }
      
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle navigation based on auth state
      if (session?.user) {
        if (currentPath.startsWith('/auth/') || currentPath === '/') {
          router.replace('/dashboard');
        }
      } else {
        if (!isUnprotectedRoute(currentPath)) {
          router.replace('/auth/login');
        }
      }
    });
    
    subscription = authListener.data.subscription;

    return () => subscription?.unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if user has a tutor profile using enhanced request wrapper
      let tutorData = null;
      let tutorError = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        const result = await supabaseRequest(async () =>
          await supabase
            .from('tutors')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle()
        );

        tutorData = result.data;
        tutorError = result.error;

        if (!tutorError) {
          break; // Success!
        }

        // If it's an infinite recursion error, wait and retry
        if (tutorError.message.includes('infinite recursion')) {
          console.warn(`Retry ${retryCount + 1}/${maxRetries} for profile loading due to recursion error`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          retryCount++;
        } else {
          break; // Different error, don't retry
        }
      }

      if (tutorError) {
        await supabase.auth.signOut();
        
        if (tutorError.message.includes('infinite recursion')) {
          throw new Error('Login temporarily unavailable due to system configuration. Please try again in a few minutes or contact support.');
        }
        
        throw new Error(`Unable to load user profile: ${tutorError.message}. Please contact support at support@example.com`);
      }

      if (!tutorData) {
        await supabase.auth.signOut();
        throw new Error('Unable to load user profile. Your account may be incomplete. Please contact support at support@example.com');
      }

      router.replace('/dashboard');
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect email or password');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string) => {
    try {
      // First, check if there's already an auth user with this email
      // This helps us handle the "User already registered" case
      let existingAuthUser = null;
      try {
        const { data: signInAttempt } = await supabase.auth.signInWithPassword({
          email,
          password: 'dummy-password' // This will fail but tell us if user exists
        });
      } catch (signInError: any) {
        if (signInError.message && !signInError.message.includes('Invalid login credentials')) {
          // User exists but password is wrong, which means user is already registered
          throw new Error('An account with this email already exists. Please login or use the forgot password option.');
        }
      }

      // Check if email exists in tutors table
      const { data: existingTutor } = await supabase
        .from('tutors')
        .select('email, id')
        .eq('email', email)
        .maybeSingle();

      if (existingTutor) {
        throw new Error('An account with this email already exists. Please login or use a different email address.');
      }

      // Attempt to create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please login or use the forgot password option.');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      // Create tutor record with retry logic
      const tutorRecord = {
        id: data.user.id,
        email: email,
        is_admin: false,
        first_name: firstName || null,
        last_name: null,
      };

      let tutorData = null;
      let tutorError = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        const result = await supabase
          .from('tutors')
          .insert([tutorRecord])
          .select()
          .single();

        tutorData = result.data;
        tutorError = result.error;

        if (!tutorError) {
          break; // Success!
        }

        // If it's an infinite recursion error, wait and retry
        if (tutorError.message.includes('infinite recursion')) {
          console.warn(`Retry ${retryCount + 1}/${maxRetries} for tutor creation due to recursion error`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          retryCount++;
        } else {
          break; // Different error, don't retry
        }
      }

      if (tutorError) {
        // Clean up the auth user if tutor creation fails
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.warn('Failed to cleanup auth user after tutor creation failure');
        }

        if (tutorError.message.includes('infinite recursion')) {
          throw new Error('Registration temporarily unavailable due to system configuration. Please try again in a few minutes or contact support.');
        }

        throw new Error(`Failed to create tutor profile: ${tutorError.message}`);
      }

      // Send welcome email to new tutor using simple email service
      // This is now handled at the application level instead of database triggers
      try {
        const emailResult = await SimpleWelcomeEmailService.sendWelcomeEmail(email, {
          firstName: tutorData?.first_name || undefined, // Will fallback to "Tutor" in email service
          lastName: tutorData?.last_name || undefined,
          userId: tutorData?.id
        });
        
        if (emailResult.success) {
          console.log('✅ Welcome email sent successfully');
        } else {
          console.warn('⚠️ Welcome email failed:', emailResult.error);
        }
      } catch (emailError) {
        // Don't fail registration if email fails, just log it
        console.warn('Failed to send welcome email:', emailError);
        // Registration should still succeed even if email fails
      }

      // Auto-login after successful registration
      await signIn(email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};