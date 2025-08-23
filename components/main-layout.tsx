"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="page-container">
      {/* Enhanced background effects */}
      <div className="page-background"></div>
      <div className="floating-elements"></div>
      <div className="fixed top-40 right-20 w-32 h-32 bg-neon-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float pointer-events-none" style={{ animationDelay: '4s' }}></div>
      
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 grid-background-dense opacity-10 pointer-events-none"></div>
      
      <Sidebar onToggle={handleSidebarToggle} />
      <div 
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "pl-0 md:pl-[70px]" : "pl-0 md:pl-[250px]"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto relative z-10">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}