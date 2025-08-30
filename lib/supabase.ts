import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with automatic token refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh tokens when they're about to expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // SECURITY FIX: Disable automatic session detection to prevent auto-login on password reset
    detectSessionInUrl: false,
  },
  // Global request configuration
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});

// Create a separate client for OAuth flows that need URL session detection
export const supabaseOAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Only enabled for OAuth flows
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-oauth',
    },
  },
});

// Enhanced error handling for JWT expiration
export const handleSupabaseError = async (error: any, retryFn?: () => Promise<any>) => {
  // Check if error is due to JWT expiration
  if (error?.message?.includes('JWT expired') || 
      error?.message?.includes('Invalid JWT') ||
      error?.status === 401) {
    
    console.warn('JWT token expired, attempting to refresh...');
    
    try {
      // Force refresh the session
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw refreshError;
      }
      
      if (session && retryFn) {
        console.log('Session refreshed successfully, retrying request...');
        // Retry the original request with new token
        return await retryFn();
      }
      
      return { data: null, error: null };
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      // Redirect to login on refresh failure
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw refreshError;
    }
  }
  
  // Re-throw non-JWT errors
  throw error;
};

// Wrapper function for Supabase requests with automatic retry on JWT expiration
export const supabaseRequest = async <T>(
  requestFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await requestFn();
    
    // If there's an error, handle it
    if (result.error) {
      return await handleSupabaseError(result.error, requestFn);
    }
    
    return result;
  } catch (error) {
    return await handleSupabaseError(error, requestFn);
  }
};

export type Database = {
  public: {
    Tables: {
      tutors: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
        };
      };
      students: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          avatar_url: string | null;
          target_language: string;
          native_language: string | null;
          level: string;
          tutor_id: string;
          end_goals: string | null;
          grammar_weaknesses: string | null;
          vocabulary_gaps: string | null;
          pronunciation_challenges: string | null;
          conversational_fluency_barriers: string | null;
          learning_styles: string[] | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          avatar_url?: string | null;
          target_language: string;
          native_language?: string | null;
          level: string;
          tutor_id: string;
          end_goals?: string | null;
          grammar_weaknesses?: string | null;
          vocabulary_gaps?: string | null;
          pronunciation_challenges?: string | null;
          conversational_fluency_barriers?: string | null;
          learning_styles?: string[] | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          avatar_url?: string | null;
          target_language?: string;
          native_language?: string | null;
          level?: string;
          tutor_id?: string;
          end_goals?: string | null;
          grammar_weaknesses?: string | null;
          vocabulary_gaps?: string | null;
          pronunciation_challenges?: string | null;
          conversational_fluency_barriers?: string | null;
          learning_styles?: string[] | null;
          notes?: string | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          created_at: string;
          student_id: string;
          tutor_id: string;
          date: string;
          status: string;
          materials: string[];
          notes: string | null;
          previous_challenges: string[] | null;
          generated_lessons: string[] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          student_id: string;
          tutor_id: string;
          date: string;
          status: string;
          materials: string[];
          notes?: string | null;
          previous_challenges?: string[] | null;
          generated_lessons?: string[] | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          student_id?: string;
          tutor_id?: string;
          date?: string;
          status?: string;
          materials?: string[];
          notes?: string | null;
          previous_challenges?: string[] | null;
          generated_lessons?: string[] | null;
        };
      };
      google_tokens: {
        Row: {
          id: string;
          tutor_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tutor_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scope?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          tutor_id: string;
          google_event_id: string;
          summary: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          attendees: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          google_event_id: string;
          summary: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          location?: string | null;
          attendees?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tutor_id?: string;
          google_event_id?: string;
          summary?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          attendees?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shared_lessons: {
        Row: {
          id: string;
          lesson_id: string;
          student_name: string;
          lesson_title: string;
          shared_at: string;
          expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          student_name: string;
          lesson_title: string;
          shared_at?: string;
          expires_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          student_name?: string;
          lesson_title?: string;
          shared_at?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};