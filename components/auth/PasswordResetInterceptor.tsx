"use client";

import { useEffect } from 'react';
import { interceptPasswordResetTokens } from '@/lib/password-reset-url-interceptor';

/**
 * Password Reset Interceptor Component
 * 
 * This component runs early in the app lifecycle to intercept password reset tokens
 * before Supabase's detectSessionInUrl can process them automatically.
 * 
 * It should be included in the root layout or early in the component tree.
 */
export function PasswordResetInterceptor() {
  useEffect(() => {
    // Run interceptor immediately when component mounts
    interceptPasswordResetTokens();
  }, []);

  // This component renders nothing but performs the critical interception
  return null;
}