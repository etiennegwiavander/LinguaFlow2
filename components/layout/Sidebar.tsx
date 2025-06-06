"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import { navItems } from "@/lib/sample-data";
import { useAuth } from "@/lib/auth-context";
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
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    setCollapsed(!collapsed);
  };

  const filteredNavItems = navItems.filter(
    item => !item.requiresAdmin || isAdmin
  );

  const IconComponent = ({ name }: { name: string }) => {
    const Icon = Icons[name as keyof typeof Icons] || Icons.Circle;
    return <Icon className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card shadow-md transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[250px]",
        isMobile && collapsed ? "-translate-x-full" : "translate-x-0",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Title */}
        <div className="flex h-16 items-center px-4 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.Languages className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {!collapsed && (
              <span className="font-bold text-base sm:text-lg">LinguaFlow</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          <TooltipProvider delayDuration={0}>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        collapsed ? "justify-center" : "justify-start"
                      )}
                    >
                      <IconComponent name={item.icon} />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Collapse Button */}
        <div className="border-t p-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full flex items-center justify-center",
              collapsed && "p-0 h-8 w-8 sm:h-9 sm:w-9"
            )}
            onClick={toggleSidebar}
          >
            {collapsed ? (
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
          className="absolute -right-12 top-4 shadow-md h-8 w-8 sm:h-9 sm:w-9"
          onClick={toggleSidebar}
        >
          <Icons.Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      )}
    </aside>
  );
}