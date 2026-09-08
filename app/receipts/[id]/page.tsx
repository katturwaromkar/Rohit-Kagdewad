import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, getAppBaseUrl } from "@/lib/utils";
import {
  Landmark,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  ArrowLeft,
  FileCheck2,
} from "lucide-react";
import { DownloadReceiptButton } from "./DownloadReceiptButton";

export const dynamic = "force-dynamic";

interface PublicReceiptPageProps {
  params: {
    id: string;
  };
}

export default async function PublicReceiptPage({ params }: PublicReceiptPageProps) {
  const decodedId = decodeURIComponent(params.id);

  // Search by Payment ID or Receipt Number
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ id: decodedId }, { receiptNumber: decodedId }],
    },
    include: {
      borrower: true,
      loan: true,
      collectedBy: true,
    },
  });

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-4 shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-rose-600/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-white">पावती आढळली नाही (Receipt Not Found)</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested digital receipt ID <code className="font-mono text-slate-300">"{decodedId}"</code> is invalid or has expired. Please verify with our office.
          </p>
          <div className="pt-2">
            <a
              href="tel:9665269105"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Contact Helpline: +91 96652 69105</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get business settings
  const settings = await prisma.businessSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  const businessName = settingsMap["BUSINESS_NAME"] || "रोहित कागदेवाड प्रायव्हेट लेंडिंग";
  const ownerName = settingsMap["OWNER_NAME"] || "रोहित कागदेवाड";
  const businessPhone = settingsMap["BUSINESS_PHONE"] || "+91 96652 69105";
  const businessAddress =
    settingsMap["BUSINESS_ADDRESS"] || "Station Road, Nanded, Maharashtra - 431601";

  const baseUrl = getAppBaseUrl();
  const publicReceiptUrl = `${baseUrl}/receipts/${payment.receiptNumber}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Top Public Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 no-print shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  अधिकृत डिजिटल पावती पोर्टल
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Official Digital Payment Receipt &bull; {businessName}
              </p>
            </div>
          </div>

          <DownloadReceiptButton
            receiptNumber={payment.receiptNumber}
            borrowerName={payment.borrower.fullName}
            borrowerPhone={payment.borrower.phone}
            amountFormatted={formatCurrency(payment.amount)}
            loanCode={payment.loan.loanCode}
            balanceRemainingFormatted={formatCurrency(payment.loan.totalOutstanding)}
            publicReceiptUrl={publicReceiptUrl}
          />
        </div>

        {/* Printable Official Receipt Document */}
        <div
          id="printable-receipt"
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 print:border-none print:shadow-none print:p-0 relative overflow-hidden"
        >
          {/* Subtle Watermark Stamp */}
          <div className="absolute right-6 top-24 pointer-events-none opacity-[0.08] select-none text-right font-black text-6xl text-emerald-800 rotate-[-12deg]">
            PAID
          </div>

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shrink-0">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                    {businessName}
                  </h1>
                  <span className="text-xs text-slate-600 font-medium block">
                    रोहित कागदेवाड कर्ज वसुली व व्यवस्थापन
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">{businessAddress}</p>
              <p className="text-xs text-slate-600 font-mono">संपर्क: {businessPhone}</p>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                अधिकृत पावती (Official Receipt)
              </span>
              <span className="text-base font-black font-mono text-slate-900 block">
                {payment.receiptNumber}
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>यशस्वी जमा (Payment Success)</span>
              </div>
            </div>
          </div>

          {/* Reversal Banner if applicable */}
          {payment.status === "REVERSED" && (
            <div className="my-4 rounded-xl bg-red-50 border border-red-300 p-3.5 text-red-800 text-xs">
              <strong className="font-bold block">TRANSACTION REVERSED (हा व्यवहार रद्द करण्यात आला आहे)</strong>
              <span>Reason: {payment.reversalReason || "Administrative reversal"}</span>
            </div>
          )}

          {/* Borrower & Transaction Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-6 border-b border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                कर्जदार तपशील (Received From)
              </span>
              <div className="font-bold text-sm text-slate-900">{payment.borrower.fullName}</div>
              <div className="font-mono text-slate-700">+91 {payment.borrower.phone}</div>
              <div className="text-slate-600">{payment.borrower.address}, {payment.borrower.city}</div>
              <div className="text-slate-500 text-[11px] font-mono">
                Borrower Code: {payment.borrower.borrowerCode}
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div>
                <span className="text-slate-500">पावती तारीख (Date):</span>{" "}
                <span className="font-mono font-bold text-slate-800">{formatDate(payment.paymentDate, "dd MMMM yyyy")}</span>
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
                  <span className="font-mono font-medium text-slate-800">{payment.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-6 border-b-2 border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5">तपशील (Description)</th>
                  <th className="py-2.5 text-right">जमा रक्कम (Allocated Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 text-slate-700 font-sans">मुद्दल घटक (Principal Cleared)</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(payment.principalAllocated)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-700 font-sans">व्याज घटक (Interest Cleared)</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(payment.interestAllocated)}
                  </td>
                </tr>
                {payment.lateFeeAllocated > 0 && (
                  <tr>
                    <td className="py-2.5 text-slate-700 font-sans">लेट फी दंड (Late Fee Penalty Cleared)</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      {formatCurrency(payment.lateFeeAllocated)}
                    </td>
                  </tr>
                )}
                <tr className="bg-emerald-50/70 font-black text-sm">
                  <td className="py-3.5 px-3 text-slate-900 font-sans">एकूण जमा रक्कम (Total Received Amount)</td>
                  <td className="py-3.5 px-3 text-right text-emerald-800">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remaining Balance & Authorization Footer */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                उर्वरित कर्ज बाकी (Remaining Loan Balance)
              </div>
              <div className="text-lg font-black font-mono text-slate-900">
                {formatCurrency(payment.loan.totalOutstanding)}
              </div>
              <div className="text-[11px] text-slate-500">
                Cashier: {payment.collectedBy.name}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-8">
              <div className="h-6" />
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-700 font-semibold">
                अधिकृत स्वाक्षरी / सही व शिक्का (Authorized Signature)
              </div>
            </div>
          </div>

          {/* Digital Verification & Help Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <div>
              ही पावती संगणकीय प्रणालीद्वारे तयार केलेली आहे &bull; Rohit Kagdewad Lending Platform
            </div>
            <div className="font-mono">
              Verification Link: {payment.receiptNumber}
            </div>
          </div>
        </div>

        {/* Bottom Help & Navigation Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 no-print pt-2">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span>काही अडचण असल्यास संपर्क साधा: <strong className="text-white">+91 96652 69105</strong></span>
          </div>

          <a
            href="tel:9665269105"
            className="text-blue-400 hover:underline font-semibold"
          >
            कॉल करा (Call Support) &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
