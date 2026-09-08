import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import {
  Clock,
  Phone,
  MessageSquare,
  Receipt,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { addDays, endOfWeek, startOfDay, endOfDay } from "date-fns";

interface DuesPageProps {
  searchParams: {
    filter?: string;
    q?: string;
  };
}

export default async function DuesPage({ searchParams }: DuesPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const filter = searchParams.filter || "TODAY";
  const query = searchParams.q || "";

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const tomorrowStart = startOfDay(addDays(today, 1));
  const tomorrowEnd = endOfDay(addDays(today, 1));
  const weekEnd = endOfWeek(today);

  let dateFilter: any = {};
  if (filter === "TODAY") {
    dateFilter = {
      OR: [
        { status: "DUE_TODAY" },
        { dueDate: { lte: todayEnd }, status: { in: ["UPCOMING", "PARTIAL", "OVERDUE", "DUE_TODAY"] } },
      ],
    };
  } else if (filter === "TOMORROW") {
    dateFilter = {
      dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
      status: { in: ["UPCOMING", "PARTIAL"] },
    };
  } else if (filter === "THIS_WEEK") {
    dateFilter = {
      dueDate: { gte: todayStart, lte: weekEnd },
      status: { in: ["UPCOMING", "PARTIAL", "DUE_TODAY"] },
    };
  } else {
    // ALL UNPAID
    dateFilter = {
      status: { in: ["UPCOMING", "DUE_TODAY", "PARTIAL", "OVERDUE"] },
    };
  }

  const whereClause: any = {
    ...dateFilter,
  };

  if (query) {
    whereClause.loan = {
      borrower: {
        OR: [
          { fullName: { contains: query } },
          { phone: { contains: query } },
          { borrowerCode: { contains: query } },
        ],
      },
    };
  }

  const installments = await prisma.installment.findMany({
    where: whereClause,
    include: {
      loan: {
        include: {
          borrower: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalDueAmount = installments.reduce(
    (sum, i) => sum + Math.max(0, i.totalDue - i.totalPaid),
    0
  );

  const filterTabs = [
    { label: "Due Today", value: "TODAY" },
    { label: "Due Tomorrow", value: "TOMORROW" },
    { label: "Due This Week", value: "THIS_WEEK" },
    { label: "All Pending Dues", value: "ALL" },
  ];

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Collections & Dues Queue
              </h1>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {installments.length} Due Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active cashier worklist. Track scheduled EMIs, trigger instant reminders, and collect repayments.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 block">
              Total Target in Current View
            </span>
            <span className="text-base font-bold text-blue-900 font-mono">
              {formatCurrency(totalDueAmount)}
            </span>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={`/dues?filter=${tab.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form method="GET" className="relative w-full md:w-72">
            <input type="hidden" name="filter" value={filter} />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search borrower or phone..."
              className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </form>
        </div>

        {/* Dues Cards List */}
        {installments.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No pending dues found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              All borrowers for the selected filter are up to date on their repayment schedule.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installments.map((inst) => {
              const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);
              const isOverdue = inst.status === "OVERDUE" || inst.dueDate < todayStart;

              const waMsg = `Hello ${inst.loan.borrower.fullName},\n\nThis is a reminder from Rohit Kagdewad Lending regarding your loan (${inst.loan.loanCode}).\n\nInstallment #${inst.installmentNumber}\nDue Date: ${formatDate(inst.dueDate)}\nAmount Due: ${formatCurrency(unpaidAmount)}\n\nPlease make payment via UPI or Cash.\n\nThank you,\nRohit Kagdewad`;
              const waLink = generateWhatsAppLink(inst.loan.borrower.phone, waMsg);

              return (
                <Card
                  key={inst.id}
                  className={`p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow ${
                    isOverdue ? "border-red-200 bg-red-50/10" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/borrowers/${inst.loan.borrower.id}`}>
                          <h3 className="font-bold text-sm text-slate-900 hover:text-blue-600">
                            {inst.loan.borrower.fullName}
                          </h3>
                        </Link>
                        <div className="text-[11px] font-mono text-slate-500">
                          {inst.loan.borrower.borrowerCode} &bull; +91 {inst.loan.borrower.phone}
                        </div>
                      </div>
                      <Badge status={inst.status} />
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Amount Due
                        </span>
                        <div className="text-base font-bold font-mono text-slate-900">
                          {formatCurrency(unpaidAmount)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Due Date
                        </span>
                        <div className="text-xs font-semibold font-mono text-slate-700">
                          {formatDate(inst.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Loan: <Link href={`/loans/${inst.loan.id}`} className="font-mono text-blue-600 font-semibold hover:underline">{inst.loan.loanCode}</Link></span>
                      <span>EMI #{inst.installmentNumber} of {inst.loan.tenurePeriods}</span>
                    </div>
                  </div>

                  {/* 1-Tap Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={`tel:${inst.loan.borrower.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      title="Direct Call"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>Call</span>
                    </a>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Send WhatsApp Message"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>

                    <Link
                      href={`/payments?loanId=${inst.loan.id}&borrowerId=${inst.loan.borrower.id}&amount=${unpaidAmount}`}
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
                        Collect
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
