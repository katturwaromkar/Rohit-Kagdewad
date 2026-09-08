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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Menu Button & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search borrower name, mobile, loan ID, receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-700/80 bg-slate-950 py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
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
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-lg shadow-blue-600/20 font-semibold h-9 px-3.5"
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
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                <Link
                  href="/payments"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Record Payment</div>
                    <div className="text-[10px] text-slate-400">हप्ता जमा व पावती</div>
                  </div>
                </Link>

                <Link
                  href="/loans/new"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/80">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Create New Loan</div>
                    <div className="text-[10px] text-slate-400">नवीन कर्ज वाटप</div>
                  </div>
                </Link>

                <Link
                  href="/borrowers/new"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/80">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Add Borrower</div>
                    <div className="text-[10px] text-slate-400">नवीन कर्जदार नोंदणी</div>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Notifications Icon Link */}
        <Link
          href="/dues"
          title="Today's Collections (आजचे हप्ते)"
          className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-slate-900" />
        </Link>
      </div>
    </header>
  );
}
