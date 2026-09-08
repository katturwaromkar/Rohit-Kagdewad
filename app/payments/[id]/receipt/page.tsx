import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import { bilingualTemplates } from "@/lib/i18n/marathi";
import {
  ArrowLeft,
  MessageSquare,
  Landmark,
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
  const businessPhone = settingsMap["BUSINESS_PHONE"] || "+91 96652 69105";
  const businessAddress = settingsMap["BUSINESS_ADDRESS"] || "Station Road, Nanded, Maharashtra - 431601";

  // Formatted Bilingual WhatsApp receipt text
  const waReceiptText = bilingualTemplates.receipt({
    borrowerName: payment.borrower.fullName,
    amount: payment.amount.toLocaleString("en-IN"),
    receiptNumber: payment.receiptNumber,
    loanCode: payment.loan.loanCode,
    balanceRemaining: payment.loan.totalOutstanding.toLocaleString("en-IN"),
    businessName,
    businessPhone,
  }, "both");

  const waLink = generateWhatsAppLink(payment.borrower.phone, waReceiptText);

  return (
    <AppShell user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Action Bar (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Link href="/payments">
            <Button size="sm" variant="outline" className="gap-1.5 h-10 px-4">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Payments (मागे जा)</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-700 bg-emerald-950/40 hover:bg-emerald-900/60 gap-1.5 h-10 px-4">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp पावती पाठवा</span>
              </Button>
            </a>

            <PrintButton />
          </div>
        </div>

        {/* Printable Receipt Box */}
        <div
          id="printable-receipt"
          className="rounded-2xl border border-slate-700 bg-white p-6 sm:p-8 shadow-xl text-slate-900 print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white print:border print:border-black">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    {businessName}
                  </h1>
                  <span className="text-[11px] text-slate-500 font-medium">रोहित कागदेवाड कर्ज वसुली व व्यवस्थापन</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">{businessAddress}</p>
              <p className="text-xs text-slate-600 font-mono">मोबाईल: {businessPhone}</p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                अधिकृत पावती (Official Receipt)
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
            <div className="my-4 rounded-lg bg-red-50 border border-red-300 p-3 text-red-800 text-xs">
              <strong className="font-semibold block">TRANSACTION REVERSED (व्यवहार रद्द करण्यात आला आहे)</strong>
              <span>Reason: {payment.reversalReason || "Administrative reversal"}</span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-6 border-b border-slate-100 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                कर्जदार तपशील (Received From)
              </span>
              <div className="font-bold text-sm text-slate-900">{payment.borrower.fullName}</div>
              <div className="font-mono text-slate-700 mt-0.5">+91 {payment.borrower.phone}</div>
              <div className="text-slate-600 mt-0.5">{payment.borrower.address}, {payment.borrower.city}</div>
              <div className="text-slate-500 text-[10px] font-mono mt-0.5">ID: {payment.borrower.borrowerCode}</div>
            </div>

            <div className="sm:text-right space-y-1">
              <div>
                <span className="text-slate-500">पावती तारीख (Date):</span>{" "}
                <span className="font-mono font-medium text-slate-800">{formatDate(payment.paymentDate)}</span>
              </div>
              <div>
                <span className="text-slate-500">कर्ज खाते (Loan ID):</span>{" "}
                <span className="font-mono font-bold text-blue-600">{payment.loan.loanCode}</span>
              </div>
              <div>
                <span className="text-slate-500">भरणा प्रकार (Mode):</span>{" "}
                <span className="font-semibold text-slate-800">{payment.paymentMode}</span>
              </div>
              {payment.referenceNumber && (
                <div>
                  <span className="text-slate-500">संदर्भ / UTR No:</span>{" "}
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
                  <th className="py-2">तपशील (Description)</th>
                  <th className="py-2 text-right">जमा रक्कम (Allocated)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 text-slate-700">मुद्दल घटक (Principal Component)</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(payment.principalAllocated)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700">व्याज घटक (Interest Component)</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(payment.interestAllocated)}
                  </td>
                </tr>
                {payment.lateFeeAllocated > 0 && (
                  <tr>
                    <td className="py-2.5 text-slate-700">लेट फी दंड (Late Fee Penalty Cleared)</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      {formatCurrency(payment.lateFeeAllocated)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50/80 font-bold text-sm">
                  <td className="py-3 px-2 text-slate-900">एकूण जमा रक्कम (Total Received)</td>
                  <td className="py-3 px-2 text-right text-emerald-700">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance & Authorization Footer */}
          <div className="pt-6 flex flex-wrap items-end justify-between gap-6 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                उर्वरित कर्ज बाकी (Remaining Balance)
              </div>
              <div className="text-base font-bold font-mono text-slate-900">
                {formatCurrency(payment.loan.totalOutstanding)}
              </div>
              <div className="text-[10px] text-slate-500">
                नोंद ऑपरेटर (Cashier): {payment.collectedBy.name}
              </div>
            </div>

            <div className="text-right space-y-10">
              <div className="h-6"></div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                स्वाक्षरी / सही व शिक्का (Authorized Signature)
              </div>
            </div>
          </div>

          {/* Computer generated disclaimer */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-500">
            ही पावती संगणकीय प्रणालीद्वारे तयार केलेली आहे &bull; Rohit Kagdewad Lending Management System
          </div>
        </div>
      </div>
    </AppShell>
  );
}
