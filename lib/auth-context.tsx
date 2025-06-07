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
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password'
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
        if (path.startsWith('/auth/')) {
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
        if (window.location.pathname.startsWith('/auth/')) {
          router.replace('/dashboard');
        }
      } else {
        if (!UNPROTECTED_ROUTES.includes(window.location.pathname)) {
          router.replace('/auth/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting sign-in process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth sign-in error:', error);
        throw error;
      }

      console.log('✅ Auth sign-in successful, checking tutor profile...');

      // Check if user has a tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (tutorError) {
        console.error('❌ Error fetching tutor profile:', tutorError);
        throw tutorError;
      }

      if (!tutorData) {
        console.error('❌ No tutor profile found for user:', data.user.id);
        await supabase.auth.signOut();
        throw new Error('Unable to load user profile. Please contact support at support@example.com');
      }

      console.log('✅ Tutor profile found:', tutorData);
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('❌ Sign-in process failed:', error);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect email or password');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('📝 Starting sign-up process for:', email);
      
      // Check if email exists
      console.log('🔍 Checking if email already exists...');
      const { data: existingUser } = await supabase
        .from('tutors')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        console.log('❌ Email already exists in tutors table');
        throw new Error('An account with this email already exists. Please login or use a different email address.');
      }

      console.log('✅ Email is available, proceeding with auth signup...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth signup error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('❌ No user data returned from auth signup');
        throw new Error('Failed to create user account');
      }

      console.log('✅ Auth signup successful, user ID:', data.user.id);
      console.log('📝 Creating tutor profile...');

      // Create tutor record
      const tutorRecord = {
        id: data.user.id,
        email: email,
        is_admin: false,
      };

      console.log('📝 Inserting tutor record:', tutorRecord);
      
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .insert([tutorRecord])
        .select()
        .single();

      if (tutorError) {
        console.error('❌ Failed to create tutor record:', tutorError);
        console.log('🧹 Cleaning up auth user...');
        
        // Clean up the auth user if tutor creation fails
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup auth user:', cleanupError);
        }
        
        throw new Error(`Failed to create tutor profile: ${tutorError.message}`);
      }

      console.log('✅ Tutor record created successfully:', tutorData);
      console.log('🔐 Auto-signing in user...');

      // Auto-login after successful registration
      await signIn(email, password);
    } catch (error: any) {
      console.error('❌ Sign-up process failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Sign-out successful');
      router.replace('/auth/login');
    } catch (error: any) {
      console.error('❌ Sign-out failed:', error);
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