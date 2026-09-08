import React from "react";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role !== "OWNER") {
    redirect("/");
  }

  const settingsList = await prisma.businessSetting.findMany();
  const initialSettings: Record<string, string> = {};
  for (const s of settingsList) {
    initialSettings[s.key] = s.value;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Business & System Settings (प्रणाली मांडणी)
              </h1>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300 font-mono">
                Owner Controls
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage enterprise profile, interest defaults, late fee rules, SMSLocal.in DLT SMS Gateway, WhatsApp Cloud API, and portfolio backups.
            </p>
          </div>
        </div>

        {/* Client Settings Form */}
        <SettingsForm initialSettings={initialSettings} />
      </div>
    </AppShell>
  );
}
