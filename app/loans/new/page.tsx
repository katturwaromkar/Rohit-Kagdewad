"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateLoanSchedule } from "@/lib/financial";
import {
  ArrowLeft,
  CreditCard,
  Calculator,
  Calendar,
  AlertCircle,
  Percent,
  Coins,
  CheckCircle2,
} from "lucide-react";

function NewLoanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBorrowerId = searchParams.get("borrowerId") || "";

  const [borrowers, setBorrowers] = useState<Array<{ id: string; fullName: string; phone: string; borrowerCode: string }>>([]);
  const [isLoadingBorrowers, setIsLoadingBorrowers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    borrowerId: preselectedBorrowerId,
    principalAmount: "50000",
    interestRate: "24",
    interestType: "FLAT_RATE" as "FLAT_RATE" | "REDUCING_BALANCE",
    repaymentFrequency: "MONTHLY" as "DAILY" | "WEEKLY" | "BI_WEEKLY" | "MONTHLY",
    tenurePeriods: "5",
    disbursementDate: todayStr,
    firstDueDate: nextMonthStr,
    processingFee: "500",
    lateFeeRatePerDay: "0.1",
    gracePeriodDays: "3",
    notes: "",
    collateralInfo: "",
  });

  useEffect(() => {
    async function loadBorrowers() {
      try {
        const res = await fetch("/api/borrowers");
        const data = await res.json();
        if (res.ok && data.borrowers) {
          setBorrowers(data.borrowers);
          if (!formData.borrowerId && data.borrowers.length > 0) {
            setFormData((prev) => ({ ...prev, borrowerId: data.borrowers[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load borrowers:", err);
      } finally {
        setIsLoadingBorrowers(false);
      }
    }
    loadBorrowers();
  }, []);

  const calculation = useMemo(() => {
    try {
      const p = parseFloat(formData.principalAmount) || 0;
      const r = parseFloat(formData.interestRate) || 0;
      const n = parseInt(formData.tenurePeriods, 10) || 1;
      const fee = parseFloat(formData.processingFee) || 0;

      if (p <= 0 || n <= 0) return null;

      return generateLoanSchedule({
        principalAmount: p,
        interestRate: r,
        interestType: formData.interestType,
        repaymentFrequency: formData.repaymentFrequency,
        tenurePeriods: n,
        disbursementDate: formData.disbursementDate,
        firstDueDate: formData.firstDueDate,
        processingFee: fee,
      });
    } catch {
      return null;
    }
  }, [
    formData.principalAmount,
    formData.interestRate,
    formData.interestType,
    formData.repaymentFrequency,
    formData.tenurePeriods,
    formData.disbursementDate,
    formData.firstDueDate,
    formData.processingFee,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    if (!formData.borrowerId) {
      setErrorMsg("Please select a borrower.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to disburse loan.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/loans/${data.loan.id}`);
      router.refresh();
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/loans">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Create & Disburse New Loan
          </h1>
          <p className="text-xs text-slate-500">
            Configure loan parameters, choose interest calculation model, and inspect the generated repayment schedule.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Borrower & Loan Origination</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Borrower <span className="text-red-500">*</span>
                </label>
                {isLoadingBorrowers ? (
                  <div className="text-xs text-slate-400 py-2">Loading borrowers list...</div>
                ) : (
                  <select
                    name="borrowerId"
                    value={formData.borrowerId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    <option value="">-- Choose Borrower --</option>
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fullName} ({b.borrowerCode}) - +91 {b.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="principalAmount"
                      required
                      min={100}
                      step={100}
                      value={formData.principalAmount}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interest Rate (% per annum) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="interestRate"
                      required
                      min={0}
                      step={0.1}
                      value={formData.interestRate}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300 pl-3 pr-8 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      % p.a.
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Tip: 2% per month = 24% p.a.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculation Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="interestType"
                    value={formData.interestType}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    <option value="FLAT_RATE">Flat / Simple Interest</option>
                    <option value="REDUCING_BALANCE">Reducing Balance (Amortized EMI)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repayment Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="repaymentFrequency"
                    value={formData.repaymentFrequency}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BI_WEEKLY">Bi-Weekly (Every 2 Weeks)</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenure (Installments) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="tenurePeriods"
                    required
                    min={1}
                    max={120}
                    value={formData.tenurePeriods}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disbursement Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="disbursementDate"
                    required
                    value={formData.disbursementDate}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="firstDueDate"
                    required
                    value={formData.firstDueDate}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Processing Fee (₹)
                  </label>
                  <input
                    type="number"
                    name="processingFee"
                    min={0}
                    value={formData.processingFee}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Late Fee Rate (% / day)
                  </label>
                  <input
                    type="number"
                    name="lateFeeRatePerDay"
                    min={0}
                    step={0.01}
                    value={formData.lateFeeRatePerDay}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    name="gracePeriodDays"
                    min={0}
                    value={formData.gracePeriodDays}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collateral / Security Information (Optional)
                </label>
                <input
                  type="text"
                  name="collateralInfo"
                  placeholder="e.g. Blank Signed Cheque No. 423101, Vehicle RC Book"
                  value={formData.collateralInfo}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Terms Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Agreed repayment terms or borrower agreement notes..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/loans">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[160px] shadow-sm"
            >
              Confirm & Disburse Loan
            </Button>
          </div>
        </form>

        <div className="lg:col-span-5 space-y-4">
          <Card className="border-blue-200 bg-slate-900 text-white">
            <CardHeader className="py-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Live Calculation Summary
                  </CardTitle>
                </div>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                  {formData.interestType === "FLAT_RATE" ? "Flat Interest" : "Reducing EMI"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {calculation ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Principal Lent</span>
                    <span className="font-mono font-semibold text-white">
                      {formatCurrency(calculation.principalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Interest Expected</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {formatCurrency(calculation.totalInterestExpected)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Processing Fee</span>
                    <span className="font-mono text-slate-300">
                      {formatCurrency(calculation.processingFee)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-700 bg-slate-950/40 px-2 rounded">
                    <span className="font-semibold text-slate-200">Total Repayable</span>
                    <span className="font-mono text-base font-bold text-blue-400">
                      {formatCurrency(calculation.totalAmountExpected)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Standard Installment (EMI)</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.installmentAmount)} / {formData.repaymentFrequency.toLowerCase()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  Enter valid principal and tenure to see live calculation.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="py-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Repayment Schedule Breakdown
              </CardTitle>
            </CardHeader>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2 text-right">Principal</th>
                    <th className="px-3 py-2 text-right">Interest</th>
                    <th className="px-3 py-2 text-right">Total Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculation?.installments.map((inst) => (
                    <tr key={inst.installmentNumber} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-semibold text-slate-900">
                        {inst.installmentNumber}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px]">
                        {formatDate(inst.dueDate, "dd/MM/yyyy")}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">
                        {formatCurrency(inst.principalDue)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700">
                        {formatCurrency(inst.interestDue)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inst.totalDue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewLoanPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading loan wizard...</div>}>
        <NewLoanForm />
      </Suspense>
    </AppShell>
  );
}
