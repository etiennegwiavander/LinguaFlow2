"use client";

import { supabase } from './supabase';

/**
 * Auth Middleware for Password Reset
 * 
 * This middleware intercepts Supabase auth state changes and prevents
 * automatic login on password reset pages while allowing normal auth flows.
 */

let isPasswordResetPage = false;
let interceptedSession: any = null;

// Track if we're on a password reset page
export function setPasswordResetMode(enabled: boolean) {
  isPasswordResetPage = enabled;
  if (enabled) {
    console.log('🔒 Password reset mode enabled - intercepting auth state changes');
  }
}

// Get intercepted session data for manual processing
export function getInterceptedSession() {
  return interceptedSession;
}

// Clear intercepted session
export function clearInterceptedSession() {
  interceptedSession = null;
}

// Set up auth state change listener
let authListener: any = null;

export function initializeAuthMiddleware() {
  if (authListener) return; // Already initialized
  
  authListener = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔍 Auth state change:', { event, hasSession: !!session, isPasswordResetPage });
    
    if (isPasswordResetPage && event === 'SIGNED_IN' && session) {
      console.log('🔒 Intercepting auto-login on password reset page');
      
      // Store the session data for manual processing
      interceptedSession = session;
      
      // Immediately sign out to prevent auto-login
      await supabase.auth.signOut({ scope: 'local' });
      
      console.log('🔒 Auto-login prevented, session stored for manual processing');
      
      // Dispatch custom event to notify the reset page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('passwordResetSessionIntercepted', {
          detail: { session }
        }));
      }
    }
  });
  
  console.log('🔧 Auth middleware initialized');
}

// Cleanup
export function cleanupAuthMiddleware() {
  if (authListener) {
    authListener.data.subscription.unsubscribe();
    authListener = null;
  }
  isPasswordResetPage = false;
  interceptedSession = null;
}