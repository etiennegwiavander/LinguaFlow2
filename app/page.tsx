"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Languages } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Languages className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading LinguaFlow...</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting you to the right place
        </p>
      </div>
    </div>
  );
}