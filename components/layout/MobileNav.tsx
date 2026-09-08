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
}

export function MobileNav({ userRole = "OWNER", userName = "Rohit Kagdewad" }: MobileNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "Borrowers", href: "/borrowers", icon: Users },
    { name: "Loans", href: "/loans", icon: CreditCard },
    { name: "Dues", href: "/dues", icon: Clock },
  ];

  const secondaryLinks = [
    { name: "Overdue Accounts", href: "/overdue", icon: AlertCircle },
    { name: "Payments & Receipts", href: "/payments", icon: Receipt },
    { name: "Collection Calendar", href: "/calendar", icon: Calendar },
    { name: "Reports & Analytics", href: "/reports", icon: FileBarChart },
    { name: "WhatsApp Center", href: "/whatsapp", icon: MessageSquare },
  ];

  const adminLinks = [
    { name: "Staff Management", href: "/staff", icon: UserCheck },
    { name: "Audit Trail", href: "/audit", icon: ShieldCheck },
    { name: "Business Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Slide-over "More" Drawer for mobile */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-slate-900 text-slate-200 p-5 shadow-2xl flex flex-col z-50">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-white text-sm">Rohit Kagdewad Lending</span>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                  Fintech Operations
                </div>
                <div className="space-y-1">
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
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
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                    Administration
                  </div>
                  <div className="space-y-1">
                    {adminLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
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
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-red-400 hover:bg-slate-700"
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-blue-600" : "text-slate-500")} />
              <span>{tab.name}</span>
            </Link>
          );
        })}

        {/* More Tab */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900"
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5 text-slate-500" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
