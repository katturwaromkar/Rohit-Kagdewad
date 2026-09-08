import React from "react";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface AuditPageProps {
  searchParams: {
    entity?: string;
    action?: string;
  };
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role !== "OWNER") {
    redirect("/");
  }

  const where: any = {};
  if (searchParams.entity && searchParams.entity !== "ALL") {
    where.entityType = searchParams.entity;
  }
  if (searchParams.action && searchParams.action !== "ALL") {
    where.action = searchParams.action;
  }

  const auditLogs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Immutable Financial Audit Trail (लेखापरीक्षण नोंदवही)
              </h1>
              <span className="rounded-full bg-blue-950/80 text-blue-400 border border-blue-800 px-2.5 py-0.5 text-xs font-semibold font-mono">
                Tamper-Resistant Log
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Complete historical record of all financial mutations, disbursements, collections, reversals, and staff activities.
            </p>
          </div>
        </div>

        {/* Audit Log Table */}
        <Card className="overflow-hidden bg-slate-900 border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp (IST)</th>
                  <th className="px-4 py-3">Actor / Staff</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Entity ID / Summary</th>
                  <th className="px-4 py-3">Client Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {formatDate(log.createdAt, "dd MMM yyyy, hh:mm:ss a")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {log.user ? log.user.name : "System Engine"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.user ? log.user.email : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        log.action === "REVERSE"
                          ? "bg-rose-950 text-rose-300 border-rose-800"
                          : log.action === "CREATE"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-slate-800 text-slate-200 border-slate-700"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="font-mono text-[11px] text-blue-400 truncate max-w-xs" title={log.entityId}>
                        ID: {log.entityId}
                      </div>
                      {log.newValues && (
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs mt-0.5" title={log.newValues}>
                          {log.newValues}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                      <div>IP: {log.ipAddress || "127.0.0.1"}</div>
                      <div className="truncate max-w-[120px]">{log.userAgent || "Web Client"}</div>
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No audit log entries recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
