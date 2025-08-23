"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
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

  const collapseSidebar = () => {
    if (!isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const expandSidebar = () => {
    if (!isMobile) {
      setSidebarCollapsed(false);
    }
  };

  return (
    <SidebarContext.Provider value={{
      sidebarCollapsed,
      setSidebarCollapsed,
      collapseSidebar,
      expandSidebar,
      isMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}