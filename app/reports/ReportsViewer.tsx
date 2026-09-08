"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Receipt,
  CreditCard,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface ReportsViewerProps {
  payments: any[];
  loans: any[];
  borrowers: any[];
  overdueInstallments: any[];
  initialReportType?: string;
}

export function ReportsViewer({
  payments,
  loans,
  borrowers,
  overdueInstallments,
  initialReportType = "COLLECTIONS",
}: ReportsViewerProps) {
  const [reportType, setReportType] = useState(initialReportType);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const reportTabs = [
    { id: "COLLECTIONS", label: "Daily Collections Register (वसुली नोंद)", icon: Receipt },
    { id: "INTEREST", label: "Interest Realization P&L (व्याज नफा)", icon: TrendingUp },
    { id: "DISBURSEMENTS", label: "Loan Disbursements (कर्ज वाटप)", icon: CreditCard },
    { id: "AGING", label: "Overdue Aging Exposure (थकबाकी)", icon: AlertCircle },
    { id: "PORTFOLIO", label: "Borrower Portfolio Exposure", icon: FileBarChart },
  ];

  // Filter Payments by date
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = new Date(p.paymentDate).toISOString().split("T")[0];
      if (startDate && pDate < startDate) return false;
      if (endDate && pDate > endDate) return false;
      return true;
    });
  }, [payments, startDate, endDate]);

  // Filter Loans by date
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const dDate = new Date(l.disbursementDate).toISOString().split("T")[0];
      if (startDate && dDate < startDate) return false;
      if (endDate && dDate > endDate) return false;
      return true;
    });
  }, [loans, startDate, endDate]);

  // Export CSV Function
  const exportToCSV = () => {
    let rows: string[][] = [];
    let filename = `report_${reportType.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;

    if (reportType === "COLLECTIONS") {
      rows.push(["Receipt No", "Payment Date", "Borrower Name", "Mobile", "Loan ID", "Payment Mode", "Ref No", "Principal Allocated", "Interest Allocated", "Late Fee Allocated", "Total Received", "Collected By"]);
      for (const p of filteredPayments) {
        rows.push([
          p.receiptNumber,
          formatDate(p.paymentDate),
          p.borrower.fullName,
          p.borrower.phone,
          p.loan.loanCode,
          p.paymentMode,
          p.referenceNumber || "-",
          p.principalAllocated.toString(),
          p.interestAllocated.toString(),
          p.lateFeeAllocated.toString(),
          p.amount.toString(),
          p.collectedBy.name,
        ]);
      }
    } else if (reportType === "DISBURSEMENTS") {
      rows.push(["Loan Code", "Disbursed Date", "Borrower", "Mobile", "Principal Lent", "Interest Rate (%)", "Interest Method", "Tenure", "Total Expected", "Outstanding", "Status"]);
      for (const l of filteredLoans) {
        rows.push([
          l.loanCode,
          formatDate(l.disbursementDate),
          l.borrower.fullName,
          l.borrower.phone,
          l.principalAmount.toString(),
          l.interestRate.toString(),
          l.interestType,
          `${l.tenurePeriods} ${l.repaymentFrequency}`,
          l.totalAmountExpected.toString(),
          l.totalOutstanding.toString(),
          l.status,
        ]);
      }
    } else if (reportType === "INTEREST") {
      rows.push(["Receipt No", "Date", "Borrower", "Loan Code", "Interest Amount", "Late Fee", "Net Income"]);
      for (const p of filteredPayments) {
        rows.push([
          p.receiptNumber,
          formatDate(p.paymentDate),
          p.borrower.fullName,
          p.loan.loanCode,
          p.interestAllocated.toString(),
          p.lateFeeAllocated.toString(),
          (p.interestAllocated + p.lateFeeAllocated).toString(),
        ]);
      }
    } else if (reportType === "AGING") {
      rows.push(["Borrower", "Phone", "Loan Code", "Installment #", "Due Date", "Days Overdue", "Overdue Amount"]);
      for (const inst of overdueInstallments) {
        rows.push([
          inst.loan.borrower.fullName,
          inst.loan.borrower.phone,
          inst.loan.loanCode,
          inst.installmentNumber.toString(),
          formatDate(inst.dueDate),
          (inst.totalDue - inst.totalPaid).toString(),
        ]);
      }
    } else if (reportType === "PORTFOLIO") {
      rows.push(["Borrower Code", "Borrower Name", "Mobile", "City", "Total Borrowed", "Total Repaid", "Current Outstanding", "Status"]);
      for (const b of borrowers) {
        const totalB = b.loans.reduce((s: number, l: any) => s + l.principalAmount, 0);
        const totalR = b.payments.filter((p: any) => p.status === "SUCCESS").reduce((s: number, p: any) => s + p.amount, 0);
        const activeL = b.loans.filter((l: any) => l.status === "ACTIVE" || l.status === "OVERDUE");
        const outst = activeL.reduce((s: number, l: any) => s + l.totalOutstanding, 0);
        rows.push([
          b.borrowerCode,
          b.fullName,
          b.phone,
          b.city || "-",
          totalB.toString(),
          totalR.toString(),
          outst.toString(),
          b.status,
        ]);
      }
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Report Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Export Bar */}
      <Card className="p-4 border-slate-800 bg-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>Date Filter:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-blue-400 hover:underline font-medium ml-1"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="gap-1.5 text-xs h-8"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Statement</span>
            </Button>

            <Button
              size="sm"
              onClick={exportToCSV}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs font-semibold shadow-lg shadow-blue-600/20 h-8"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV / Excel</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Report 1: Daily Collections Register */}
      {reportType === "COLLECTIONS" && (
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Payment Collections Register ({filteredPayments.length} Transactions)
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Borrower Name</th>
                  <th className="px-4 py-3">Loan Code</th>
                  <th className="px-4 py-3">Mode & Ref</th>
                  <th className="px-4 py-3 text-right">Principal</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">Late Fee</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-white">{p.receiptNumber}</td>
                    <td className="px-4 py-2.5 text-slate-400">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-white">{p.borrower.fullName}</td>
                    <td className="px-4 py-2.5 text-blue-400 font-medium">{p.loan.loanCode}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">{p.paymentMode}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{formatCurrency(p.principalAllocated)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{formatCurrency(p.interestAllocated)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{formatCurrency(p.lateFeeAllocated)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="bg-slate-950 font-bold text-white border-t border-slate-800">
                  <td colSpan={5} className="px-4 py-3 font-sans text-xs">Total Collections (एकूण जमा)</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.principalAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.interestAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.lateFeeAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.amount, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Report 2: Interest Realization (P&L) */}
      {reportType === "INTEREST" && (
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Interest Earned & Profit Register (व्याज व दंड नफा)
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Borrower</th>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3 text-right">Interest Collected</th>
                  <th className="px-4 py-3 text-right">Late Fees / Penalty</th>
                  <th className="px-4 py-3 text-right">Total Net Profit Realized</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-white">{p.receiptNumber}</td>
                    <td className="px-4 py-2.5 text-slate-400">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-white">{p.borrower.fullName}</td>
                    <td className="px-4 py-2.5 text-blue-400">{p.loan.loanCode}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">{formatCurrency(p.interestAllocated)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-400">{formatCurrency(p.lateFeeAllocated)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-white">
                      {formatCurrency(p.interestAllocated + p.lateFeeAllocated)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-950 font-bold text-white border-t border-slate-800">
                  <td colSpan={4} className="px-4 py-3 font-sans text-xs">Total Realized Net Profit (एकूण नफा)</td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.interestAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.lateFeeAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + (p.interestAllocated + p.lateFeeAllocated), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Report 3: Loan Disbursements */}
      {reportType === "DISBURSEMENTS" && (
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Loan Disbursement Register ({filteredLoans.length} Loans)
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Loan Code</th>
                  <th className="px-4 py-3">Disbursed Date</th>
                  <th className="px-4 py-3">Borrower</th>
                  <th className="px-4 py-3 text-right">Principal Disbursed</th>
                  <th className="px-4 py-3">Interest Rate & Model</th>
                  <th className="px-4 py-3 text-right">Total Expected</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-400">{l.loanCode}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{formatDate(l.disbursementDate)}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{l.borrower.fullName}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-white">{formatCurrency(l.principalAmount)}</td>
                    <td className="px-4 py-2.5 text-slate-300">{l.interestRate}% p.a. &bull; {l.interestType.replace("_", " ")}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-300">{formatCurrency(l.totalAmountExpected)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-white">{formatCurrency(l.totalOutstanding)}</td>
                    <td className="px-4 py-2.5 text-center"><Badge status={l.status} /></td>
                  </tr>
                ))}
                <tr className="bg-slate-950 font-bold text-white font-mono border-t border-slate-800">
                  <td colSpan={3} className="px-4 py-3 font-sans text-xs">Total Disbursed Capital (एकूण वाटप)</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(filteredLoans.reduce((s, l) => s + l.principalAmount, 0))}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right">{formatCurrency(filteredLoans.reduce((s, l) => s + l.totalAmountExpected, 0))}</td>
                  <td className="px-4 py-3 text-right text-blue-400">{formatCurrency(filteredLoans.reduce((s, l) => s + l.totalOutstanding, 0))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Report 4: Overdue Aging */}
      {reportType === "AGING" && (
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Overdue Aging Analysis Register (थकबाकी वर्गीकरण)
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Borrower Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Installment #</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Overdue Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {overdueInstallments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-rose-950/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-white">{inst.loan.borrower.fullName}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">+91 {inst.loan.borrower.phone}</td>
                    <td className="px-4 py-2.5 font-mono text-blue-400">{inst.loan.loanCode}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-300">EMI #{inst.installmentNumber}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{formatDate(inst.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-400">
                      {formatCurrency(inst.totalDue - inst.totalPaid)}
                    </td>
                    <td className="px-4 py-2.5 text-center"><Badge status={inst.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Report 5: Borrower Portfolio Statement */}
      {reportType === "PORTFOLIO" && (
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Complete Borrower Portfolio Exposure Statement
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code & Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City / Occupation</th>
                  <th className="px-4 py-3 text-center">Active Loans</th>
                  <th className="px-4 py-3 text-right">Total Borrowed</th>
                  <th className="px-4 py-3 text-right">Total Repaid</th>
                  <th className="px-4 py-3 text-right">Current Outstanding</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {borrowers.map((b) => {
                  const activeL = b.loans.filter((l: any) => l.status === "ACTIVE" || l.status === "OVERDUE");
                  const totalB = b.loans.reduce((s: number, l: any) => s + l.principalAmount, 0);
                  const totalR = b.payments.filter((p: any) => p.status === "SUCCESS").reduce((s: number, p: any) => s + p.amount, 0);
                  const outst = activeL.reduce((s: number, l: any) => s + l.totalOutstanding, 0);

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/50 font-mono transition-colors">
                      <td className="px-4 py-2.5 font-sans font-medium text-white">
                        {b.fullName} <span className="text-[10px] text-slate-400 font-mono">({b.borrowerCode})</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">+91 {b.phone}</td>
                      <td className="px-4 py-2.5 font-sans text-slate-300">{b.occupation || b.city}</td>
                      <td className="px-4 py-2.5 text-center text-white">{activeL.length}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-300">{formatCurrency(totalB)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-emerald-400">{formatCurrency(totalR)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-white">{formatCurrency(outst)}</td>
                      <td className="px-4 py-2.5 text-center font-sans"><Badge status={b.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
