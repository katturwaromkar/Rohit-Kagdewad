"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Printer, Share2, Copy, Check, Download, Send } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/utils";

interface DownloadReceiptButtonProps {
  receiptNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  amountFormatted: string;
  loanCode: string;
  balanceRemainingFormatted: string;
  publicReceiptUrl: string;
}

export function DownloadReceiptButton({
  receiptNumber,
  borrowerName,
  borrowerPhone,
  amountFormatted,
  loanCode,
  balanceRemainingFormatted,
  publicReceiptUrl,
}: DownloadReceiptButtonProps) {
  const [copied, setCopied] = useState(false);

  const handlePrintDownload = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(publicReceiptUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = `*अधिकृत डिजिटल पावती (Official Receipt)* ✅\n\n` +
    `नाव: *${borrowerName}*\n` +
    `जमा रक्कम: *${amountFormatted}*\n` +
    `पावती क्रमांक: *${receiptNumber}*\n` +
    `कर्ज खाते: *${loanCode}*\n` +
    `उर्वरित बाकी: *${balanceRemainingFormatted}*\n\n` +
    `📥 *डिजिटल पावती पहा व डाऊनलोड करा:* \n${publicReceiptUrl || (typeof window !== "undefined" ? window.location.href : "")}\n\n` +
    `रोहित कागदेवाड प्रायव्हेट लेंडिंग • 9665269105`;

  const waShareUrl = generateWhatsAppLink(borrowerPhone, shareText);

  return (
    <div className="flex flex-wrap items-center gap-2.5 no-print">
      {/* 1-Click PDF Download / Print */}
      <Button
        type="button"
        size="sm"
        onClick={handlePrintDownload}
        className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-1.5 shadow-lg shadow-blue-600/20"
      >
        <Download className="h-4 w-4" />
        <span>Download PDF / Print (पावती डाऊनलोड)</span>
      </Button>

      {/* Share on WhatsApp */}
      <a href={waShareUrl} target="_blank" rel="noreferrer">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 px-3.5 border-emerald-700 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/60 font-medium text-xs gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          <span>WhatsApp Share</span>
        </Button>
      </a>

      {/* Copy Link */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopyLink}
        className="h-9 px-3 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
        title="Copy Direct Link"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{copied ? "Link Copied!" : "Copy Link"}</span>
      </Button>
    </div>
  );
}
