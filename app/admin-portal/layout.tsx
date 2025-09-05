"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogOut, Shield, Users, BarChart, AlertTriangle, Settings, Mail, Home, ChevronRight, FileText, Server, TestTube, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function AdminLayout({
  
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs = [
      { label: 'Admin Portal', href: '/admin-portal/dashboard', icon: Home }
    ];

    if (pathSegments.length > 1) {
      const section = pathSegments[1];
      switch (section) {
        case 'dashboard':
          breadcrumbs.push({ label: 'Dashboard', href: '/admin-portal/dashboard', icon: BarChart });
          break;
        case 'tutors':
          breadcrumbs.push({ label: 'Tutors', href: '/admin-portal/tutors', icon: Users });
          break;
        case 'logs':
          breadcrumbs.push({ label: 'System Logs', href: '/admin-portal/logs', icon: AlertTriangle });
          break;
        case 'email':
          breadcrumbs.push({ label: 'Email Management', href: '/admin-portal/email', icon: Mail });
          
          // Add sub-page breadcrumbs for email management
          if (pathSegments.length > 2) {
            const subSection = pathSegments[2];
            switch (subSection) {
              case 'analytics':
                breadcrumbs.push({ label: 'Analytics', href: '/admin-portal/email/analytics', icon: BarChart });
                break;
              case 'templates':
                breadcrumbs.push({ label: 'Templates', href: '/admin-portal/email/templates', icon: FileText });
                break;
              case 'smtp':
                breadcrumbs.push({ label: 'SMTP Configuration', href: '/admin-portal/email/smtp', icon: Server });
                break;
              case 'testing':
                breadcrumbs.push({ label: 'Testing', href: '/admin-portal/email/testing', icon: TestTube });
                break;
            }
          }
          break;
        case 'settings':
          breadcrumbs.push({ label: 'Settings', href: '/admin-portal/settings', icon: Settings });
          break;
      }
    }

    return breadcrumbs;
  };

  // Check if user has access to email management features
  const hasEmailManagementAccess = () => {
    // In a real application, this would check the user's role/permissions
    // For now, we'll assume all authenticated admin users have access
    return isAuthenticated;
  };

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

  // const [sidebarHovered, setSidebarHovered] = useState(false);
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(true);


  // Admin layout with collapsible sidebar
  return (
    <div className="min-h-screen bg-background flex">
      {/* Collapsible Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40 ${
          sidebarHovered || !sidebarCollapsed ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              {(sidebarHovered || !sidebarCollapsed) && (
                <h1 className="ml-3 text-xl font-semibold text-gray-900 whitespace-nowrap">
                  Admin Portal
                </h1>
              )}
            </div>
            {(sidebarHovered || !sidebarCollapsed) && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <Link 
              href="/admin-portal/dashboard" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/admin-portal/dashboard' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart className={`h-5 w-5 ${pathname === '/admin-portal/dashboard' ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {(sidebarHovered || !sidebarCollapsed) && (
                <>
                  <span className="ml-3 whitespace-nowrap">Dashboard</span>
                  {pathname === '/admin-portal/dashboard' && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-700" />
                  )}
                </>
              )}
            </Link>
            
            <Link 
              href="/admin-portal/tutors" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/admin-portal/tutors' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className={`h-5 w-5 ${pathname === '/admin-portal/tutors' ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {(sidebarHovered || !sidebarCollapsed) && (
                <>
                  <span className="ml-3 whitespace-nowrap">Tutors</span>
                  {pathname === '/admin-portal/tutors' && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-700" />
                  )}
                </>
              )}
            </Link>
            
            <Link 
              href="/admin-portal/logs" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/admin-portal/logs' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className={`h-5 w-5 ${pathname === '/admin-portal/logs' ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {(sidebarHovered || !sidebarCollapsed) && (
                <>
                  <span className="ml-3 whitespace-nowrap">System Logs</span>
                  {pathname === '/admin-portal/logs' && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-700" />
                  )}
                </>
              )}
            </Link>
            
            {/* Email Management Section */}
            {hasEmailManagementAccess() && (
              <>
                <div className="pt-2">
                  {(sidebarHovered || !sidebarCollapsed) && (
                    <div className="text-xs font-medium text-gray-500 mb-2 px-3">Email System</div>
                  )}
                </div>
                
                <Link 
                  href="/admin-portal/email" 
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname.startsWith('/admin-portal/email') 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Mail className={`h-5 w-5 ${pathname.startsWith('/admin-portal/email') ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {(sidebarHovered || !sidebarCollapsed) && (
                    <>
                      <span className="ml-3 whitespace-nowrap">Email Management</span>
                      {pathname.startsWith('/admin-portal/email') && (
                        <ChevronRight className="ml-auto h-4 w-4 text-blue-700" />
                      )}
                    </>
                  )}
                </Link>
              </>
            )}
            
            <Link 
              href="/admin-portal/settings" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/admin-portal/settings' 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings className={`h-5 w-5 ${pathname === '/admin-portal/settings' ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {(sidebarHovered || !sidebarCollapsed) && (
                <>
                  <span className="ml-3 whitespace-nowrap">Settings</span>
                  {pathname === '/admin-portal/settings' && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-700" />
                  )}
                </>
              )}
            </Link>
          </nav>
          
          {/* Footer */}
          {(sidebarHovered || !sidebarCollapsed) && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  LinguaFlow Admin v1.0
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${(sidebarHovered || !sidebarCollapsed) ? 'ml-64' : 'ml-16'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between w-full px-6">
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
              <BreadcrumbList>
                {generateBreadcrumbs().map((breadcrumb, index) => {
                  const breadcrumbs = generateBreadcrumbs();
                  const IconComponent = breadcrumb.icon;
                  return (
                    <div key={breadcrumb.href} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="flex items-center space-x-1">
                            <IconComponent className="h-4 w-4" />
                            <span>{breadcrumb.label}</span>
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={breadcrumb.href} className="flex items-center space-x-1 hover:text-primary">
                            <IconComponent className="h-4 w-4" />
                            <span>{breadcrumb.label}</span>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}