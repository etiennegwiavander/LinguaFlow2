import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a specialized Supabase client for password reset that doesn't auto-detect sessions
// This prevents automatic login when users click reset links
export const supabaseResetPassword = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Don't automatically refresh tokens
    autoRefreshToken: false,
    // Don't persist session in localStorage
    persistSession: false,
    // CRITICAL: Don't detect session in URL to prevent auto-login
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web-reset-password',
    },
  },
});

// Helper function to create a temporary session for password reset only
export const createTemporaryResetSession = async (accessToken: string, refreshToken: string) => {
  try {
    const { data, error } = await supabaseResetPassword.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Helper function to verify token hash for password reset
export const verifyResetTokenHash = async (tokenHash: string) => {
  try {
    const { data, error } = await supabaseResetPassword.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery'
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Helper function to update password with temporary session
export const updatePasswordWithReset = async (newPassword: string) => {
  try {
    const { data, error } = await supabaseResetPassword.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Helper function to ensure cleanup after password reset
export const cleanupResetSession = async () => {
  try {
    await supabaseResetPassword.auth.signOut();
    return { error: null };
  } catch (error) {
    return { error };
  }
};