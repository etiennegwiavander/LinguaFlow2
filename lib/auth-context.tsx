'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

const UNPROTECTED_ROUTES = [
  '/',
  '/pricing',
  '/faq',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/deletion-scheduled',
  '/auth/recover-account',
  '/calendar', // Added to prevent premature redirects during OAuth
  '/terms',
  '/privacy'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Check if we need to redirect
      const path = window.location.pathname;
      if (session?.user) {
        // User is logged in
        if (path.startsWith('/auth/') || path === '/') {
          router.replace('/dashboard');
        }
      } else {
        // User is not logged in
        if (!UNPROTECTED_ROUTES.includes(path)) {
          router.replace('/auth/login');
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle navigation based on auth state
      if (session?.user) {
        if (window.location.pathname.startsWith('/auth/') || window.location.pathname === '/') {
          router.replace('/dashboard');
        }
      } else {
        const currentPath = window.location.pathname;
        if (!UNPROTECTED_ROUTES.includes(currentPath)) {
          router.replace('/auth/login');
        }
      }
    });

    return () => subscription.unsubscribe();
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

      // Check if user has a tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (tutorError) {
        throw tutorError;
      }

      if (!tutorData) {
        await supabase.auth.signOut();
        throw new Error('Unable to load user profile. Please contact support at support@example.com');
      }

      router.replace('/dashboard');
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect email or password');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Check if email exists
      const { data: existingUser } = await supabase
        .from('tutors')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please login or use a different email address.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      // Create tutor record
      const tutorRecord = {
        id: data.user.id,
        email: email,
        is_admin: false,
      };
      
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .insert([tutorRecord])
        .select()
        .single();

      if (tutorError) {
        // Clean up the auth user if tutor creation fails
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          // Error handling without console.error
        }
        
        throw new Error(`Failed to create tutor profile: ${tutorError.message}`);
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