"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Clock,
  AlertCircle,
  Receipt,
  Calendar,
  FileBarChart,
  MessageSquare,
  ShieldCheck,
  Settings,
  UserCheck,
  Landmark,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole?: string;
  userName?: string;
}

export function Sidebar({ userRole = "OWNER", userName = "Rohit Kagdewad" }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Borrowers", href: "/borrowers", icon: Users },
    { name: "Loans", href: "/loans", icon: CreditCard },
    { name: "Today's Dues", href: "/dues", icon: Clock },
    { name: "Overdue Accounts", href: "/overdue", icon: AlertCircle, badge: "Priority" },
    { name: "Payments & Receipts", href: "/payments", icon: Receipt },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Reports & Analytics", href: "/reports", icon: FileBarChart },
    { name: "WhatsApp Center", href: "/whatsapp", icon: MessageSquare },
  ];

  const adminItems = [
    { name: "Staff Management", href: "/staff", icon: UserCheck, ownerOnly: true },
    { name: "Audit Trail", href: "/audit", icon: ShieldCheck, ownerOnly: true },
    { name: "Business Settings", href: "/settings", icon: Settings, ownerOnly: true },
  ];

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold text-white truncate leading-tight tracking-tight">
            Rohit Kagdewad
          </span>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
            Lending Management
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors group",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 border border-red-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Administration Section */}
        {userRole === "OWNER" && (
          <div>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Governance
            </div>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors group",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-blue-400">
            {userName ? userName.charAt(0) : "R"}
          </div>
          <div className="truncate">
            <div className="text-xs font-medium text-white truncate">{userName}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{userRole}</div>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
