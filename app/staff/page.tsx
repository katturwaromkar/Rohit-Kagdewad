import React from "react";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { UserCheck, UserPlus, ShieldAlert, KeyRound } from "lucide-react";
import { StaffManager } from "./StaffManager";

export default async function StaffPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role !== "OWNER") {
    redirect("/");
  }

  const staffUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      status: true,
      permissions: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Staff & Access Management
              </h1>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {staffUsers.length} Users
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure collection agent accounts, field permissions, and secure role boundaries.
            </p>
          </div>
        </div>

        {/* Client Interactive Staff Creation & List */}
        <StaffManager initialStaff={staffUsers} />
      </div>
    </AppShell>
  );
}
