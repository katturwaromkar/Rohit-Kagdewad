import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FinancialCharts } from "@/components/dashboard/FinancialCharts";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import {
  Landmark,
  CreditCard,
  Receipt,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  Phone,
  MessageSquare,
  ChevronRight,
  Plus,
  CheckCircle2,
  FileSpreadsheet,
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
  const overdueLoans = allLoans.filter((l) => l.status === "OVERDUE");
  const closedLoans = allLoans.filter((l) => l.status === "CLOSED" || l.status === "PAID_OFF");

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

  // Calculate Past 6 Months Monthly Trend Data
  const past6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(today, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const monthLabel = format(d, "MMM yyyy");

    const monthPayments = successfulPayments.filter((p) => {
      const pDate = new Date(p.paymentDate);
      return pDate >= start && pDate <= end;
    });

    const monthLoans = allLoans.filter((l) => {
      const lDate = new Date(l.disbursementDate);
      return lDate >= start && lDate <= end;
    });

    const collected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const disbursed = monthLoans.reduce((sum, l) => sum + l.principalAmount, 0);

    return {
      month: monthLabel,
      collected,
      disbursed,
    };
  });

  const portfolioStats = {
    activeCount: activeLoans.length,
    overdueCount: overdueLoans.length,
    closedCount: closedLoans.length,
    activeAmount: activeLoans.reduce((sum, l) => sum + l.totalOutstanding, 0),
    overdueAmount: overdueLoans.reduce((sum, l) => sum + l.totalOutstanding, 0),
    closedAmount: closedLoans.reduce((sum, l) => sum + l.totalAmountExpected, 0),
  };

  return (
    <AppShell user={user}>
      <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
        {/* Top Business Status & Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-800 shadow-xl w-full overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Landmark className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                  Rohit Kagdewad Lending
                </h1>
                <span className="rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {formatDate(today, "EEE, dd MMM yyyy")} &bull; IST
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
            <Link href="/payments" className="w-full sm:w-auto">
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-lg shadow-emerald-600/20 font-semibold h-9 px-3 text-xs justify-center">
                <Receipt className="h-4 w-4 shrink-0" />
                <span className="truncate">Record Payment</span>
              </Button>
            </Link>

            <Link href="/loans/new" className="w-full sm:w-auto">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-lg shadow-blue-600/20 font-semibold h-9 px-3 text-xs justify-center">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">New Loan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Primary Financial KPI Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">
          {/* Card 1: Total Outstanding Balance */}
          <Card className="p-3 sm:p-4 bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
              <span className="truncate">Outstanding</span>
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0 ml-1" />
            </div>
            <div className="text-base sm:text-2xl font-bold font-mono text-white mt-1.5 truncate">
              {formatCurrency(totalAmountOutstanding)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 flex items-center justify-between truncate">
              <span className="truncate">Active: {activeLoans.length}</span>
              <span className="font-semibold text-blue-400 ml-1 shrink-0">Loans</span>
            </div>
          </Card>

          {/* Card 2: Today's Collection vs Target */}
          <Card className="p-3 sm:p-4 bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
              <span className="truncate">Today's Inflow</span>
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0 ml-1" />
            </div>
            <div className="text-base sm:text-2xl font-bold font-mono text-emerald-400 mt-1.5 truncate">
              {formatCurrency(totalCollectedToday)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 flex items-center justify-between truncate">
              <span className="truncate">Due: {formatCurrency(todayDueTarget)}</span>
              <span className="font-semibold text-emerald-400 ml-1 shrink-0">
                {todayDueTarget > 0 ? `${Math.round((totalCollectedToday / todayDueTarget) * 100)}%` : "Clear"}
              </span>
            </div>
          </Card>

          {/* Card 3: Total Interest Earned */}
          <Card className="p-3 sm:p-4 bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
              <span className="truncate">Interest Earned</span>
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0 ml-1" />
            </div>
            <div className="text-base sm:text-2xl font-bold font-mono text-white mt-1.5 truncate">
              {formatCurrency(totalInterestCollected)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 flex items-center justify-between truncate">
              <span className="truncate">Net Profit</span>
              <span className="font-semibold text-emerald-400 ml-1 shrink-0">Realized</span>
            </div>
          </Card>

          {/* Card 4: Overdue Exposure */}
          <Card className="p-3 sm:p-4 bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
              <span className="truncate">Overdue Risk</span>
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 shrink-0 ml-1" />
            </div>
            <div className={`text-base sm:text-2xl font-bold font-mono mt-1.5 truncate ${totalOverdueAmount > 0 ? "text-red-400" : "text-white"}`}>
              {formatCurrency(totalOverdueAmount)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 flex items-center justify-between truncate">
              <span className="truncate">{overdueBorrowersCount} Overdue</span>
              <span className={`font-semibold ml-1 shrink-0 ${totalOverdueAmount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {totalOverdueAmount > 0 ? "Action" : "Clear"}
              </span>
            </div>
          </Card>
        </div>

        {/* Secondary Metric Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
          <div className="rounded-xl bg-slate-900/90 p-2.5 sm:p-3.5 border border-slate-800 text-xs overflow-hidden">
            <span className="text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase block truncate">Total Disbursed (वाटप)</span>
            <div className="font-bold text-white font-mono text-xs sm:text-sm mt-0.5 truncate">{formatCurrency(totalPrincipalLent)}</div>
          </div>

          <div className="rounded-xl bg-slate-900/90 p-2.5 sm:p-3.5 border border-slate-800 text-xs overflow-hidden">
            <span className="text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase block truncate">Total Recovered (वसुली)</span>
            <div className="font-bold text-emerald-400 font-mono text-xs sm:text-sm mt-0.5 truncate">{formatCurrency(totalAmountCollected)}</div>
          </div>

          <div className="rounded-xl bg-slate-900/90 p-2.5 sm:p-3.5 border border-slate-800 text-xs overflow-hidden">
            <span className="text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase block truncate">Borrowers (कर्जदार)</span>
            <div className="font-bold text-white font-mono text-xs sm:text-sm mt-0.5 truncate">{activeBorrowersCount} Active</div>
          </div>

          <div className="rounded-xl bg-slate-900/90 p-2.5 sm:p-3.5 border border-slate-800 text-xs overflow-hidden">
            <span className="text-slate-400 text-[9px] sm:text-[10px] font-semibold uppercase block truncate">Loans Booked (कर्ज)</span>
            <div className="font-bold text-white font-mono text-xs sm:text-sm mt-0.5 truncate">{allLoans.length} ({closedLoans.length} Closed)</div>
          </div>
        </div>

        {/* Visual Graph & Financial Analysis Section */}
        <FinancialCharts monthlyData={past6Months} portfolioStats={portfolioStats} />

        {/* Actionable Worklists: Today's Dues & Overdue Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 w-full overflow-hidden">
          {/* Left: Today's Dues Queue (7 cols) */}
          <div className="lg:col-span-7 space-y-2.5 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                  Today's Dues ({dueTodayInstallments.length})
                </h2>
              </div>
              <Link href="/dues" className="text-[11px] sm:text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 shrink-0">
                <span>View Queue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {dueTodayInstallments.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/60 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                No installments pending for today!
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
                {dueTodayInstallments.map((inst) => {
                  const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);
                  const waMsg = `नमस्कार ${inst.loan.borrower.fullName}, रोहित कागदेवाड यांच्याकडून स्मरणपत्र. तुमच्या कर्ज खात्याचा ₹${unpaidAmount.toLocaleString("en-IN")} हप्ता (कर्ज क्र.: ${inst.loan.loanCode}) आज देय आहे. कृपया भरणा करावा. संपर्क: +91 96652 69105`;
                  const waLink = generateWhatsAppLink(inst.loan.borrower.phone, waMsg);

                  return (
                    <div key={inst.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-800/60 transition-colors">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/borrowers/${inst.loan.borrower.id}`} className="font-semibold text-xs text-white hover:text-blue-400 truncate">
                            {inst.loan.borrower.fullName}
                          </Link>
                          <Badge status={inst.status} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                          <span>{inst.loan.loanCode} (EMI #{inst.installmentNumber})</span>
                          <span>&bull;</span>
                          <span>+91 {inst.loan.borrower.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-bold font-mono text-white">
                            {formatCurrency(unpaidAmount)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400">Due Today</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${inst.loan.borrower.phone}`}>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800" title="Call">
                              <Phone className="h-3 w-3" />
                            </Button>
                          </a>

                          <a href={waLink} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-emerald-400 border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60" title="WhatsApp">
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                          </a>

                          <Link href={`/payments?loanId=${inst.loan.id}&borrowerId=${inst.loan.borrower.id}&amount=${unpaidAmount}`}>
                            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
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
          <div className="lg:col-span-5 space-y-2.5 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                  Overdue Accounts ({overdueInstallments.length})
                </h2>
              </div>
              <Link href="/overdue" className="text-[11px] sm:text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-0.5 shrink-0">
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {overdueInstallments.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/60 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                Zero overdue accounts. All loans are current!
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
                {overdueInstallments.map((inst) => {
                  const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);
                  const waMsg = `तात्काळ सूचना: नमस्कार ${inst.loan.borrower.fullName}, तुमच्या कर्ज खात्याचा (क्र.: ${inst.loan.loanCode}) ₹${unpaidAmount.toLocaleString("en-IN")} हप्ता थकला आहे. लेट फी टाळण्यासाठी आजच संपर्क करा: +91 96652 69105`;
                  const waLink = generateWhatsAppLink(inst.loan.borrower.phone, waMsg);

                  return (
                    <div key={inst.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 hover:bg-red-950/20">
                      <div className="min-w-0">
                        <Link href={`/borrowers/${inst.loan.borrower.id}`} className="font-semibold text-xs text-white hover:text-blue-400 truncate block">
                          {inst.loan.borrower.fullName}
                        </Link>
                        <div className="text-[10px] sm:text-[11px] text-red-400 font-mono mt-0.5 truncate">
                          Due: {formatDate(inst.dueDate)} &bull; {inst.loan.loanCode}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono font-bold text-xs text-red-400">
                          {formatCurrency(unpaidAmount)}
                        </div>
                        <a href={waLink} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-emerald-400 border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60">
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
        <div className="space-y-2.5 w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-blue-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                Recent Collections (अलीकडील जमा)
              </h2>
            </div>
            <Link href="/payments" className="text-[11px] sm:text-xs font-semibold text-blue-400 hover:text-blue-300 shrink-0">
              View All &rarr;
            </Link>
          </div>

          {/* Mobile Card List (Visible only on mobile screen <640px) */}
          <div className="block sm:hidden space-y-2">
            {allPayments.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-mono font-bold text-white truncate">{p.receiptNumber}</div>
                  <div className="font-mono font-bold text-emerald-400">{formatCurrency(p.amount)}</div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="text-white font-medium truncate">{p.borrower.fullName}</div>
                  <div className="text-blue-400 font-mono">{p.loan.loanCode}</div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div>{formatDate(p.paymentDate)} &bull; {p.paymentMode}</div>
                  <Link href={`/payments/${p.id}/receipt`}>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-slate-700 bg-slate-950 text-slate-300">
                      Receipt
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {allPayments.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
                No payments recorded yet.
              </div>
            )}
          </div>

          {/* Desktop Table View (Visible on sm: and up) */}
          <Card className="hidden sm:block overflow-hidden bg-slate-900 border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Borrower</th>
                    <th className="px-4 py-3">Loan</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Amount Received</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        <Link href={`/borrowers/${p.borrower.id}`} className="hover:text-blue-400">
                          {p.borrower.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-400 font-medium">
                        <Link href={`/loans/${p.loan.id}`}>{p.loan.loanCode}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-300">{p.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/payments/${p.id}/receipt`}>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800">
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
