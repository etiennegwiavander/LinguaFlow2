"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
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
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const [resetTokens, setResetTokens] = useState<{accessToken: string, refreshToken: string} | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if we have the required parameters
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      // Store tokens for later use
      setResetTokens({ accessToken, refreshToken });
      // Validate tokens without setting session
      validateResetTokens(accessToken, refreshToken);
    } else {
      setIsValidToken(false);
    }
  }, [searchParams]);

  const validateResetTokens = async (accessToken: string, refreshToken: string) => {
    try {
      // Simply validate that we have the required tokens
      // The actual validation will happen when we try to update the password
      if (accessToken && refreshToken) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    } catch (error) {
      console.error('Error validating reset tokens:', error);
      setIsValidToken(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (!resetTokens) {
        throw new Error('Invalid reset link');
      }

      const { accessToken, refreshToken } = resetTokens;

      // Temporarily set the session to update password
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !sessionData.user) {
        throw new Error('Invalid or expired reset link');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
      });

      if (updateError) {
        throw updateError;
      }

      // Immediately sign out to prevent staying logged in
      await supabase.auth.signOut();

      setResetComplete(true);
      toast.success('Password updated successfully');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidToken === null) {
    return (
      <LandingLayout>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md cyber-card">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Verifying reset link...
                </CardTitle>
                <CardDescription>
                  Please wait while we verify your password reset link
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (isValidToken === false) {
    return (
      <LandingLayout>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md cyber-card">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-red-600">
                  Invalid reset link
                </CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    The reset link may have expired or been used already. Please request a new password reset.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/forgot-password">
                      Request new reset link
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login">
                      Back to login
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (resetComplete) {
    return (
      <LandingLayout>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md cyber-card">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-green-600">
                  Password updated!
                </CardTitle>
                <CardDescription>
                  Your password has been successfully updated. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Continue to login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="page-container">
        <div className="page-background"></div>
        <div className="floating-elements"></div>
        <div className="fixed top-40 right-20 w-32 h-32 bg-neon-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
        <div className="fixed bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '4s' }}></div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md cyber-card animate-scale-in">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img
                    src="/linguaflowfavicon.png"
                    alt="LinguaFlow Logo"
                    className="h-12 w-15"
                  />
                  <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl"></div>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                Reset your <span className="gradient-text">password</span>
              </CardTitle>
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
                              placeholder="Enter your new password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="input-cyber focus-cyber"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-cyber"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
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
                              placeholder="Confirm your new password"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="input-cyber focus-cyber"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-cyber"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full btn-cyber hover-lift" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </LandingLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <LandingLayout>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md cyber-card">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Loading...
                </CardTitle>
                <CardDescription>
                  Please wait while we load the reset page...
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </LandingLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}