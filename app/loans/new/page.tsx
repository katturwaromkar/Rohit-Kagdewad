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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const errors: Record<string, string> = {};

    if (!formData.borrowerId) {
      errors.borrowerId = "Please select a borrower (कर्जदार निवडा)";
    }

    const principal = parseFloat(formData.principalAmount);
    if (isNaN(principal) || principal <= 0) {
      errors.principalAmount = "Principal must be greater than 0 (मुद्दल ० पेक्षा जास्त असावे)";
    }

    const rate = parseFloat(formData.interestRate);
    if (isNaN(rate) || rate < 0) {
      errors.interestRate = "Interest rate cannot be negative (व्याजदर ऋण असू नये)";
    }

    const tenure = parseInt(formData.tenurePeriods, 10);
    if (isNaN(tenure) || tenure < 1) {
      errors.tenurePeriods = "Tenure must be at least 1 installment (किमान १ हप्ता आवश्यक)";
    }

    if (!formData.disbursementDate) {
      errors.disbursementDate = "Disbursement date is required";
    }

    if (!formData.firstDueDate) {
      errors.firstDueDate = "First due date is required";
    }

    if (new Date(formData.firstDueDate) < new Date(formData.disbursementDate)) {
      errors.firstDueDate = "First due date cannot be before disbursement date";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fix the errors highlighted in red below.");
      return;
    }

    setIsSubmitting(true);

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
          <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-slate-700 bg-slate-900 text-slate-300">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Create & Disburse New Loan (नवीन कर्ज वितरण)
          </h1>
          <p className="text-xs text-slate-400">
            Configure loan parameters, choose interest calculation model, and inspect the generated repayment schedule.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-950/70 border border-red-800/80 p-4 flex items-start gap-3 text-red-300 text-xs shadow-lg animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="py-3.5 px-5 bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
                  Loan Configuration & Terms (कर्ज अटी व नियम)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Select Borrower (कर्जदार निवडा) <span className="text-red-400">*</span>
                </label>
                {isLoadingBorrowers ? (
                  <div className="text-xs text-slate-400 py-2">Loading borrowers list...</div>
                ) : borrowers.length === 0 ? (
                  <div className="rounded-lg bg-amber-950/40 border border-amber-800/60 p-3 text-amber-300 text-xs">
                    No borrowers found. Please{" "}
                    <Link href="/borrowers/new" className="underline font-bold text-amber-200">
                      add a borrower first
                    </Link>{" "}
                    before creating a loan.
                  </div>
                ) : (
                  <select
                    name="borrowerId"
                    value={formData.borrowerId}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-lg border bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      fieldErrors.borrowerId
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <option value="">-- Choose Borrower --</option>
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fullName} ({b.borrowerCode}) - +91 {b.phone}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.borrowerId && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.borrowerId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Principal Amount (मुद्दल रक्कम ₹) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-semibold">
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
                      className={`w-full rounded-lg border bg-slate-950 pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 ${
                        fieldErrors.principalAmount
                          ? "border-red-500 focus:ring-red-500/20"
                          : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                  </div>
                  {fieldErrors.principalAmount && (
                    <p className="mt-1 text-[11px] text-red-400">{fieldErrors.principalAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Annual Interest Rate (वार्षिक व्याजदर %) <span className="text-red-400">*</span>
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
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3.5 pr-12 py-2.5 text-sm font-mono font-bold text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                      % p.a.
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    टीप: 2% मासिक = 24% वार्षिक (Tip: 2% pm = 24% pa)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Calculation Method (व्याज पद्धत) <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="interestType"
                    value={formData.interestType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none font-medium"
                  >
                    <option value="FLAT_RATE">सरळ व्याज (Flat Rate / Simple Interest)</option>
                    <option value="REDUCING_BALANCE">घटती शिल्लक (Reducing Balance EMI)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Repayment Frequency (हप्ता वारंवारता) <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="repaymentFrequency"
                    value={formData.repaymentFrequency}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none font-medium"
                  >
                    <option value="MONTHLY">मासिक (Monthly)</option>
                    <option value="WEEKLY">साप्ताहिक (Weekly)</option>
                    <option value="BI_WEEKLY">पाक्षिक (Bi-Weekly / Every 2 Weeks)</option>
                    <option value="DAILY">दैनिक (Daily)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Tenure (हप्ते संख्या) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="tenurePeriods"
                    required
                    min={1}
                    max={120}
                    value={formData.tenurePeriods}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Disbursement Date (वाटप तारीख) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="disbursementDate"
                    required
                    value={formData.disbursementDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    First Due Date (पहिला हप्ता) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="firstDueDate"
                    required
                    value={formData.firstDueDate}
                    onChange={handleChange}
                    className={`w-full rounded-lg border bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                      fieldErrors.firstDueDate ? "border-red-500" : "border-slate-700 focus:border-blue-500"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Processing Fee (प्रक्रिया फी ₹)
                  </label>
                  <input
                    type="number"
                    name="processingFee"
                    min={0}
                    value={formData.processingFee}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Late Fee (% / दिवस)
                  </label>
                  <input
                    type="number"
                    name="lateFeeRatePerDay"
                    min={0}
                    step={0.01}
                    value={formData.lateFeeRatePerDay}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Grace Period (दिवस)
                  </label>
                  <input
                    type="number"
                    name="gracePeriodDays"
                    min={0}
                    value={formData.gracePeriodDays}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Collateral / Security Information (गहाण / जामीन तपशील)
                </label>
                <input
                  type="text"
                  name="collateralInfo"
                  placeholder="e.g. Blank Signed Cheque No. 423101, RC Book, Gold ornaments"
                  value={formData.collateralInfo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Remarks / Notes (नोंदी)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Special agreement terms or loan purpose..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/loans">
              <Button type="button" variant="outline" size="md" className="h-10 px-4 border-slate-700 text-slate-300">
                Cancel (रद्द करा)
              </Button>
            </Link>
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 min-w-[170px] shadow-lg shadow-blue-600/20"
            >
              Disburse Loan (कर्ज वितरित करा)
            </Button>
          </div>
        </form>

        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-800 bg-slate-900 text-white shadow-xl">
            <CardHeader className="py-3.5 px-4 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Live Calculation (थेट हिशोब)
                  </CardTitle>
                </div>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                  {formData.interestType === "FLAT_RATE" ? "Flat Interest" : "Reducing EMI"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {calculation ? (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Principal (मुद्दल)</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.principalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Total Interest Expected (एकूण व्याज)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(calculation.totalInterestExpected)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Processing Fee (प्रक्रिया फी)</span>
                    <span className="font-mono text-slate-300">
                      {formatCurrency(calculation.processingFee)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-slate-700 bg-slate-950 px-3 rounded-lg">
                    <span className="font-semibold text-slate-200">Total Repayable (एकूण परतफेड)</span>
                    <span className="font-mono text-base font-bold text-blue-400">
                      {formatCurrency(calculation.totalAmountExpected)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">EMI Installment (नियमित हप्ता)</span>
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

          <Card className="overflow-hidden bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="py-3.5 px-4 bg-slate-800/40 border-b border-slate-800">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Repayment Schedule Preview (हप्ते तक्ता)
              </CardTitle>
            </CardHeader>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2 text-right">Principal</th>
                    <th className="px-3 py-2 text-right">Interest</th>
                    <th className="px-3 py-2 text-right">Total Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {calculation?.installments.map((inst) => (
                    <tr key={inst.installmentNumber} className="hover:bg-slate-800/50">
                      <td className="px-3 py-2 font-bold text-white">
                        {inst.installmentNumber}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">
                        {formatDate(inst.dueDate, "dd/MM/yyyy")}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-300">
                        {formatCurrency(inst.principalDue)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-400">
                        {formatCurrency(inst.interestDue)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-white">
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
      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading loan wizard...</div>}>
        <NewLoanForm />
      </Suspense>
    </AppShell>
  );
}
