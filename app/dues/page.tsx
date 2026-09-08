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
  Search,
  CheckCircle2,
} from "lucide-react";
import { addDays, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { VoiceQuickButton } from "@/components/ai/VoiceQuickButton";
import { SMSQuickButton } from "@/components/sms/SMSQuickButton";

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
    { label: "Due Today (आज देय)", value: "TODAY" },
    { label: "Due Tomorrow (उद्या देय)", value: "TOMORROW" },
    { label: "Due This Week (या आठवड्यात)", value: "THIS_WEEK" },
    { label: "All Pending Dues (सर्व बाकी)", value: "ALL" },
  ];

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Collections & Dues Queue (वसुली व देय हप्ते)
              </h1>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {installments.length} Due Items
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active cashier worklist. Track scheduled EMIs, trigger instant reminders, and collect repayments.
            </p>
          </div>

          <div className="rounded-xl bg-blue-950/80 border border-blue-800/80 px-4 py-2 text-right shadow-lg">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 block">
              Total Target in Current View (एकूण देय)
            </span>
            <span className="text-base font-bold text-blue-300 font-mono">
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md font-semibold"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form method="GET" className="relative w-full md:w-72">
            <input type="hidden" name="filter" value={filter} />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search borrower or phone..."
              className="w-full h-9 rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </form>
        </div>

        {/* Dues Cards List */}
        {installments.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-8 text-center shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-white">No pending dues found (कोणतीही थकबाकी नाही)</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              All borrowers for the selected filter are up to date on their repayment schedule.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installments.map((inst) => {
              const unpaidAmount = Math.max(0, inst.totalDue - inst.totalPaid);
              const isOverdue = inst.status === "OVERDUE" || inst.dueDate < todayStart;

              const waMsg = `नमस्कार ${inst.loan.borrower.fullName},\n\nरोहित कागदेवाड यांच्याकडून स्मरणपत्र. तुमच्या कर्ज खात्याचा (क्र.: ${inst.loan.loanCode}) हप्ता #${inst.installmentNumber} देय आहे.\n\nदेय तारीख: ${formatDate(inst.dueDate)}\nदेय रक्कम: ₹${unpaidAmount.toLocaleString("en-IN")}\n\nकृपया वेळेवर भरणा करावा. संपर्क: +91 96652 69105`;
              const waLink = generateWhatsAppLink(inst.loan.borrower.phone, waMsg);

              return (
                <Card
                  key={inst.id}
                  className={`p-4 flex flex-col justify-between space-y-4 hover:shadow-xl transition-shadow ${
                    isOverdue ? "border-red-800/80 bg-red-950/20" : "border-slate-800 bg-slate-900"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/borrowers/${inst.loan.borrower.id}`}>
                          <h3 className="font-bold text-sm text-white hover:text-blue-400">
                            {inst.loan.borrower.fullName}
                          </h3>
                        </Link>
                        <div className="text-[11px] font-mono text-slate-400">
                          {inst.loan.borrower.borrowerCode} &bull; +91 {inst.loan.borrower.phone}
                        </div>
                      </div>
                      <Badge status={inst.status} />
                    </div>

                    <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          Amount Due (देय रक्कम)
                        </span>
                        <div className="text-base font-bold font-mono text-white">
                          {formatCurrency(unpaidAmount)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          Due Date (तारीख)
                        </span>
                        <div className="text-xs font-semibold font-mono text-slate-300">
                          {formatDate(inst.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Loan: <Link href={`/loans/${inst.loan.id}`} className="font-mono text-blue-400 font-semibold hover:underline">{inst.loan.loanCode}</Link></span>
                      <span>EMI #{inst.installmentNumber} of {inst.loan.tenurePeriods}</span>
                    </div>
                  </div>

                  {/* 1-Tap Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-4 gap-1.5">
                      <a
                        href={`tel:${inst.loan.borrower.phone}`}
                        className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Direct Call"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>Call</span>
                      </a>

                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 rounded-xl border border-emerald-800/80 bg-emerald-950/40 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                        title="Send WhatsApp Text Message"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WA</span>
                      </a>

                      <SMSQuickButton
                        borrowerName={inst.loan.borrower.fullName}
                        phone={inst.loan.borrower.phone}
                        amount={unpaidAmount}
                        dueDate={formatDate(inst.dueDate)}
                        loanCode={inst.loan.loanCode}
                        type={isOverdue ? "OVERDUE" : "DUE_TODAY"}
                        installmentId={inst.id}
                        borrowerId={inst.loan.borrower.id}
                        variant="compact"
                        className="w-full justify-center text-[11px] py-2 px-1 rounded-xl"
                      />

                      <VoiceQuickButton
                        borrowerName={inst.loan.borrower.fullName}
                        phone={inst.loan.borrower.phone}
                        amount={unpaidAmount}
                        dueDate={formatDate(inst.dueDate)}
                        loanCode={inst.loan.loanCode}
                        type={isOverdue ? "OVERDUE" : "DUE_TODAY"}
                        variant="button"
                        className="w-full justify-center text-[11px] py-2 px-1 rounded-xl"
                      />
                    </div>

                    <Link
                      href={`/payments?loanId=${inst.loan.id}&borrowerId=${inst.loan.borrower.id}&amount=${unpaidAmount}`}
                      className="block"
                    >
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-emerald-600/20">
                        Collect Payment ({formatCurrency(unpaidAmount)})
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
