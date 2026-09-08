import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MessageSquare,
  ChevronRight,
  Filter,
  ArrowUpRight,
} from "lucide-react";

interface BorrowersPageProps {
  searchParams: {
    q?: string;
    status?: string;
  };
}

export default async function BorrowersPage({ searchParams }: BorrowersPageProps) {
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
      { fullName: { contains: query } },
      { phone: { contains: query } },
      { borrowerCode: { contains: query } },
      { city: { contains: query } },
      { occupation: { contains: query } },
    ];
  }

  const [borrowers, totalCount, activeCount, overdueCount] = await Promise.all([
    prisma.borrower.findMany({
      where,
      include: {
        loans: {
          select: {
            id: true,
            loanCode: true,
            principalAmount: true,
            totalOutstanding: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.borrower.count(),
    prisma.borrower.count({ where: { status: "ACTIVE" } }),
    prisma.borrower.count({ where: { status: "OVERDUE" } }),
  ]);

  const statuses = [
    { label: "All Borrowers", value: "ALL", count: totalCount },
    { label: "Active", value: "ACTIVE", count: activeCount },
    { label: "Overdue", value: "OVERDUE", count: overdueCount },
  ];

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Borrower Directory
              </h1>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {borrowers.length} {borrowers.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage borrower profiles, loan limits, credit history, and KYC records.
            </p>
          </div>

          <Link href="/borrowers/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto shadow-sm">
              <UserPlus className="h-4 w-4" />
              <span>Add New Borrower</span>
            </Button>
          </Link>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {statuses.map((s) => {
              const isActive = statusFilter === s.value;
              return (
                <Link
                  key={s.value}
                  href={`/borrowers?status=${s.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{s.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] ${
                      isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Search Form */}
          <form method="GET" className="relative w-full md:w-72">
            <input type="hidden" name="status" value={statusFilter} />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search name, phone, code..."
              className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </form>
        </div>

        {/* Borrower Content */}
        {borrowers.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <Users className="h-10 w-10 text-slate-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No borrowers found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {query ? `No records match "${query}". Try clearing search.` : "Add your first borrower to start creating loans and managing repayments."}
            </p>
            {!query && (
              <Link href="/borrowers/new" className="mt-4">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add First Borrower
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Code & Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Location / Occupation</th>
                    <th className="px-4 py-3 text-center">Active Loans</th>
                    <th className="px-4 py-3 text-right">Total Outstanding</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {borrowers.map((b) => {
                    const activeLoans = b.loans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE");
                    const totalOutstanding = b.loans
                      .filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE")
                      .reduce((sum, l) => sum + l.totalOutstanding, 0);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <Link href={`/borrowers/${b.id}`} className="hover:text-blue-600 group flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                                {b.fullName}
                              </div>
                              <div className="font-mono text-[11px] text-slate-400">
                                {b.borrowerCode}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-800 font-mono">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>+91 {b.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{b.occupation || "-"}</div>
                          <div className="text-[11px] text-slate-400">{b.city}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                            {activeLoans.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(totalOutstanding)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge status={b.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/borrowers/${b.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] gap-1">
                              <span>Profile</span>
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

            {/* Mobile Card List View */}
            <div className="divide-y divide-slate-200 md:hidden">
              {borrowers.map((b) => {
                const activeLoans = b.loans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE");
                const totalOutstanding = b.loans
                  .filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE")
                  .reduce((sum, l) => sum + l.totalOutstanding, 0);

                return (
                  <div key={b.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/borrowers/${b.id}`}>
                          <h4 className="font-semibold text-sm text-slate-900 hover:text-blue-600">
                            {b.fullName}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-500">
                            {b.borrowerCode}
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-xs text-slate-500">{b.city}</span>
                        </div>
                      </div>
                      <Badge status={b.status} />
                    </div>

                    <div className="flex items-center justify-between rounded-md bg-slate-50 p-2.5 border border-slate-100">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Outstanding
                        </div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(totalOutstanding)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Active Loans
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          {activeLoans.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${b.phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/91${b.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <Link href={`/borrowers/${b.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
