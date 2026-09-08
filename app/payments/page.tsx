"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { allocatePayment } from "@/lib/financial";
import {
  Receipt,
  Plus,
  Search,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Phone,
  Filter,
} from "lucide-react";

interface PaymentItem {
  id: string;
  receiptNumber: string;
  amount: number;
  principalAllocated: number;
  interestAllocated: number;
  lateFeeAllocated: number;
  paymentDate: string;
  paymentMode: string;
  referenceNumber?: string;
  status: string;
  reversalReason?: string;
  borrower: {
    id: string;
    fullName: string;
    phone: string;
    borrowerCode: string;
  };
  loan: {
    id: string;
    loanCode: string;
    totalOutstanding: number;
  };
  collectedBy: {
    name: string;
  };
}

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBorrowerId = searchParams.get("borrowerId") || "";
  const preselectedLoanId = searchParams.get("loanId") || "";
  const preselectedAmount = searchParams.get("amount") || "";

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [selectedBorrowerLoans, setSelectedBorrowerLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  // Reversal Modal State
  const [reversalTarget, setReversalTarget] = useState<PaymentItem | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);
  const [reversalError, setReversalError] = useState("");

  // Collection Form State
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [formData, setFormData] = useState({
    borrowerId: preselectedBorrowerId,
    loanId: preselectedLoanId,
    amount: preselectedAmount,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "CASH" as "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
    referenceNumber: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userRes, payRes, borRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/payments"),
        fetch("/api/borrowers"),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUser(u.user);
      }
      if (payRes.ok) {
        const p = await payRes.json();
        setPayments(p.payments || []);
      }
      if (borRes.ok) {
        const b = await borRes.json();
        setBorrowers(b.borrowers || []);
      }
    } catch (err) {
      console.error("Error loading payments data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!formData.borrowerId) {
      setSelectedBorrowerLoans([]);
      return;
    }
    const b = borrowers.find((x) => x.id === formData.borrowerId);
    if (b && b.loans) {
      const activeL = b.loans.filter((l: any) => l.status === "ACTIVE" || l.status === "OVERDUE");
      setSelectedBorrowerLoans(activeL);
      if (activeL.length > 0 && !formData.loanId) {
        setFormData((prev) => ({ ...prev, loanId: activeL[0].id }));
      }
    }
  }, [formData.borrowerId, borrowers]);

  const [selectedLoanInstallments, setSelectedLoanInstallments] = useState<any[]>([]);

  useEffect(() => {
    if (!formData.loanId) return;
    async function loadLoanDetails() {
      try {
        const res = await fetch(`/api/loans/${formData.loanId}`);
        if (res.ok) {
          const d = await res.json();
          setSelectedLoanInstallments(d.loan?.installments || []);
        }
      } catch (err) {
        console.error("Failed to load loan installments:", err);
      }
    }
    loadLoanDetails();
  }, [formData.loanId]);

  const allocationPreview = useMemo(() => {
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0 || selectedLoanInstallments.length === 0) return null;

    try {
      return allocatePayment(
        amt,
        selectedLoanInstallments,
        new Date(formData.paymentDate)
      );
    } catch {
      return null;
    }
  }, [formData.amount, selectedLoanInstallments, formData.paymentDate]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollectionError("");
    setIsCollecting(true);

    if (!formData.borrowerId || !formData.loanId || !formData.amount) {
      setCollectionError("Please fill all required fields.");
      setIsCollecting(false);
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setCollectionError(data.error || "Failed to record payment.");
        setIsCollecting(false);
        return;
      }

      setFormData({
        borrowerId: "",
        loanId: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: "CASH",
        referenceNumber: "",
        notes: "",
      });
      await loadData();
      setIsCollecting(false);
      router.push(`/payments/${data.payment.id}/receipt`);
    } catch (err) {
      setCollectionError("Network error. Please try again.");
      setIsCollecting(false);
    }
  };

  const handleReversePayment = async () => {
    if (!reversalTarget || !reversalReason.trim()) {
      setReversalError("Please provide a reason for reversing this transaction.");
      return;
    }

    setIsReversing(true);
    setReversalError("");

    try {
      const res = await fetch(`/api/payments/${reversalTarget.id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reversalReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReversalError(data.error || "Failed to reverse payment.");
        setIsReversing(false);
        return;
      }

      setReversalTarget(null);
      setReversalReason("");
      setIsReversing(false);
      await loadData();
    } catch (err) {
      setReversalError("Network error. Please try again.");
      setIsReversing(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesMode = modeFilter === "ALL" || p.paymentMode === modeFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      p.receiptNumber.toLowerCase().includes(q) ||
      p.borrower.fullName.toLowerCase().includes(q) ||
      p.borrower.phone.includes(q) ||
      p.loan.loanCode.toLowerCase().includes(q) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q));

    return matchesStatus && matchesMode && matchesQuery;
  });

  const totalCollectedToday = payments
    .filter((p) => p.status === "SUCCESS" && p.paymentDate.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell user={currentUser}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Payment Collections & Receipts
              </h1>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {payments.length} Transactions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Log daily collections, inspect instant allocation hierarchy, and generate customer receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                Total Collected Today
              </span>
              <span className="text-sm font-bold text-emerald-800 font-mono">
                {formatCurrency(totalCollectedToday)}
              </span>
            </div>
          </div>
        </div>

        <Card className="border-blue-200 bg-white shadow-xs">
          <CardHeader className="py-3.5 bg-blue-50/40 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Record New Payment Collection
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {collectionError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 text-red-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{collectionError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Borrower <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.borrowerId}
                    onChange={(e) => setFormData({ ...formData, borrowerId: e.target.value, loanId: "" })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    <option value="">-- Choose Borrower --</option>
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fullName} ({b.borrowerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Loan <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.loanId}
                    onChange={(e) => setFormData({ ...formData, loanId: e.target.value })}
                    disabled={!formData.borrowerId || selectedBorrowerLoans.length === 0}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium disabled:bg-slate-100"
                  >
                    <option value="">-- Choose Loan --</option>
                    {selectedBorrowerLoans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.loanCode} - Outstanding: ₹{l.totalOutstanding.toFixed(0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      step={1}
                      placeholder="e.g. 11000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e: any) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UTR / Ref No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-423456789012 / Cheque #102931"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in office / Collected on site"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {allocationPreview && (
                <div className="rounded-lg bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Allocation Hierarchy:</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span>
                      Late Fees: <strong className="text-amber-400">{formatCurrency(allocationPreview.totalFeeAllocated)}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Interest: <strong className="text-emerald-400">{formatCurrency(allocationPreview.totalInterestAllocated)}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Principal: <strong className="text-blue-400">{formatCurrency(allocationPreview.totalPrincipalAllocated)}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="md"
                  isLoading={isCollecting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[170px] shadow-sm font-semibold"
                >
                  Confirm & Print Receipt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Payment Transactions Register
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="REVERSED">Reversed Only</option>
              </select>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>

              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter receipt, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white py-1 pl-8 pr-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Borrower</th>
                    <th className="px-4 py-3">Loan</th>
                    <th className="px-4 py-3">Mode & Ref</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Interest</th>
                    <th className="px-4 py-3 text-right">Fee</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((p) => {
                    const isReversed = p.status === "REVERSED";
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/80 ${isReversed ? "bg-red-50/30 opacity-75" : ""}`}>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          {p.receiptNumber}
                        </td>
                        <td className="px-4 py-3 font-mono">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/borrowers/${p.borrower.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {p.borrower.fullName}
                          </Link>
                          <div className="text-[10px] font-mono text-slate-400">+91 {p.borrower.phone}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-blue-600 font-medium">
                          <Link href={`/loans/${p.loan.id}`}>{p.loan.loanCode}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{p.paymentMode}</span>
                          {p.referenceNumber && (
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {p.referenceNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {formatCurrency(p.principalAllocated)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {formatCurrency(p.interestAllocated)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {formatCurrency(p.lateFeeAllocated)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${isReversed ? "text-slate-400 line-through" : "text-emerald-700"}`}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge status={p.status} />
                          {isReversed && p.reversalReason && (
                            <span className="block text-[9px] text-red-600 mt-0.5 truncate max-w-[100px]" title={p.reversalReason}>
                              {p.reversalReason}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/payments/${p.id}/receipt`}>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Receipt</span>
                              </Button>
                            </Link>

                            {!isReversed && currentUser?.role === "OWNER" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReversalTarget(p)}
                                title="Reverse payment transaction (Owner only)"
                                className="h-7 px-2 text-[11px] text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        No payments found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {reversalTarget && (
          <Modal
            isOpen={!!reversalTarget}
            onClose={() => {
              setReversalTarget(null);
              setReversalError("");
            }}
            title="Confirm Payment Reversal"
            description="Reversing this transaction will restore the installment balances, overdue status, and update borrower ledger."
          >
            <div className="space-y-4 text-xs">
              <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 space-y-1.5 text-red-900">
                <div className="font-semibold text-sm">Receipt: {reversalTarget.receiptNumber}</div>
                <div>Borrower: {reversalTarget.borrower.fullName}</div>
                <div>Amount: <span className="font-bold font-mono">{formatCurrency(reversalTarget.amount)}</span></div>
                <div>Payment Date: {formatDate(reversalTarget.paymentDate)}</div>
              </div>

              {reversalError && (
                <div className="rounded-md bg-red-100 p-2.5 text-red-800 text-xs">
                  {reversalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Reversal Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the audit reason for reversal (e.g. Incorrect amount entered / Cheque bounced / Duplicate entry)..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReversalTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isLoading={isReversing}
                  onClick={handleReversePayment}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Reversal
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
