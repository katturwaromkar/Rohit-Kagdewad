import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Receipt,
  CheckCircle2,
} from "lucide-react";

interface CalendarPageProps {
  searchParams: {
    month?: string; // yyyy-MM
    date?: string;  // yyyy-MM-dd
  };
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const today = new Date();
  const currentMonthStr = searchParams.month || format(today, "yyyy-MM");
  const selectedDateStr = searchParams.date || format(today, "yyyy-MM-dd");

  const [yearStr, monthStr] = currentMonthStr.split("-");
  const currentMonthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const selectedDate = parseISO(selectedDateStr);

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch all installments due in this month
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      loan: {
        include: {
          borrower: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Fetch all payments collected in this month
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: "SUCCESS",
    },
    include: {
      borrower: true,
    },
    orderBy: { paymentDate: "asc" },
  });

  // Group by Date String (yyyy-MM-dd)
  const itemsByDate: Record<string, { installments: typeof installments; payments: typeof payments }> = {};
  for (const day of daysInMonth) {
    const key = format(day, "yyyy-MM-dd");
    itemsByDate[key] = { installments: [], payments: [] };
  }

  for (const inst of installments) {
    const key = format(new Date(inst.dueDate), "yyyy-MM-dd");
    if (itemsByDate[key]) {
      itemsByDate[key].installments.push(inst);
    }
  }

  for (const p of payments) {
    const key = format(new Date(p.paymentDate), "yyyy-MM-dd");
    if (itemsByDate[key]) {
      itemsByDate[key].payments.push(p);
    }
  }

  const selectedDateItems = itemsByDate[selectedDateStr] || { installments: [], payments: [] };

  const prevMonthStr = format(subMonths(currentMonthDate, 1), "yyyy-MM");
  const nextMonthStr = format(addMonths(currentMonthDate, 1), "yyyy-MM");

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Collection Calendar (वसुली दिनदर्शिका)
              </h1>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300 font-mono">
                {format(currentMonthDate, "MMMM yyyy")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monthly repayment forecast, collection targets, and received installments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/calendar?month=${prevMonthStr}`}>
              <Button size="sm" variant="outline" className="gap-1 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>
            </Link>

            <Link href="/calendar">
              <Button size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
                Today
              </Button>
            </Link>

            <Link href={`/calendar?month=${nextMonthStr}`}>
              <Button size="sm" variant="outline" className="gap-1 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-4 bg-slate-900 border-slate-800 shadow-xl">
              <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 py-2 uppercase border-b border-slate-800">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-2">
                {/* Empty cells for padding */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[70px] rounded-xl bg-slate-950/40 border border-slate-900" />
                ))}

                {/* Day cells */}
                {daysInMonth.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const isSelected = dateKey === selectedDateStr;
                  const isToday = isSameDay(day, today);
                  const cellData = itemsByDate[dateKey] || { installments: [], payments: [] };
                  const dueCount = cellData.installments.length;
                  const paidCount = cellData.payments.length;

                  return (
                    <Link
                      key={dateKey}
                      href={`/calendar?month=${format(currentMonthDate, "yyyy-MM")}&date=${dateKey}`}
                      className={`min-h-[75px] rounded-xl p-1.5 flex flex-col justify-between border transition-all text-xs ${
                        isSelected
                          ? "border-blue-500 bg-blue-950/60 ring-2 ring-blue-500/40"
                          : isToday
                          ? "border-slate-600 bg-slate-800/80"
                          : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-[11px] rounded-full h-5 w-5 flex items-center justify-center font-mono ${
                            isToday
                              ? "bg-blue-600 text-white"
                              : isSelected
                              ? "bg-blue-500 text-white"
                              : "text-slate-300"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      <div className="space-y-1 mt-1">
                        {dueCount > 0 && (
                          <div className="rounded-md bg-amber-950/80 text-amber-300 border border-amber-800 px-1 py-0.5 text-[9px] font-semibold text-center truncate">
                            {dueCount} Due
                          </div>
                        )}
                        {paidCount > 0 && (
                          <div className="rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-1 py-0.5 text-[9px] font-semibold text-center truncate">
                            {paidCount} Paid
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Selected Date Details Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
              <CardHeader className="py-3.5 px-4 bg-slate-950/60 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
                      {format(selectedDate, "EEEE, dd MMMM yyyy")}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Dues on this date */}
                <div>
                  <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Scheduled Due Repayments ({selectedDateItems.installments.length})</span>
                  </div>

                  {selectedDateItems.installments.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                      No loan installments scheduled for this date.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateItems.installments.map((inst) => {
                        const unpaid = Math.max(0, inst.totalDue - inst.totalPaid);
                        return (
                          <div key={inst.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">{inst.loan.borrower.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {inst.loan.loanCode} &bull; EMI #{inst.installmentNumber}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right font-mono font-bold text-white">
                                {formatCurrency(unpaid)}
                              </div>
                              <Link href={`/payments?loanId=${inst.loan.id}&borrowerId=${inst.loan.borrower.id}&amount=${unpaid}`}>
                                <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                                  Collect
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payments received on this date */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Collections Recorded ({selectedDateItems.payments.length})</span>
                  </div>

                  {selectedDateItems.payments.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                      No payments collected on this date.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateItems.payments.map((p) => (
                        <div key={p.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{p.borrower.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {p.receiptNumber} &bull; {p.paymentMode}
                            </div>
                          </div>

                          <div className="text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(p.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
