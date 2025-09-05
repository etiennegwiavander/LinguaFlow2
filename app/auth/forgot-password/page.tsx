"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import LandingLayout from "@/components/landing/LandingLayout";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      setSentEmail(values.email);
      setEmailSent(true);
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <LandingLayout>
        <div className="page-container">
          <div className="page-background"></div>
          <div className="floating-elements"></div>
          
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <Card className="w-full max-w-md cyber-card animate-scale-in">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="absolute inset-0 bg-green-400 opacity-20 blur-xl"></div>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  Check your <span className="gradient-text">email</span>
                </CardTitle>
                <CardDescription>
                  We've sent a password reset link to your email address
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    We've sent a password reset link to <strong>{sentEmail}</strong>. 
                    Click the link in the email to reset your password.
                  </AlertDescription>
                </Alert>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Didn't receive the email? Check your spam folder or try again.</p>
                  <p>The reset link will expire in 1 hour for security reasons.</p>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-3">
                <Button 
                  onClick={() => {
                    setEmailSent(false);
                    form.reset();
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  Send another email
                </Button>
                
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/auth/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                  </Link>
                </Button>
              </CardFooter>
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
                Forgot your <span className="gradient-text">password?</span>
              </CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
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
                  
                  <Button type="submit" className="w-full btn-cyber hover-lift" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </LandingLayout>
  );
}