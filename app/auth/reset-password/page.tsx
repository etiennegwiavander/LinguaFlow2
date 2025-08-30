"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { 
  initializeAuthMiddleware, 
  setPasswordResetMode, 
  getInterceptedSession,
  clearInterceptedSession,
  cleanupAuthMiddleware 
} from "@/lib/auth-middleware";
import { toast } from "sonner";
import LandingLayout from "@/components/landing/LandingLayout";

const formSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ResetPasswordContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidTokens, setHasValidTokens] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetTokens, setResetTokens] = useState<{
    accessToken?: string;
    refreshToken?: string;
    tokenHash?: string;
  } | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Initialize auth middleware and handle session interception
  useEffect(() => {
    // Initialize the auth middleware
    initializeAuthMiddleware();
    setPasswordResetMode(true);
    
    // Listen for intercepted sessions
    const handleInterceptedSession = (event: any) => {
      console.log('🔒 Received intercepted session:', event.detail);
      const session = event.detail.session;
      
      if (session?.access_token && session?.refresh_token) {
        setResetTokens({
          accessToken: session.access_token,
          refreshToken: session.refresh_token
        });
        setHasValidTokens(true);
        setIsValidating(false);
        console.log('✅ Session tokens extracted successfully');
      }
    };
    
    window.addEventListener('passwordResetSessionIntercepted', handleInterceptedSession);
    
    // Also try to extract tokens from URL as fallback
    const extractFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log('🔍 Debug - URL Analysis:', {
        fullUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        searchParams: Object.fromEntries(urlParams.entries()),
        hashParams: Object.fromEntries(hashParams.entries())
      });
      
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      const type = urlParams.get('type') || hashParams.get('type');
      
      console.log('🔍 Debug - Extracted tokens:', {
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
        tokenHash: tokenHash ? `${tokenHash.substring(0, 20)}...` : null,
        error,
        errorDescription,
        type
      });
      
      // Clean URL to prevent re-processing
      if (accessToken || tokenHash || error) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      // Check for auth errors
      if (error) {
        setErrorMessage(`Authentication error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        setIsValidating(false);
        return;
      }
      
      // If we have tokens from URL, use them
      if (accessToken || tokenHash) {
        if (accessToken && refreshToken) {
          setResetTokens({ accessToken, refreshToken });
        } else if (tokenHash) {
          setResetTokens({ tokenHash });
        }
        setHasValidTokens(true);
        setIsValidating(false);
        console.log('✅ URL tokens extracted successfully');
        return;
      }
      
      // If no tokens found and no intercepted session after a delay, show error
      setTimeout(() => {
        const intercepted = getInterceptedSession();
        if (!intercepted && !hasValidTokens) {
          console.log('❌ No tokens found in URL or intercepted session');
          setErrorMessage('This reset link appears to be incomplete, expired, or already used. Please request a new password reset.');
          setIsValidating(false);
        }
      }, 2000); // Wait 2 seconds for potential session interception
    };
    
    extractFromUrl();
    
    // Cleanup
    return () => {
      window.removeEventListener('passwordResetSessionIntercepted', handleInterceptedSession);
      setPasswordResetMode(false);
      clearInterceptedSession();
    };
  }, [hasValidTokens]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!resetTokens) {
      toast.error('No reset tokens available');
      return;
    }

    setIsLoading(true);
    
    try {
      const { accessToken, refreshToken, tokenHash } = resetTokens;
      
      if (accessToken && refreshToken) {
        // Standard access/refresh token format - use setSession temporarily
        console.log('🔄 Using standard token format for password update');
        
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        console.log('🔄 SetSession result:', { 
          hasUser: !!sessionData?.user, 
          error: sessionError?.message 
        });
        
        if (sessionError || !sessionData?.user) {
          console.error('❌ SetSession failed:', sessionError);
          throw new Error('Reset link has expired or is invalid. Please request a new password reset.');
        }
        
        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: values.password
        });
        
        if (updateError) {
          throw new Error(updateError.message || 'Failed to update password. Please try again.');
        }
        
        // Immediately sign out to prevent persistent login
        await supabase.auth.signOut({ scope: 'local' });
        
      } else if (tokenHash) {
        // Token hash format - use verifyOtp
        console.log('🔄 Using token hash format for password update');
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });
        
        console.log('🔄 VerifyOtp result:', { 
          hasUser: !!data?.user, 
          error: error?.message 
        });
        
        if (error || !data?.user) {
          console.error('❌ VerifyOtp failed:', error);
          throw new Error('Reset link has expired or is invalid. Please request a new password reset.');
        }
        
        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: values.password
        });
        
        if (updateError) {
          throw new Error(updateError.message || 'Failed to update password. Please try again.');
        }
        
        // Immediately sign out to prevent persistent login
        await supabase.auth.signOut({ scope: 'local' });
      } else {
        throw new Error('Invalid token format');
      }

      setResetComplete(true);
      toast.success('Password updated successfully! You can now sign in with your new password.');
      
      // Redirect to login after success
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, 2000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state while validating tokens
  if (isValidating) {
    return (
      <LandingLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying reset link...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </LandingLayout>
    );
  }

  // Error state
  if (errorMessage || !hasValidTokens) {
    return (
      <LandingLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is not valid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'This reset link appears to be incomplete, expired, or already used. Please request a new password reset.'}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/auth/forgot-password">Request New Reset Link</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </LandingLayout>
    );
  }

  // Success state
  if (resetComplete) {
    return (
      <LandingLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Password Updated!</CardTitle>
              <CardDescription>
                Your password has been successfully updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/login">Continue to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </LandingLayout>
    );
  }

  // Main reset password form
  return (
    <LandingLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-4 text-center">
              <Link 
                href="/auth/login" 
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </LandingLayout>
  );
}

export default function ResetPasswordPage() {
  // Cleanup auth middleware when page unmounts
  React.useEffect(() => {
    return () => {
      cleanupAuthMiddleware();
    };
  }, []);

  return (
    <React.Suspense fallback={
      <LandingLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </LandingLayout>
    }>
      <ResetPasswordContent />
    </React.Suspense>
  );
}