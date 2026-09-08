import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Plus,
  Search,
  ChevronRight,
} from "lucide-react";

interface LoansPageProps {
  searchParams: {
    q?: string;
    status?: string;
  };
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const query = searchParams.q || "";
  const statusFilter = searchParams.status || "ALL";

  const where: any = {};
  if (statusFilter !== "ALL") {
    where.status = statusFilter;
  }
  if (query) {
    where.OR = [
      { loanCode: { contains: query } },
      { borrower: { fullName: { contains: query } } },
      { borrower: { phone: { contains: query } } },
    ];
  }

  const [loans, totalCount, activeCount, overdueCount, closedCount] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: {
        borrower: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            borrowerCode: true,
            city: true,
          },
        },
        installments: {
          select: {
            id: true,
            status: true,
            totalDue: true,
            totalPaid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.count(),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.loan.count({ where: { status: "CLOSED" } }),
  ]);

  const totalOutstandingPortfolio = loans
    .filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE")
    .reduce((sum, l) => sum + l.totalOutstanding, 0);

  const statuses = [
    { label: "All Loans (सर्व)", value: "ALL", count: totalCount },
    { label: "Active (सुरू)", value: "ACTIVE", count: activeCount },
    { label: "Overdue (थकीत)", value: "OVERDUE", count: overdueCount },
    { label: "Closed (पूर्ण)", value: "CLOSED", count: closedCount },
  ];

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Loan Portfolio (कर्ज खाती यादी)
              </h1>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {loans.length} {loans.length === 1 ? "Loan" : "Loans"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active principal outstanding: <span className="font-bold text-white font-mono">{formatCurrency(totalOutstandingPortfolio)}</span>
            </p>
          </div>

          <Link href="/loans/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto shadow-lg shadow-blue-600/20 font-semibold h-10 px-4">
              <Plus className="h-4 w-4" />
              <span>Create New Loan (नवीन कर्ज)</span>
            </Button>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {statuses.map((s) => {
              const isActive = statusFilter === s.value;
              return (
                <Link
                  key={s.value}
                  href={`/loans?status=${s.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md font-semibold"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{s.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                      isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {s.count}
                  </span>
                </Link>
              );
            })}
          </div>

          <form method="GET" className="relative w-full md:w-72">
            <input type="hidden" name="status" value={statusFilter} />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search loan code, borrower..."
              className="w-full h-9 rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </form>
        </div>

        {/* Loan Table */}
        {loans.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-8 text-center shadow-lg">
            <CreditCard className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-semibold text-white">No loans found (कोणतीही कर्ज खाती आढळली नाहीत)</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {query ? `No loans match "${query}". Try clearing search.` : "Disburse a new loan with auto-generated repayment schedule."}
            </p>
            {!query && (
              <Link href="/loans/new" className="mt-4">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 px-4">
                  Create First Loan
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Loan Code</th>
                    <th className="px-4 py-3">Borrower</th>
                    <th className="px-4 py-3">Disbursed Date</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3">Rate & Model</th>
                    <th className="px-4 py-3 text-right">Total Expected</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loans.map((loan) => {
                    return (
                      <tr key={loan.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-blue-400">
                          <Link href={`/loans/${loan.id}`} className="hover:underline">
                            {loan.loanCode}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/borrowers/${loan.borrower.id}`} className="font-semibold text-white hover:text-blue-400">
                            {loan.borrower.fullName}
                          </Link>
                          <div className="text-[11px] font-mono text-slate-400">
                            +91 {loan.borrower.phone}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {formatDate(loan.disbursementDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">
                            {loan.interestRate}% p.a.
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {loan.interestType.replace("_", " ")} &bull; {loan.tenurePeriods} {loan.repaymentFrequency.toLowerCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-300">
                          {formatCurrency(loan.totalAmountExpected)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">
                          {formatCurrency(loan.totalOutstanding)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge status={loan.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/loans/${loan.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] gap-1 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800">
                              <span>Schedule</span>
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
