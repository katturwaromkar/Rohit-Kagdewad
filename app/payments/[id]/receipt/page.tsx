import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import {
  ArrowLeft,
  Printer,
  MessageSquare,
  Landmark,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { PrintButton } from "./PrintButton";

interface ReceiptPageProps {
  params: {
    id: string;
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      borrower: true,
      loan: true,
      collectedBy: true,
      reversedBy: true,
    },
  });

  if (!payment) {
    notFound();
  }

  // Get business settings
  const settings = await prisma.businessSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  const businessName = settingsMap["BUSINESS_NAME"] || "Rohit Kagdewad Lending Management";
  const ownerName = settingsMap["OWNER_NAME"] || "Rohit Kagdewad";
  const businessPhone = settingsMap["BUSINESS_PHONE"] || "+91 98765 43210";
  const businessAddress = settingsMap["BUSINESS_ADDRESS"] || "Station Road, Nanded, Maharashtra - 431601";

  // Formatted WhatsApp receipt text
  const waReceiptText = `*Payment Receipt - ${businessName}*\n\n` +
    `Receipt No: *${payment.receiptNumber}*\n` +
    `Date: ${formatDate(payment.paymentDate)}\n` +
    `Customer: ${payment.borrower.fullName}\n` +
    `Loan ID: ${payment.loan.loanCode}\n\n` +
    `Amount Paid: *${formatCurrency(payment.amount)}*\n` +
    `• Principal: ${formatCurrency(payment.principalAllocated)}\n` +
    `• Interest: ${formatCurrency(payment.interestAllocated)}\n` +
    `• Late Fee: ${formatCurrency(payment.lateFeeAllocated)}\n\n` +
    `Payment Mode: ${payment.paymentMode}${payment.referenceNumber ? ` (${payment.referenceNumber})` : ""}\n` +
    `Remaining Loan Balance: *${formatCurrency(payment.loan.totalOutstanding)}*\n\n` +
    `Thank you for your timely payment.\n` +
    `${ownerName} | ${businessPhone}`;

  const waLink = generateWhatsAppLink(payment.borrower.phone, waReceiptText);

  return (
    <AppShell user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Action Bar (Hidden on Print) */}
        <div className="flex items-center justify-between no-print">
          <Link href="/payments">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Payments</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span>Share on WhatsApp</span>
              </Button>
            </a>

            <PrintButton />
          </div>
        </div>

        {/* Printable Receipt Box */}
        <div
          id="printable-receipt"
          className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs text-slate-900 print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white print:border print:border-black">
                  <Landmark className="h-4 w-4" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  {businessName}
                </h1>
              </div>
              <p className="text-xs text-slate-500">{businessAddress}</p>
              <p className="text-xs text-slate-500 font-mono">Contact: {businessPhone}</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Official Payment Receipt
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">
                {payment.receiptNumber}
              </span>
              <div className="mt-1">
                <Badge status={payment.status} />
              </div>
            </div>
          </div>

          {/* Reversal Banner if applicable */}
          {payment.status === "REVERSED" && (
            <div className="my-4 rounded-md bg-red-50 border border-red-300 p-3 text-red-800 text-xs">
              <strong className="font-semibold block">TRANSACTION REVERSED</strong>
              <span>Reason: {payment.reversalReason || "Administrative reversal"}</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
                Received From (Borrower)
              </span>
              <div className="font-bold text-sm text-slate-900">{payment.borrower.fullName}</div>
              <div className="font-mono text-slate-600 mt-0.5">+91 {payment.borrower.phone}</div>
              <div className="text-slate-500 mt-0.5">{payment.borrower.address}, {payment.borrower.city}</div>
              <div className="text-slate-400 text-[10px] font-mono mt-0.5">ID: {payment.borrower.borrowerCode}</div>
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="text-slate-400">Payment Date:</span>{" "}
                <span className="font-mono font-medium text-slate-800">{formatDate(payment.paymentDate)}</span>
              </div>
              <div>
                <span className="text-slate-400">Loan Reference:</span>{" "}
                <span className="font-mono font-bold text-blue-600">{payment.loan.loanCode}</span>
              </div>
              <div>
                <span className="text-slate-400">Payment Mode:</span>{" "}
                <span className="font-semibold text-slate-800">{payment.paymentMode}</span>
              </div>
              {payment.referenceNumber && (
                <div>
                  <span className="text-slate-400">Ref / UTR:</span>{" "}
                  <span className="font-mono text-slate-800">{payment.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-6 border-b border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount Allocated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 text-slate-700">Principal Component Allocated</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(payment.principalAllocated)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700">Interest Component Allocated</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(payment.interestAllocated)}
                  </td>
                </tr>
                {payment.lateFeeAllocated > 0 && (
                  <tr>
                    <td className="py-2.5 text-slate-700">Late Fee / Penalty Cleared</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      {formatCurrency(payment.lateFeeAllocated)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50/80 font-bold text-sm">
                  <td className="py-3 px-2 text-slate-900">Total Payment Received</td>
                  <td className="py-3 px-2 text-right text-emerald-700">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance & Authorization Footer */}
          <div className="pt-6 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Remaining Loan Balance
              </div>
              <div className="text-base font-bold font-mono text-slate-900">
                {formatCurrency(payment.loan.totalOutstanding)}
              </div>
              <div className="text-[10px] text-slate-400">
                Recorded By: {payment.collectedBy.name}
              </div>
            </div>

            <div className="text-right space-y-12">
              <div className="h-10"></div>
              <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
                Authorized Signature / Stamp
              </div>
            </div>
          </div>

          {/* Computer generated disclaimer */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            This is a computer-generated receipt issued by Rohit Kagdewad Lending Management System.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
