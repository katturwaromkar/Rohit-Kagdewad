"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import { Footer } from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: string;
    email: string;
  } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = user?.name || "Rohit Kagdewad";
  const userRole = user?.role || "OWNER";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased overflow-x-hidden max-w-full w-full">
      {/* Desktop Fixed Sidebar */}
      <Sidebar userRole={userRole} userName={userName} />

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen max-w-full w-full overflow-x-hidden">
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          userName={userName}
        />

        {/* Page Content Container with mobile bottom padding */}
        <main className="flex-1 px-3 py-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 overflow-x-hidden">
          {children}
        </main>

        {/* Global Footer */}
        <div className="pb-16 lg:pb-0">
          <Footer />
        </div>

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileNav
          userRole={userRole}
          userName={userName}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onOpen={() => setIsMobileMenuOpen(true)}
        />

        {/* Mobile Push Notification Prompt */}
        <NotificationPrompt />
      </div>
    </div>
  );
}
