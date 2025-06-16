"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarCollapsed(mobile);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-background opacity-20 pointer-events-none"></div>
      <div className="fixed top-20 left-10 w-20 h-20 bg-cyber-400/20 rounded-full blur-xl animate-float pointer-events-none"></div>
      <div className="fixed top-40 right-20 w-32 h-32 bg-neon-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '4s' }}></div>
      
      <Sidebar onToggle={handleSidebarToggle} />
      <div 
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "pl-0 md:pl-[70px]" : "pl-0 md:pl-[250px]"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}