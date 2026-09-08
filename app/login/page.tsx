"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server returned error ${res.status}. Please check Vercel DATABASE_URL environment variable.` };
      }

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid credentials or account inactive.");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error. Please check your internet connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-600/20">
            <Landmark className="h-8 w-8" />
          </div>
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Rohit Kagdewad
        </h1>
        <p className="mt-1.5 text-center text-xs font-medium text-slate-400 tracking-wider uppercase">
          Lending Management & Recovery Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-950 border border-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Operator Sign In</h2>
              <p className="text-xs text-slate-400">Access authorized financial workspace</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              256-Bit SSL
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-lg bg-red-950/60 border border-red-800/80 p-3.5 flex items-start gap-2.5 text-red-300 text-xs animate-in fade-in duration-200">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rohit@lending.com"
                  className="w-full h-11 rounded-lg border border-slate-700/80 bg-slate-900/90 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 rounded-lg border border-slate-700/80 bg-slate-900/90 py-2 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm mt-3 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99]"
            >
              Sign In Securely
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <p className="font-medium text-slate-400">Rohit Kagdewad &bull; Private Lending Operations</p>
          <p className="text-[11px] text-slate-400">Station Road, Nanded, Maharashtra</p>
          <div className="w-full pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
            Developed by{" "}
            <a
              href="https://www.yugvextechsolutions.site/"
              target="_self"
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Yugvex Tech Solutions
            </a>
            , Pune. Contact No &ndash;{" "}
            <a
              href="tel:7219290885"
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              7219290885
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
