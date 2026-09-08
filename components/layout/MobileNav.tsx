"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Clock,
  MoreHorizontal,
  X,
  Receipt,
  Calendar,
  FileBarChart,
  MessageSquare,
  ShieldCheck,
  Settings,
  UserCheck,
  AlertCircle,
  Landmark,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  userRole?: string;
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

export function MobileNav({
  userRole = "OWNER",
  userName = "Rohit Kagdewad",
  isOpen,
  onClose,
  onOpen,
}: MobileNavProps) {
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(false);

  const drawerVisible = isOpen !== undefined ? (isOpen || internalOpen) : internalOpen;

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  const handleOpen = () => {
    setInternalOpen(true);
    onOpen?.();
  };

  const mainTabs = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Borrowers", href: "/borrowers", icon: Users },
    { name: "Loans", href: "/loans", icon: CreditCard },
    { name: "Dues Queue", href: "/dues", icon: Clock },
  ];

  const secondaryLinks = [
    { name: "Overdue Accounts (थकबाकी)", href: "/overdue", icon: AlertCircle },
    { name: "Payments & Receipts (पावती)", href: "/payments", icon: Receipt },
    { name: "Collection Calendar (कॅलेंडर)", href: "/calendar", icon: Calendar },
    { name: "Reports & P&L (अहवाल)", href: "/reports", icon: FileBarChart },
    { name: "WhatsApp Center (मेसेज)", href: "/whatsapp", icon: MessageSquare },
  ];

  const adminLinks = [
    { name: "Staff Management (कर्मचारी)", href: "/staff", icon: UserCheck },
    { name: "Security Audit Trail (ऑडिट)", href: "/audit", icon: ShieldCheck },
    { name: "Business Settings (सेटिंग्ज)", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Slide-over "More" Drawer for mobile */}
      {drawerVisible && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-slate-900 border-l border-slate-800 text-slate-200 p-5 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">Rohit Kagdewad</span>
                  <span className="text-[10px] text-slate-400">Lending Operations</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                  Operations & Collections
                </div>
                <div className="space-y-1">
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleClose}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {userRole === "OWNER" && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                    Administration & Backups
                  </div>
                  <div className="space-y-1">
                    {adminLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleClose}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="pt-3 border-t border-slate-800">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out ({userName})</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile Viewport */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md lg:hidden items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-blue-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-blue-400" : "text-slate-400")} />
              <span>{tab.name}</span>
            </Link>
          );
        })}

        {/* More Tab */}
        <button
          type="button"
          onClick={handleOpen}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium text-slate-400 hover:text-slate-200"
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5 text-slate-400" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
