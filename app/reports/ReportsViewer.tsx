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
    { id: "COLLECTIONS", label: "Daily Collections Register", icon: Receipt },
    { id: "INTEREST", label: "Interest Realization (P&L)", icon: TrendingUp },
    { id: "DISBURSEMENTS", label: "Loan Disbursements", icon: CreditCard },
    { id: "AGING", label: "Overdue Aging Exposure", icon: AlertCircle },
    { id: "PORTFOLIO", label: "Borrower Portfolio Statement", icon: FileBarChart },
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
    } else if (reportType === "PORTFOLIO") {
      rows.push(["Borrower Code", "Borrower Name", "Phone", "City", "Occupation", "Total Loans", "Active Loans", "Total Borrowed", "Total Repaid", "Current Outstanding", "Status"]);
      for (const b of borrowers) {
        const bActiveLoans = b.loans.filter((l: any) => l.status === "ACTIVE" || l.status === "OVERDUE");
        const bTotalBorrowed = b.loans.reduce((sum: number, l: any) => sum + l.principalAmount, 0);
        const bTotalRepaid = b.payments.filter((p: any) => p.status === "SUCCESS").reduce((sum: number, p: any) => sum + p.amount, 0);
        const bOutstanding = bActiveLoans.reduce((sum: number, l: any) => sum + l.totalOutstanding, 0);

        rows.push([
          b.borrowerCode,
          b.fullName,
          b.phone,
          b.city,
          b.occupation || "-",
          b.loans.length.toString(),
          bActiveLoans.length.toString(),
          bTotalBorrowed.toString(),
          bTotalRepaid.toString(),
          bOutstanding.toString(),
          b.status,
        ]);
      }
    } else {
      // Overdue aging export
      rows.push(["Borrower Name", "Phone", "Loan Code", "Installment #", "Due Date", "Due Amount", "Status"]);
      for (const inst of overdueInstallments) {
        rows.push([
          inst.loan.borrower.fullName,
          inst.loan.borrower.phone,
          inst.loan.loanCode,
          inst.installmentNumber.toString(),
          formatDate(inst.dueDate),
          (inst.totalDue - inst.totalPaid).toString(),
          inst.status,
        ]);
      }
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((cell) => `"${cell}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Report Switcher & Filter Controls */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 space-y-4">
          {/* Report Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = reportType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportType(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date Range & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
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
                className="gap-1.5 text-xs text-slate-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print Statement</span>
              </Button>

              <Button
                size="sm"
                onClick={exportToCSV}
                className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs font-semibold shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV / Excel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report 1: Daily Collections Register */}
      {reportType === "COLLECTIONS" && (
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Collections Register ({filteredPayments.length} Transactions)
              </CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{p.receiptNumber}</td>
                    <td className="px-4 py-2.5">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900">{p.borrower.fullName}</td>
                    <td className="px-4 py-2.5 text-blue-600 font-medium">{p.loan.loanCode}</td>
                    <td className="px-4 py-2.5 font-sans">{p.paymentMode}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(p.principalAllocated)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(p.interestAllocated)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{formatCurrency(p.lateFeeAllocated)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={5} className="px-4 py-3 font-sans text-xs">Total Collections</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.principalAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.interestAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.lateFeeAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-800 text-sm">
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
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Interest Earned & Profit Register
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{p.receiptNumber}</td>
                    <td className="px-4 py-2.5">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900">{p.borrower.fullName}</td>
                    <td className="px-4 py-2.5 text-blue-600">{p.loan.loanCode}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(p.interestAllocated)}</td>
                    <td className="px-4 py-2.5 text-right text-amber-700">{formatCurrency(p.lateFeeAllocated)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(p.interestAllocated + p.lateFeeAllocated)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={4} className="px-4 py-3 font-sans text-xs">Total Realized Net Profit</td>
                  <td className="px-4 py-3 text-right text-emerald-700">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.interestAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-700">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.lateFeeAllocated, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-800 text-sm">
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
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Loan Disbursement Register ({filteredLoans.length} Loans)
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-200">
                {filteredLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600">{l.loanCode}</td>
                    <td className="px-4 py-2.5 font-mono">{formatDate(l.disbursementDate)}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{l.borrower.fullName}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">{formatCurrency(l.principalAmount)}</td>
                    <td className="px-4 py-2.5">{l.interestRate}% p.a. &bull; {l.interestType.replace("_", " ")}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-700">{formatCurrency(l.totalAmountExpected)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(l.totalOutstanding)}</td>
                    <td className="px-4 py-2.5 text-center"><Badge status={l.status} /></td>
                  </tr>
                ))}
                <tr className="bg-slate-100/80 font-bold text-slate-900 font-mono">
                  <td colSpan={3} className="px-4 py-3 font-sans text-xs">Total Disbursed Capital</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(filteredLoans.reduce((s, l) => s + l.principalAmount, 0))}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right">{formatCurrency(filteredLoans.reduce((s, l) => s + l.totalAmountExpected, 0))}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(filteredLoans.reduce((s, l) => s + l.totalOutstanding, 0))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Report 4: Overdue Aging */}
      {reportType === "AGING" && (
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Overdue Aging Analysis Register
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-200">
                {overdueInstallments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-red-50/20">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{inst.loan.borrower.fullName}</td>
                    <td className="px-4 py-2.5 font-mono">+91 {inst.loan.borrower.phone}</td>
                    <td className="px-4 py-2.5 font-mono text-blue-600">{inst.loan.loanCode}</td>
                    <td className="px-4 py-2.5 font-mono">EMI #{inst.installmentNumber}</td>
                    <td className="px-4 py-2.5 font-mono">{formatDate(inst.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">
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
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Complete Borrower Portfolio Exposure Statement
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-200">
                {borrowers.map((b) => {
                  const activeL = b.loans.filter((l: any) => l.status === "ACTIVE" || l.status === "OVERDUE");
                  const totalB = b.loans.reduce((s: number, l: any) => s + l.principalAmount, 0);
                  const totalR = b.payments.filter((p: any) => p.status === "SUCCESS").reduce((s: number, p: any) => s + p.amount, 0);
                  const outst = activeL.reduce((s: number, l: any) => s + l.totalOutstanding, 0);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 font-mono">
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-900">
                        {b.fullName} <span className="text-[10px] text-slate-400 font-mono">({b.borrowerCode})</span>
                      </td>
                      <td className="px-4 py-2.5">+91 {b.phone}</td>
                      <td className="px-4 py-2.5 font-sans">{b.occupation || b.city}</td>
                      <td className="px-4 py-2.5 text-center">{activeL.length}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-700">{formatCurrency(totalB)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-emerald-700">{formatCurrency(totalR)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(outst)}</td>
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
