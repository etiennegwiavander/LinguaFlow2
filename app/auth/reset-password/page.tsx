"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { 
  createTemporaryResetSession,
  verifyResetTokenHash,
  updatePasswordWithReset,
  cleanupResetSession
} from "@/lib/supabase-reset-password";
import { toast } from "sonner";
import LandingLayout from "@/components/landing/LandingLayout";
import { usePasswordResetInterceptor } from "@/lib/password-reset-url-interceptor";

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
  const router = useRouter();
  
  // Use the URL interceptor to get tokens safely (prevents auto-login)
  const { tokens, hasError, errorMessage, isReady, wasIntercepted } = usePasswordResetInterceptor();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Helper method to validate JWT format
  const isValidJWTFormat = (token: string): boolean => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  };

  // Determine if we have valid tokens
  const hasValidTokens = React.useMemo(() => {
    if (!tokens) return false;
    
    const hasStandardTokens = tokens.accessToken && tokens.refreshToken;
    const hasTokenHash = tokens.tokenHash;
    
    if (hasStandardTokens) {
      return isValidJWTFormat(tokens.accessToken!) && isValidJWTFormat(tokens.refreshToken!);
    } else if (hasTokenHash) {
      return tokens.tokenHash!.length >= 10;
    }
    
    return false;
  }, [tokens]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!tokens) {
      toast.error('No reset tokens available');
      return;
    }

    setIsLoading(true);
    
    try {
      const { accessToken, refreshToken, tokenHash } = tokens;
      
      if (refreshToken && accessToken) {
        // Standard access/refresh token format
        console.log('Using standard token format for password update');
        
        // Create temporary session for password update
        const { data: sessionData, error: sessionError } = await createTemporaryResetSession(accessToken, refreshToken);
        
        if (sessionError || !sessionData?.user) {
          throw new Error('Reset link validation failed. Please request a new password reset.');
        }
        
        // Update password
        const updateResult = await updatePasswordWithReset(values.password);
        
        if (updateResult.error) {
          throw new Error('Failed to update password. Please try again.');
        }
        
        // Immediately sign out to prevent persistent login
        await cleanupResetSession();
        
      } else if (tokenHash) {
        // Token hash format
        console.log('Using token hash format for password update');
        
        const { data, error } = await verifyResetTokenHash(tokenHash);
        
        if (error || !data?.user) {
          throw new Error('Reset link validation failed. Please request a new password reset.');
        }
        
        // Update password
        const updateResult = await updatePasswordWithReset(values.password);
        
        if (updateResult.error) {
          throw new Error('Failed to update password. Please try again.');
        }
        
        // Immediately sign out to prevent persistent login
        await cleanupResetSession();
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

  // Loading state while interceptor processes tokens
  if (!isReady) {
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
  if (hasError || !hasValidTokens) {
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
                {errorMessage || 'This password reset link is not valid'}
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