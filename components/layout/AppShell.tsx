"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Desktop Fixed Sidebar */}
      <Sidebar userRole={userRole} userName={userName} />

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          userName={userName}
        />

        {/* Page Content Container with mobile bottom padding */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {children}
        </main>

        {/* Mobile Navigation */}
        <MobileNav userRole={userRole} userName={userName} />
      </div>
    </div>
  );
}
