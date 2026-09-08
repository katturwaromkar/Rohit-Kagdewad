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
  User,
  Phone,
  MapPin,
  Briefcase,
  Plus,
  Receipt,
  MessageSquare,
  FileText,
  CreditCard,
  Edit,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { CreditScoreBadge } from "@/components/ai/CreditScoreBadge";
import { VoiceQuickButton } from "@/components/ai/VoiceQuickButton";

interface BorrowerProfileProps {
  params: {
    id: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default async function BorrowerProfilePage({ params, searchParams }: BorrowerProfileProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const activeTab = searchParams.tab || "overview";

  const borrower = await prisma.borrower.findUnique({
    where: { id: params.id },
    include: {
      loans: {
        include: {
          installments: {
            orderBy: { installmentNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
      ledgerEntries: {
        orderBy: { entryDate: "desc" },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!borrower) {
    notFound();
  }

  // Calculate Financial Statistics
  const totalBorrowed = borrower.loans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalRepaid = borrower.payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);
  
  const activeLoans = borrower.loans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE");
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.totalOutstanding, 0);

  // Overdue calculation
  let overdueAmount = 0;
  for (const loan of borrower.loans) {
    for (const inst of loan.installments) {
      if (inst.status === "OVERDUE") {
        overdueAmount += Math.max(0, inst.totalDue - inst.totalPaid);
      }
    }
  }

  // Calculate AI Credit Health & Overdue metrics
  let overdueCount = 0;
  let totalDueAcrossLoans = 0;
  let firstOverdueInstallment: any = null;
  let nextPendingInstallment: any = null;

  for (const loan of borrower.loans) {
    for (const inst of loan.installments) {
      totalDueAcrossLoans += inst.totalDue;
      if (inst.status === "OVERDUE") {
        overdueCount += 1;
        if (!firstOverdueInstallment) firstOverdueInstallment = { ...inst, loanCode: loan.loanCode };
      } else if (inst.status === "PENDING" || inst.status === "DUE_TODAY" || inst.status === "UPCOMING") {
        if (!nextPendingInstallment) nextPendingInstallment = { ...inst, loanCode: loan.loanCode };
      }
    }
  }

  const closedLoansCount = borrower.loans.filter((l) => l.status === "CLOSED").length;
  const creditInput = {
    totalLoans: borrower.loans.length,
    activeLoans: activeLoans.length,
    totalBorrowerPaid: totalRepaid,
    totalBorrowerDue: totalDueAcrossLoans || totalBorrowed,
    overdueInstallmentsCount: overdueCount,
    closedLoansCount,
    monthlyIncome: borrower.monthlyIncome ? Number(borrower.monthlyIncome) : null,
  };

  const targetInstallment = firstOverdueInstallment || nextPendingInstallment;

  const tabs = [
    { id: "overview", label: "Overview & KYC" },
    { id: "loans", label: `Loans (${borrower.loans.length})` },
    { id: "payments", label: `Payments (${borrower.payments.length})` },
    { id: "ledger", label: "Financial Ledger" },
    { id: "documents", label: `Documents (${borrower.documents.length})` },
    { id: "whatsapp", label: `WhatsApp Logs (${borrower.messages.length})` },
  ];

  // Default reminder WhatsApp text
  const waReminderMessage = `Hello ${borrower.fullName}, this is a reminder regarding your loan account with Rohit Kagdewad Lending. Current outstanding balance: ${formatCurrency(totalOutstanding)}. Please ensure timely payment. Thank you!`;
  const waLink = generateWhatsAppLink(borrower.phone, waReminderMessage);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Top Back & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/borrowers">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {borrower.fullName}
                </h1>
                <Badge status={borrower.status} />
                <CreditScoreBadge input={creditInput} borrowerName={borrower.fullName} variant="badge" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono flex-wrap">
                <span>Code: {borrower.borrowerCode}</span>
                <span>&bull;</span>
                <span>+91 {borrower.phone}</span>
                <span>&bull;</span>
                <span>{borrower.city}, {borrower.state}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <VoiceQuickButton
              borrowerName={borrower.fullName}
              phone={borrower.phone}
              amount={targetInstallment ? Math.max(0, targetInstallment.totalDue - targetInstallment.totalPaid) : totalOutstanding}
              dueDate={targetInstallment ? formatDate(targetInstallment.dueDate) : undefined}
              loanCode={targetInstallment?.loanCode || activeLoans[0]?.loanCode}
              type={firstOverdueInstallment ? "OVERDUE" : "DUE_TODAY"}
              variant="button"
            />

            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span>Text Msg</span>
              </Button>
            </a>

            <Link href={`/payments?borrowerId=${borrower.id}`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm">
                <Receipt className="h-4 w-4" />
                <span>Record Payment</span>
              </Button>
            </Link>

            <Link href={`/loans/new?borrowerId=${borrower.id}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>New Loan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* High-Density Financial KPI Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-3.5 bg-white border-slate-200">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Borrowed
            </div>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrency(totalBorrowed)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across {borrower.loans.length} loans
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Repaid
            </div>
            <div className="text-base font-bold text-emerald-600 font-mono mt-1">
              {formatCurrency(totalRepaid)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {borrower.payments.length} transactions
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Net Outstanding
            </div>
            <div className="text-base font-bold text-blue-700 font-mono mt-1">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {activeLoans.length} active loans
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Overdue Amount
            </div>
            <div className={`text-base font-bold font-mono mt-1 ${overdueAmount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {formatCurrency(overdueAmount)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {overdueAmount > 0 ? "Requires Follow-up" : "Clear on dues"}
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200 col-span-2 lg:col-span-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Monthly Income
            </div>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {borrower.monthlyIncome ? formatCurrency(borrower.monthlyIncome) : "-"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {borrower.occupation || "Unspecified"}
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-4 overflow-x-auto pb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/borrowers/${borrower.id}?tab=${tab.id}`}
                  className={`py-2 px-1 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tab 1: Overview & KYC */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* AI Credit Risk & Health Analysis Card */}
            <CreditScoreBadge
              input={creditInput}
              borrowerName={borrower.fullName}
              variant="card"
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="py-3 bg-slate-50/50">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Residential & Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{borrower.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Primary Mobile</span>
                  <span className="font-mono text-slate-900">+91 {borrower.phone}</span>
                </div>
                {borrower.alternatePhone && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Alternate Mobile</span>
                    <span className="font-mono text-slate-900">+91 {borrower.alternatePhone}</span>
                  </div>
                )}
                {borrower.email && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-900">{borrower.email}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Address</span>
                  <span className="text-right text-slate-900 max-w-[60%]">{borrower.address}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">City / State</span>
                  <span className="text-slate-900">{borrower.city}, {borrower.state} {borrower.pincode && `(${borrower.pincode})`}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Registered On</span>
                  <span className="text-slate-900">{formatDate(borrower.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 bg-slate-50/50">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Occupation & Guarantor Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Occupation</span>
                  <span className="font-semibold text-slate-900">{borrower.occupation || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Business / Workplace</span>
                  <span className="text-slate-900">{borrower.businessDetails || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Reference Person</span>
                  <span className="text-slate-900">
                    {borrower.referenceName || "-"} {borrower.referenceRelation && `(${borrower.referenceRelation})`}
                  </span>
                </div>
                {borrower.referencePhone && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Reference Mobile</span>
                    <span className="font-mono text-slate-900">+91 {borrower.referencePhone}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Guarantor Name</span>
                  <span className="font-semibold text-slate-900">{borrower.guarantorName || "-"}</span>
                </div>
                {borrower.guarantorPhone && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Guarantor Mobile</span>
                    <span className="font-mono text-slate-900">+91 {borrower.guarantorPhone}</span>
                  </div>
                )}
                {borrower.notes && (
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1">Confidential Notes:</span>
                    <p className="bg-amber-50/60 border border-amber-200 rounded p-2.5 text-amber-900 text-[11px] leading-relaxed">
                      {borrower.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Loans */}
        {activeTab === "loans" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Loan Code</th>
                    <th className="px-4 py-3">Disbursed Date</th>
                    <th className="px-4 py-3">Principal</th>
                    <th className="px-4 py-3">Interest Method</th>
                    <th className="px-4 py-3 text-right">Total Expected</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {borrower.loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600">
                        <Link href={`/loans/${loan.id}`}>{loan.loanCode}</Link>
                      </td>
                      <td className="px-4 py-3">{formatDate(loan.disbursementDate)}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {formatCurrency(loan.principalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{loan.interestRate}% p.a.</span>
                        <span className="text-[10px] text-slate-400 block">
                          {loan.interestType.replace("_", " ")} &bull; {loan.tenurePeriods} {loan.repaymentFrequency.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {formatCurrency(loan.totalAmountExpected)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(loan.totalOutstanding)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={loan.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/loans/${loan.id}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">
                            Schedule
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {borrower.loans.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No loans created for this borrower yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Payments */}
        {activeTab === "payments" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3 text-right">Principal</th>
                    <th className="px-4 py-3 text-right">Interest</th>
                    <th className="px-4 py-3 text-right">Late Fee</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {borrower.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{p.paymentMode}</span>
                        {p.referenceNumber && (
                          <span className="font-mono text-[10px] text-slate-400 block">{p.referenceNumber}</span>
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
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/payments/${p.id}/receipt`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] gap-1">
                            <FileText className="h-3 w-3" />
                            <span>Print</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {borrower.payments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Ledger */}
        {activeTab === "ledger" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description / Reference</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Debit (+)</th>
                    <th className="px-4 py-3 text-right">Credit (-)</th>
                    <th className="px-4 py-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {borrower.ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono">{formatDate(entry.entryDate)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {entry.description}
                        {entry.referenceNo && (
                          <span className="font-mono text-[10px] text-slate-400 block">Ref: {entry.referenceNo}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          {entry.entryType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                  {borrower.ledgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No ledger transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 5: Documents */}
        {activeTab === "documents" && (
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">KYC & Loan Agreements</h3>
                <p className="text-xs text-slate-500">Aadhaar, PAN, agreements, and identity proofs.</p>
              </div>
            </div>

            {borrower.documents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No KYC documents uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {borrower.documents.map((doc) => (
                  <div key={doc.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{doc.title}</div>
                        <div className="text-[10px] text-slate-400">{doc.docType} &bull; {formatDate(doc.uploadedAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 6: WhatsApp Logs */}
        {activeTab === "whatsapp" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Message Body</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {borrower.messages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono">{formatDate(m.createdAt, "dd MMM, hh:mm a")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{m.templateName}</td>
                      <td className="px-4 py-3 font-mono">+91 {m.recipientPhone}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{m.messageBody}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={m.status} />
                      </td>
                    </tr>
                  ))}
                  {borrower.messages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No automated WhatsApp logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
