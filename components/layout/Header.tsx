"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Moon,
  Settings,
  Sun,
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface HeaderProps {
  className?: string;
  sidebarCollapsed: boolean;
}

interface TutorProfile {
  name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function Header({ className, sidebarCollapsed }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTutorProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('name, email, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tutor profile:', error);
          return;
        }

        setTutorProfile(data);
      } catch (error) {
        console.error('Error in fetchTutorProfile:', error);
      }
    };

    fetchTutorProfile();
  }, [user]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth/login');
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getDisplayName = () => {
    if (tutorProfile?.name) {
      return tutorProfile.name.split(' ')[0];
    }
    return tutorProfile?.email?.split('@')[0] || 'Guest';
  };

  const getFullDisplayName = () => {
    return tutorProfile?.name || tutorProfile?.email?.split('@')[0] || 'Guest';
  };

  const getAvatarFallback = () => {
    if (tutorProfile?.name) {
      return getInitials(tutorProfile.name);
    }
    return getInitials(tutorProfile?.email?.split('@')[0] || 'Guest');
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 w-full items-center glass-effect backdrop-blur-md border-b border-cyber-400/20 shadow-glow",
        className
      )}
    >
      <div className={cn(
        "flex w-full items-center justify-between px-4 transition-all duration-300",
        "sm:px-6"
      )}>
        {/* Mobile Logo (visible when sidebar is collapsed) */}
        <div className="md:hidden flex items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Languages className="h-6 w-6 text-cyber-400 group-hover:text-neon-400 transition-colors duration-300" />
              <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <span className="font-bold text-lg gradient-text">LinguaFlow</span>
          </Link>
        </div>

        {/* Welcome Message */}
        <div className="hidden md:flex items-center">
          <h1 className="text-lg sm:text-xl font-semibold">
            Welcome back, <span className="gradient-text">{getDisplayName()}</span>
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-cyber-400/10 hover:text-cyber-400 transition-all duration-300">
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-effect border-cyber-400/30">
              <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-cyber-400/10">
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-cyber-400/10">
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-cyber-400/10">
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 hover:bg-cyber-400/10 hover:text-cyber-400 transition-all duration-300">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-neon-400 animate-pulse"></span>
          </Button>

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 flex items-center space-x-2 h-8 sm:h-9 hover:bg-cyber-400/10 transition-all duration-300 group">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-cyber-400/20 group-hover:ring-cyber-400/50 transition-all duration-300">
                  <AvatarImage 
                    src={tutorProfile?.avatar_url || undefined} 
                    alt={getFullDisplayName()} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{getDisplayName()}</span>
                  <span className="text-xs text-muted-foreground">Tutor</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-cyber-400 transition-colors duration-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-effect border-cyber-400/30">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getFullDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {tutorProfile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-cyber-400/20" />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="hover:bg-cyber-400/10">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="hover:bg-cyber-400/10">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-cyber-400/20" />
              <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-400/10 text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}