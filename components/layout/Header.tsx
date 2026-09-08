"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Bell,
  Menu,
  Receipt,
  UserPlus,
  CreditCard,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  userName?: string;
}

export function Header({ onToggleMobileMenu, userName = "Rohit Kagdewad" }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/borrowers?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Mobile Menu Button & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search borrower, mobile, loan ID, receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </form>
      </div>

      {/* Right: Quick Actions & Alerts */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action Button & Dropdown */}
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Action</span>
          </Button>

          {isQuickActionOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsQuickActionOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <Link
                  href="/payments"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Record Payment</div>
                    <div className="text-[10px] text-slate-500">Log collection & receipt</div>
                  </div>
                </Link>

                <Link
                  href="/loans/new"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-200">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Create New Loan</div>
                    <div className="text-[10px] text-slate-500">Disburse loan with schedule</div>
                  </div>
                </Link>

                <Link
                  href="/borrowers/new"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Add Borrower</div>
                    <div className="text-[10px] text-slate-500">Register new customer</div>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Notifications Icon Link */}
        <Link
          href="/dues"
          title="Today's Collections"
          className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </Link>
      </div>
    </header>
  );
}
