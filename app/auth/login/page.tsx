"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Languages } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import LandingLayout from "@/components/landing/LandingLayout";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const reset = searchParams?.get('reset');
    if (reset === 'success') {
      toast.success('Password reset successful! You can now sign in with your new password.');
    }
  }, [searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
      toast.success('Successfully logged in');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LandingLayout>
      <div className="page-container">
        {/* Enhanced background effects */}
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
                Welcome <span className="gradient-text">back</span>
              </CardTitle>
              <CardDescription>
                Enter your email to sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                            className="input-cyber focus-cyber"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
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
                              <span className="sr-only">
                                {showPassword ? "Hide password" : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rememberMe"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="focus-cyber"
                          />
                          <Label
                            htmlFor="rememberMe"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Remember me
                          </Label>
                        </div>
                      )}
                    />
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-cyber-400 hover:text-cyber-500 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full btn-cyber hover-lift" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cyber-400/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    New to LinguaFlow?
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={searchParams?.get('redirect') ? `/auth/signup?redirect=${searchParams.get('redirect')}` : '/auth/signup'}
                  className="font-medium text-cyber-400 hover:text-cyber-500 hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </LandingLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <LandingLayout>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md cyber-card">
              <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold">
                  Loading...
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </LandingLayout>
    }>
      <LoginPageContent />
    </Suspense>
  );
}