import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    };
  };
};