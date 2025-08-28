"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { navItems } from "@/lib/sample-data";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import { supabase } from "@/lib/supabase";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  className?: string;
  onToggle?: (collapsed: boolean) => void;
}

export default function Sidebar({ className, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, isMobile } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAttentionAnimation, setShowAttentionAnimation] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('tutors')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsAdmin(data.is_admin);
      }
    };

    checkAdminStatus();
  }, [user]);



  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const filteredNavItems = navItems.filter(
    item => !item.requiresAdmin || isAdmin
  );

  const IconComponent = ({ name }: { name: string }) => {
    const Icon = Icons[name as keyof typeof Icons] || Icons.Circle;
    const Component = Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    return <Component className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  // Helper function to check if a nav item is active
  const isActive = (href: string) => {
    if (pathname === href) return true;
    
    // For nested routes, check if the current path starts with the nav item's path
    // But only if the nav item path is not just the root path
    if (href !== '/' && pathname.startsWith(href)) return true;
    
    return false;
  };

  // Check if we're currently viewing a student profile
  const isStudentProfileActive = useCallback(() => {
    // Only show when viewing a specific student profile (e.g., /students/123)
    // Hide when on student list (/students or /students/)
    return pathname.match(/^\/students\/[^\/]+/) && !pathname.match(/^\/students\/?$/);
  }, [pathname]);

  // Student-specific navigation items
  const studentNavItems = [
    {
      title: 'Discussion Topics',
      href: `${pathname}?tab=discussion-topics`,
      icon: 'MessageSquare'
    },
    {
      title: 'Vocabulary Flashcards',
      href: `${pathname}?tab=vocabulary-flashcards`,
      icon: 'BookOpen'
    }
  ];

  // Show attention animation automatically when viewing a student profile
  useEffect(() => {
    const isCurrentlyActive = !!isStudentProfileActive();
    
    if (isCurrentlyActive) {
      // Small delay to ensure sidebar items are rendered before starting animation
      const startTimer = setTimeout(() => {
        setShowAttentionAnimation(true);
      }, 500); // 500ms delay to ensure items are visible
      
      // Timer for attention animation - disappears after 30 seconds
      const endTimer = setTimeout(() => {
        setShowAttentionAnimation(false);
      }, 30500); // 30 seconds + 500ms delay

      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    } else {
      // Reset animation when leaving student profile
      setShowAttentionAnimation(false);
    }
  }, [isStudentProfileActive, pathname]);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen glass-nav backdrop-blur-xl border-r border-cyber-400/20 shadow-cyber transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[70px]" : "w-[250px]",
        isMobile && sidebarCollapsed ? "-translate-x-full" : "translate-x-0",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Title */}
        <div className="flex h-16 items-center px-4 border-b border-cyber-400/20">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <img 
                src="/linguaflowfavicon.png" 
                alt="LinguaFlow Logo" 
                className="h-12 w-13 transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-base sm:text-lg gradient-text">LinguaFlow</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col">
          {/* Main Navigation */}
          <nav className="space-y-1 px-2 py-4">
            <TooltipProvider delayDuration={0}>
              {/* Core navigation items */}
              {filteredNavItems.filter(item => item.title === 'Dashboard' || item.title === 'My Students').map((item, index) => {
                const active = isActive(item.href);
                
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "nav-item group relative overflow-hidden",
                          active ? "nav-item-active" : "nav-item-inactive",
                          sidebarCollapsed ? "justify-center" : "justify-start"
                        )}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {active && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 animate-pulse"></div>
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyber-400 to-neon-400"></div>
                          </>
                        )}
                        <div className="relative z-10 flex items-center">
                          <IconComponent name={item.icon} />
                          {!sidebarCollapsed && <span className="ml-3 font-medium">{item.title}</span>}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="font-medium glass-effect border-cyber-400/30">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}

              {/* Student-specific navigation items - only show when viewing a student profile */}
              {isStudentProfileActive() && studentNavItems.map((item, index) => {
                // For now, let's just show the items without active state logic
                const isTabActive = false; // We'll handle this later
                
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "nav-item group relative overflow-hidden ml-4",
                          isTabActive ? "nav-item-active" : "nav-item-inactive",
                          sidebarCollapsed ? "justify-center ml-0" : "justify-start",

                        )}
                        style={{ 
                          animationDelay: `${(index + 2) * 0.1}s`,
                          ...(showAttentionAnimation && {
                            animationDelay: `${index * 0.5}s`
                          })
                        }}
                      >
                        {/* Subtle border animation for attention */}
                        {showAttentionAnimation && (
                          <div 
                            className="absolute inset-0 rounded-lg pointer-events-none animate-border-glow"
                            style={{ 
                              animationDelay: `${index * 0.5}s`,
                              zIndex: 0
                            }}
                          />
                        )}
                        
                        {isTabActive && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 animate-pulse"></div>
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyber-400 to-neon-400"></div>
                          </>
                        )}
                        <div className="relative z-10 flex items-center">
                          <IconComponent name={item.icon} />
                          {!sidebarCollapsed && <span className="ml-3 font-medium text-sm">{item.title}</span>}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="font-medium glass-effect border-cyber-400/30">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </nav>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Secondary Navigation */}
          <nav className="space-y-1 px-2 pb-4">
            <TooltipProvider delayDuration={0}>
              {filteredNavItems.filter(item => item.title === 'Calendar Sync' || item.title === 'Settings').map((item, index) => {
                const active = isActive(item.href);
                
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "nav-item group relative overflow-hidden",
                          active ? "nav-item-active" : "nav-item-inactive",
                          sidebarCollapsed ? "justify-center" : "justify-start"
                        )}
                        style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                      >
                        {active && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/10 to-neon-400/10 animate-pulse"></div>
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyber-400 to-neon-400"></div>
                          </>
                        )}
                        <div className="relative z-10 flex items-center">
                          <IconComponent name={item.icon} />
                          {!sidebarCollapsed && <span className="ml-3 font-medium">{item.title}</span>}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="font-medium glass-effect border-cyber-400/30">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </nav>
        </div>



        {/* Collapse Button */}
        <div className="border-t border-cyber-400/20 p-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full flex items-center justify-center btn-ghost-cyber transition-all duration-300",
              sidebarCollapsed && "p-0 h-8 w-8 sm:h-9 sm:w-9"
            )}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <Icons.ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <Icons.ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      {isMobile && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-12 top-4 glass-effect border-cyber-400/30 hover:bg-cyber-400/10 shadow-glow h-8 w-8 sm:h-9 sm:w-9"
          onClick={toggleSidebar}
        >
          <Icons.Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      )}
    </aside>
  );
}