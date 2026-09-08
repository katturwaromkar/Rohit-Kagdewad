"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("rohit@lending.com");
  const [password, setPassword] = useState("Password@123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Login failed. Please check credentials.");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Password@123");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Landmark className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Rohit Kagdewad
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-slate-400 tracking-wide uppercase">
          Private Lending & Borrower Repayment System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-950 border border-slate-800 py-8 px-6 shadow-2xl rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 rounded-md bg-red-950/60 border border-red-800 p-3.5 flex items-start gap-2.5 text-red-300 text-xs">
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lending.com"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium mt-2"
            >
              Sign In to Dashboard
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Role Switch
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("rohit@lending.com")}
                className="flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Owner Login</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("staff@lending.com")}
                className="flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Staff Login</span>
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Default password: <span className="font-mono text-slate-400">Password@123</span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Secure Encrypted Financial Session &bull; Nanded, Maharashtra
        </div>
      </div>
    </div>
  );
}
