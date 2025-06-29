"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import Link from "next/link";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // For demo purposes, we'll use a hardcoded check
      // In a real app, you would call your Supabase Edge Function
      if (values.username === "admin" && values.password === "admin123") {
        // Store admin session
        localStorage.setItem('admin_session', JSON.stringify({ 
          loggedIn: true, 
          username: values.username,
          timestamp: Date.now()
        }));
        toast.success('Admin login successful!');
        router.push('/admin-portal/dashboard');
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Admin login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
                <Shield className="h-10 w-10 text-cyber-400" />
                <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl"></div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Admin <span className="gradient-text">Login</span>
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin_user"
                          type="text"
                          autoComplete="username"
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
                <Button type="submit" className="w-full btn-cyber hover-lift" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-cyber-400 transition-colors">
              Return to main site
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}