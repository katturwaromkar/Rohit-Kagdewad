import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  Receipt,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  FileText,
} from "lucide-react";
import { VoiceQuickButton } from "@/components/ai/VoiceQuickButton";

interface LoanDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function LoanDetailsPage({ params }: LoanDetailsPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const loan = await prisma.loan.findUnique({
    where: { id: params.id },
    include: {
      borrower: true,
      installments: {
        orderBy: { installmentNumber: "asc" },
      },
      payments: {
        include: {
          collectedBy: { select: { name: true } },
        },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!loan) {
    notFound();
  }

  // Calculate totals
  const totalPrincipalPaid = loan.installments.reduce((sum, i) => sum + i.principalPaid, 0);
  const totalInterestPaid = loan.installments.reduce((sum, i) => sum + i.interestPaid, 0);
  const totalFeesPaid = loan.installments.reduce((sum, i) => sum + i.feePaid, 0);
  const totalPaidOverall = totalPrincipalPaid + totalInterestPaid + totalFeesPaid;

  const paidInstallmentsCount = loan.installments.filter((i) => i.status === "PAID").length;
  const progressPercent = Math.min(100, Math.round((totalPrincipalPaid / loan.principalAmount) * 100));

  const waReminderMessage = `Hello ${loan.borrower.fullName}, this is a reminder regarding your loan (${loan.loanCode}) with Rohit Kagdewad Lending. Total outstanding balance: ${formatCurrency(loan.totalOutstanding)}. Please ensure payment on or before the due date. Thank you!`;
  const waLink = generateWhatsAppLink(loan.borrower.phone, waReminderMessage);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/loans">
              <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-slate-700 bg-slate-900 text-slate-300">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                  {loan.loanCode}
                </h1>
                <Badge status={loan.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span>
                  Borrower:{" "}
                  <Link href={`/borrowers/${loan.borrower.id}`} className="font-semibold text-blue-400 hover:underline">
                    {loan.borrower.fullName}
                  </Link>
                </span>
                <span>&bull;</span>
                <span>Disbursed: {formatDate(loan.disbursementDate)}</span>
                <span>&bull;</span>
                <span>{loan.interestType.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <VoiceQuickButton
              borrowerName={loan.borrower.fullName}
              phone={loan.borrower.phone}
              amount={loan.totalOutstanding}
              loanCode={loan.loanCode}
              type={loan.status === "OVERDUE" ? "OVERDUE" : "DUE_TODAY"}
              variant="button"
            />

            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60 gap-1.5 h-9">
                <MessageSquare className="h-4 w-4" />
                <span>Text Notice</span>
              </Button>
            </a>

            <Link href={`/payments?loanId=${loan.id}&borrowerId=${loan.borrower.id}`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-lg shadow-emerald-600/20 h-9">
                <Receipt className="h-4 w-4" />
                <span>Record Payment</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Principal Disbursed
            </div>
            <div className="text-base font-bold text-white font-mono mt-1">
              {formatCurrency(loan.principalAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Rate: {loan.interestRate}% p.a.
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Interest Expected
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">
              {formatCurrency(loan.totalInterestExpected)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Total: {formatCurrency(loan.totalAmountExpected)}
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Principal Repaid
            </div>
            <div className="text-base font-bold text-blue-400 font-mono mt-1">
              {formatCurrency(totalPrincipalPaid)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {paidInstallmentsCount} of {loan.tenurePeriods} EMIs paid
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Remaining Outstanding
            </div>
            <div className={`text-base font-bold font-mono mt-1 ${loan.totalOutstanding > 0 ? "text-white" : "text-emerald-400"}`}>
              {formatCurrency(loan.totalOutstanding)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {loan.status === "CLOSED" ? "Fully Settled" : "Active Balance"}
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-4 border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300">Loan Repayment Progress (कर्ज परतफेड प्रगती)</span>
            <span className="font-mono font-bold text-white">
              {progressPercent}% Principal Recovered ({formatCurrency(totalPrincipalPaid)} / {formatCurrency(loan.principalAmount)})
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        {/* Repayment Schedule Table */}
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
                Installment Repayment Schedule ({loan.installments.length} Installments)
              </CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Principal Due</th>
                  <th className="px-4 py-3 text-right">Interest Due</th>
                  <th className="px-4 py-3 text-right">Late Fee</th>
                  <th className="px-4 py-3 text-right">Total Due</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loan.installments.map((inst) => {
                  const unpaidRemaining = Math.max(0, inst.totalDue - inst.totalPaid);
                  return (
                    <tr key={inst.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {inst.installmentNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {formatDate(inst.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {formatCurrency(inst.principalDue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">
                        {formatCurrency(inst.interestDue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {inst.feeDue > 0 ? formatCurrency(inst.feeDue) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {formatCurrency(inst.totalDue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-400">
                        {inst.totalPaid > 0 ? formatCurrency(inst.totalPaid) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={inst.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inst.status !== "PAID" && (
                          <Link href={`/payments?loanId=${loan.id}&borrowerId=${loan.borrower.id}&amount=${unpaidRemaining}`}>
                            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                              Collect
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
