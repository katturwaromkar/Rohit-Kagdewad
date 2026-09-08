import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import {
  Landmark,
  CreditCard,
  Receipt,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Phone,
  MessageSquare,
  ChevronRight,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Fetch Core Database Aggregations
  const [
    allLoans,
    allBorrowers,
    allPayments,
    dueTodayInstallments,
    overdueInstallments,
  ] = await Promise.all([
    prisma.loan.findMany({
      include: {
        borrower: true,
      },
    }),
    prisma.borrower.findMany({
      include: {
        loans: true,
      },
    }),
    prisma.payment.findMany({
      include: {
        borrower: true,
        loan: true,
      },
      orderBy: { paymentDate: "desc" },
      take: 8,
    }),
    prisma.installment.findMany({
      where: {
        status: { in: ["DUE_TODAY", "PARTIAL"] },
      },
      include: {
        loan: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.installment.findMany({
      where: {
        status: "OVERDUE",
      },
      include: {
        loan: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  // Aggregate Metrics
  const activeLoans = allLoans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE");
  const totalPrincipalLent = allLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalPrincipalOutstanding = activeLoans.reduce((sum, l) => sum + l.principalOutstanding, 0);
  const totalInterestExpected = allLoans.reduce((sum, l) => sum + l.totalInterestExpected, 0);
  const totalAmountOutstanding = activeLoans.reduce((sum, l) => sum + l.totalOutstanding, 0);

  const successfulPayments = allPayments.filter((p) => p.status === "SUCCESS");
  const totalCollectedToday = successfulPayments
    .filter((p) => new Date(p.paymentDate).toISOString().split("T")[0] === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalAmountCollected = allPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalInterestCollected = allPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.interestAllocated, 0);

  // Overdue metrics
  const totalOverdueAmount = overdueInstallments.reduce(
    (sum, i) => sum + Math.max(0, i.totalDue - i.totalPaid),
    0
  );

  const overdueBorrowersCount = allBorrowers.filter((b) => b.status === "OVERDUE").length;
  const activeBorrowersCount = allBorrowers.filter((b) => b.status === "ACTIVE" || b.status === "OVERDUE").length;

  const todayDueTarget = dueTodayInstallments.reduce((sum, i) => sum + Math.max(0, i.totalDue - i.totalPaid), 0);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Top Business Status & Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-none">
                  Rohit Kagdewad Lending Management
                </h1>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                  Live Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Business date: <span className="font-semibold text-slate-700">{formatDate(today, "EEEE, dd MMMM yyyy")}</span> &bull; Timezone: Asia/Kolkata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/payments">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-semibold">
                <Receipt className="h-4 w-4" />
                <span>Record Payment</span>
              </Button>
            </Link>

            <Link href="/loans/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm font-semibold">
                <Plus className="h-4 w-4" />
                <span>New Loan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Primary Financial KPI Metrics Grid (Restrained, Dense, High-Contrast) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Outstanding Balance */}
          <Card className="p-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Outstanding</span>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-2">
              {formatCurrency(totalAmountOutstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Principal: {formatCurrency(totalPrincipalOutstanding)}</span>
              <span className="font-semibold text-slate-700">{activeLoans.length} Loans</span>
            </div>
          </Card>

          {/* Card 2: Today's Collection vs Target */}
          <Card className="p-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Today's Collection</span>
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-2">
              {formatCurrency(totalCollectedToday)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Target Due: {formatCurrency(todayDueTarget)}</span>
              <span className="font-semibold text-emerald-600">
                {todayDueTarget > 0 ? `${Math.round((totalCollectedToday / todayDueTarget) * 100)}%` : "Clear"}
              </span>
            </div>
          </Card>

          {/* Card 3: Total Interest Earned */}
          <Card className="p-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Interest Realized</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-2">
              {formatCurrency(totalInterestCollected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Expected: {formatCurrency(totalInterestExpected)}</span>
              <span className="font-semibold text-slate-700">P&L Profit</span>
            </div>
          </Card>

          {/* Card 4: Overdue Exposure */}
          <Card className="p-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Overdue Exposure</span>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className={`text-xl font-bold font-mono mt-2 ${totalOverdueAmount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {formatCurrency(totalOverdueAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{overdueBorrowersCount} Overdue Borrowers</span>
              {totalOverdueAmount > 0 ? (
                <span className="font-semibold text-red-600">Needs Followup</span>
              ) : (
                <span className="font-semibold text-emerald-600">On Track</span>
              )}
            </div>
          </Card>
        </div>

        {/* Secondary Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-100/70 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Total Capital Lent</span>
            <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{formatCurrency(totalPrincipalLent)}</div>
          </div>

          <div className="rounded-lg bg-slate-100/70 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Total Recovered</span>
            <div className="font-bold text-emerald-700 font-mono text-sm mt-0.5">{formatCurrency(totalAmountCollected)}</div>
          </div>

          <div className="rounded-lg bg-slate-100/70 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Active Borrowers</span>
            <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{activeBorrowersCount} Customers</div>
          </div>

          <div className="rounded-lg bg-slate-100/70 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Total Loans Booked</span>
            <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{allLoans.length} Loans ({allLoans.filter(l => l.status === "CLOSED").length} Closed)</div>
          </div>
        </div>

        {/* Actionable Worklists: Today's Dues & Overdue Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Today's Dues Queue (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Today's Collection Queue ({dueTodayInstallments.length})
                </h2>
              </div>
              <Link href="/dues" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5">
                <span>View Full Queue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {dueTodayInstallments.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 bg-white text-center text-xs text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                All scheduled installments for today have been collected!
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                {dueTodayInstallments.map((inst) => {
                  const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);
                  const waMsg = `Hello ${inst.loan.borrower.fullName}, this is a reminder from Rohit Kagdewad Lending. Your loan installment of ${formatCurrency(unpaidAmount)} (Loan ID: ${inst.loan.loanCode}) is due today. Please make payment. Thank you!`;
                  const waLink = generateWhatsAppLink(inst.loan.borrower.phone, waMsg);

                  return (
                    <div key={inst.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link href={`/borrowers/${inst.loan.borrower.id}`} className="font-semibold text-xs text-slate-900 hover:text-blue-600">
                            {inst.loan.borrower.fullName}
                          </Link>
                          <Badge status={inst.status} />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{inst.loan.loanCode} (EMI #{inst.installmentNumber})</span>
                          <span>&bull;</span>
                          <span>+91 {inst.loan.borrower.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-slate-900">
                            {formatCurrency(unpaidAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400">Due Today</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${inst.loan.borrower.phone}`}>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Call Borrower">
                              <Phone className="h-3.5 w-3.5 text-slate-600" />
                            </Button>
                          </a>

                          <a href={waLink} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-emerald-600 border-emerald-300 hover:bg-emerald-50" title="Send WhatsApp">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          </a>

                          <Link href={`/payments?loanId=${inst.loan.id}&borrowerId=${inst.loan.borrower.id}&amount=${unpaidAmount}`}>
                            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                              Collect
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Overdue Priority Action List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Overdue Accounts ({overdueInstallments.length})
                </h2>
              </div>
              <Link href="/overdue" className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-0.5">
                <span>View All Overdue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {overdueInstallments.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 bg-white text-center text-xs text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                Zero overdue accounts. All borrower repayments are current!
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                {overdueInstallments.map((inst) => {
                  const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);
                  const waMsg = `Urgent Reminder: Hello ${inst.loan.borrower.fullName}, your repayment of ${formatCurrency(unpaidAmount)} for Loan ${inst.loan.loanCode} is OVERDUE (Due date: ${formatDate(inst.dueDate)}). Please clear this immediately to prevent late fee penalties. - Rohit Kagdewad Lending`;
                  const waLink = generateWhatsAppLink(inst.loan.borrower.phone, waMsg);

                  return (
                    <div key={inst.id} className="p-3 flex items-center justify-between gap-3 hover:bg-red-50/20">
                      <div>
                        <Link href={`/borrowers/${inst.loan.borrower.id}`} className="font-semibold text-xs text-slate-900 hover:text-blue-600">
                          {inst.loan.borrower.fullName}
                        </Link>
                        <div className="text-[10px] text-red-600 font-mono">
                          Due: {formatDate(inst.dueDate)} &bull; {inst.loan.loanCode}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right font-mono font-bold text-xs text-red-600">
                          {formatCurrency(unpaidAmount)}
                        </div>
                        <a href={waLink} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] text-emerald-700 border-emerald-300">
                            WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payment Transactions Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Recent Payment Collections
              </h2>
            </div>
            <Link href="/payments" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Payments &rarr;
            </Link>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Borrower</th>
                    <th className="px-4 py-3">Loan</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3 text-right">Amount Received</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 py-3 font-mono">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link href={`/borrowers/${p.borrower.id}`} className="hover:text-blue-600">
                          {p.borrower.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600 font-medium">
                        <Link href={`/loans/${p.loan.id}`}>{p.loan.loanCode}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/payments/${p.id}/receipt`}>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">
                            Receipt
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {allPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
