import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import {
  AlertCircle,
  Phone,
  MessageSquare,
  Receipt,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { differenceInDays } from "date-fns";

interface OverduePageProps {
  searchParams: {
    bucket?: string;
    q?: string;
  };
}

export default async function OverduePage({ searchParams }: OverduePageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const selectedBucket = searchParams.bucket || "ALL";
  const query = searchParams.q || "";
  const today = new Date();

  // Fetch all overdue installments with loan and borrower data
  const overdueInstallments = await prisma.installment.findMany({
    where: {
      status: "OVERDUE",
    },
    include: {
      loan: {
        include: {
          borrower: true,
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Categorize by Aging Buckets
  const enrichedItems = overdueInstallments.map((inst) => {
    const daysOverdue = Math.max(1, differenceInDays(today, new Date(inst.dueDate)));
    const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);

    let bucket = "1-7";
    let priority = "LOW";
    if (daysOverdue > 90) {
      bucket = "90+";
      priority = "CRITICAL";
    } else if (daysOverdue > 60) {
      bucket = "61-90";
      priority = "HIGH";
    } else if (daysOverdue > 30) {
      bucket = "31-60";
      priority = "MEDIUM";
    } else if (daysOverdue > 7) {
      bucket = "8-30";
      priority = "MODERATE";
    }

    return {
      ...inst,
      daysOverdue,
      unpaidAmount,
      bucket,
      priority,
    };
  });

  // Filter based on selected bucket & query
  const filteredItems = enrichedItems.filter((item) => {
    const matchesBucket = selectedBucket === "ALL" || item.bucket === selectedBucket;
    const q = query.toLowerCase();
    const matchesQuery =
      !query ||
      item.loan.borrower.fullName.toLowerCase().includes(q) ||
      item.loan.borrower.phone.includes(q) ||
      item.loan.loanCode.toLowerCase().includes(q);

    return matchesBucket && matchesQuery;
  });

  // Calculate bucket statistics
  const bucketCounts = {
    "1-7": enrichedItems.filter((i) => i.bucket === "1-7").length,
    "8-30": enrichedItems.filter((i) => i.bucket === "8-30").length,
    "31-60": enrichedItems.filter((i) => i.bucket === "31-60").length,
    "61-90": enrichedItems.filter((i) => i.bucket === "61-90").length,
    "90+": enrichedItems.filter((i) => i.bucket === "90+").length,
  };

  const totalOverdueExposure = enrichedItems.reduce((sum, i) => sum + i.unpaidAmount, 0);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Overdue Portfolio & Aging Analysis
              </h1>
              <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                {enrichedItems.length} Overdue Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Aging bucket categorization and recovery follow-up desk.
            </p>
          </div>

          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700 block">
              Total Overdue Exposure
            </span>
            <span className="text-base font-bold text-red-900 font-mono">
              {formatCurrency(totalOverdueExposure)}
            </span>
          </div>
        </div>

        {/* 5-Bucket Filter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Link
            href={`/overdue?bucket=ALL${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`p-3 rounded-lg border text-center transition-colors ${
              selectedBucket === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">All Overdue</div>
            <div className="text-sm font-bold mt-0.5">{enrichedItems.length}</div>
          </Link>

          <Link
            href={`/overdue?bucket=1-7${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`p-3 rounded-lg border text-center transition-colors ${
              selectedBucket === "1-7"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">1–7 Days</div>
            <div className="text-sm font-bold mt-0.5">{bucketCounts["1-7"]}</div>
          </Link>

          <Link
            href={`/overdue?bucket=8-30${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`p-3 rounded-lg border text-center transition-colors ${
              selectedBucket === "8-30"
                ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">8–30 Days</div>
            <div className="text-sm font-bold mt-0.5">{bucketCounts["8-30"]}</div>
          </Link>

          <Link
            href={`/overdue?bucket=31-60${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`p-3 rounded-lg border text-center transition-colors ${
              selectedBucket === "31-60"
                ? "bg-red-600 text-white border-red-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">31–60 Days</div>
            <div className="text-sm font-bold mt-0.5">{bucketCounts["31-60"]}</div>
          </Link>

          <Link
            href={`/overdue?bucket=61-90${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`p-3 rounded-lg border text-center transition-colors ${
              selectedBucket === "61-90"
                ? "bg-red-700 text-white border-red-700 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">61–90 Days</div>
            <div className="text-sm font-bold mt-0.5">{bucketCounts["61-90"]}</div>
          </Link>

          <Link
            href={`/overdue?bucket=90+${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`p-3 rounded-lg border text-center transition-colors ${
              selectedBucket === "90+"
                ? "bg-red-950 text-white border-red-950 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">90+ Days</div>
            <div className="text-sm font-bold mt-0.5">{bucketCounts["90+"]}</div>
          </Link>
        </div>

        {/* Search */}
        <div className="flex justify-end">
          <form method="GET" className="relative w-full sm:w-72">
            <input type="hidden" name="bucket" value={selectedBucket} />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search borrower or loan ID..."
              className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </form>
        </div>

        {/* Overdue Accounts Table */}
        {filteredItems.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No overdue accounts in this bucket</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              All loan accounts for this aging range are up to date.
            </p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Borrower & Phone</th>
                    <th className="px-4 py-3">Loan ID</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-center">Days Overdue</th>
                    <th className="px-4 py-3 text-right">Overdue EMI</th>
                    <th className="px-4 py-3 text-right">Late Fee</th>
                    <th className="px-4 py-3 text-right">Total Outstanding</th>
                    <th className="px-4 py-3 text-center">Aging Bucket</th>
                    <th className="px-4 py-3 text-right">Follow-up Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredItems.map((item) => {
                    const waMsg = `URGENT NOTICE - Rohit Kagdewad Lending\n\nDear ${item.loan.borrower.fullName},\nYour installment #${item.installmentNumber} of ${formatCurrency(item.unpaidAmount)} for Loan ${item.loan.loanCode} is ${item.daysOverdue} DAYS OVERDUE (Due: ${formatDate(item.dueDate)}).\n\nPlease make immediate payment to avoid further penalties.\n\nContact: +91 98765 43210`;
                    const waLink = generateWhatsAppLink(item.loan.borrower.phone, waMsg);

                    return (
                      <tr key={item.id} className="hover:bg-red-50/20">
                        <td className="px-4 py-3">
                          <Link href={`/borrowers/${item.loan.borrower.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {item.loan.borrower.fullName}
                          </Link>
                          <div className="text-[10px] font-mono text-slate-400">
                            +91 {item.loan.borrower.phone} &bull; {item.loan.borrower.city}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-blue-600">
                          <Link href={`/loans/${item.loan.id}`}>{item.loan.loanCode}</Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {formatDate(item.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-md bg-red-100 text-red-800 px-2 py-0.5 font-bold font-mono text-[11px]">
                            {item.daysOverdue} Days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-red-600">
                          {formatCurrency(item.unpaidAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-700">
                          {item.feeDue > 0 ? formatCurrency(item.feeDue) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(item.loan.totalOutstanding)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {item.bucket} days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a href={`tel:${item.loan.borrower.phone}`}>
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Call">
                                <Phone className="h-3.5 w-3.5 text-slate-600" />
                              </Button>
                            </a>

                            <a href={waLink} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </Button>
                            </a>

                            <Link href={`/payments?loanId=${item.loan.id}&borrowerId=${item.loan.borrower.id}&amount=${item.unpaidAmount}`}>
                              <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                Collect
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
