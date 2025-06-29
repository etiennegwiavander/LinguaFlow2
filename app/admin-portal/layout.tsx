"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Languages, LogOut, Shield, Users, BarChart, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const adminSession = localStorage.getItem('admin_session');
    
    // Skip auth check for login page
    if (pathname === '/admin-portal/login') {
      setIsLoading(false);
      return;
    }
    
    if (!adminSession) {
      toast.error('Please log in to access the admin panel');
      router.push('/admin-portal/login');
      return;
    }
    
    try {
      const session = JSON.parse(adminSession);
      
      // Check if session is valid (has loggedIn flag and not expired)
      // In a real app, you might want to check with the server
      if (!session.loggedIn) {
        throw new Error('Invalid session');
      }
      
      // Optional: Check session age (e.g., expire after 24 hours)
      const sessionAge = Date.now() - (session.timestamp || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        throw new Error('Session expired');
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('admin_session');
      toast.error('Your session has expired. Please log in again.');
      router.push('/admin-portal/login');
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast.success('Logged out successfully');
    router.push('/admin-portal/login');
  };

  // If on login page or loading, just render children
  if (pathname === '/admin-portal/login' || isLoading) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  // If not authenticated and not on login page, children won't render due to redirect in useEffect
  if (!isAuthenticated && pathname !== '/admin-portal/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verifying admin access...</p>
        </div>
        <Toaster />
      </div>
    );
  }

  // Admin layout with sidebar
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center glass-nav shadow-lg border-b border-cyber-400/20">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/admin-portal/dashboard" className="flex items-center space-x-2">
            <div className="relative">
              <Shield className="h-6 w-6 text-cyber-400" />
              <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl"></div>
            </div>
            <span className="font-bold text-lg">LinguaFlow Admin</span>
          </Link>
          
          <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-100/50">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Admin Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">Navigation</div>
          <nav className="space-y-1">
            <Link 
              href="/admin-portal/dashboard" 
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                pathname === '/admin-portal/dashboard' 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-muted'
              }`}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link 
              href="/admin-portal/tutors" 
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                pathname === '/admin-portal/tutors' 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-muted'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Tutors
            </Link>
            <Link 
              href="/admin-portal/logs" 
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                pathname === '/admin-portal/logs' 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-muted'
              }`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              System Logs
            </Link>
            <Link 
              href="/admin-portal/settings" 
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                pathname === '/admin-portal/settings' 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'hover:bg-muted'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}