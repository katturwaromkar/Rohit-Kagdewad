"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Send, Smartphone, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { generateSMSText, SMSReminderType } from "@/lib/sms/smslocal";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BorrowerOption {
  id: string;
  fullName: string;
  phone: string;
  borrowerCode: string;
  activeLoanCode?: string;
  dueAmount?: number;
  dueDate?: string;
}

interface SMSDispatcherProps {
  borrowers: BorrowerOption[];
}

export function SMSDispatcher({ borrowers }: SMSDispatcherProps) {
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>(borrowers[0]?.id || "");
  const [templateType, setTemplateType] = useState<SMSReminderType>("DUE_TODAY");
  const [customMsg, setCustomMsg] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId) || borrowers[0];

  const tplData = selectedBorrower
    ? generateSMSText({
        type: templateType,
        borrowerName: selectedBorrower.fullName,
        amount: selectedBorrower.dueAmount || 10000,
        dueDate: selectedBorrower.dueDate ? new Date(selectedBorrower.dueDate) : new Date(),
        loanCode: selectedBorrower.activeLoanCode || "LN-DEFAULT",
        receiptNumber: "REC-2026-001",
        daysOverdue: 7,
      })
    : { message: "", templateKey: templateType, defaultTemplateId: "", charCount: 0 };

  const currentMessage = customMsg || tplData.message;

  const handleSendSMS = async () => {
    const targetPhone = customPhone || selectedBorrower?.phone;
    if (!targetPhone) {
      setErrorMsg("Please select a borrower or enter a 10-digit mobile number.");
      return;
    }

    setIsSending(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: selectedBorrower?.id,
          phone: targetPhone,
          templateType,
          customMessage: currentMessage,
          customTemplateId: tplData.defaultTemplateId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to dispatch SMS.");
        setIsSending(false);
        return;
      }

      if (data.isMock) {
        setStatusMsg("SMS simulated successfully (Configure SMS_LOCAL_API_KEY in Settings for live carrier SMS).");
      } else {
        setStatusMsg("SMS dispatched successfully via SMSLocal.in Gateway!");
      }
      setIsSending(false);
    } catch {
      setErrorMsg("Network error sending SMS.");
      setIsSending(false);
    }
  };

  const handleOpenNativeSMS = () => {
    const targetPhone = (customPhone || selectedBorrower?.phone || "").replace(/[^0-9]/g, "");
    const encodedBody = encodeURIComponent(currentMessage);
    window.location.href = `sms:${targetPhone}?body=${encodedBody}`;
  };

  return (
    <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
      <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
              SMSLocal.in DLT SMS Dispatcher & Manual Reminders
            </CardTitle>
          </div>
          <span className="font-mono text-[10px] text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800 self-start sm:self-auto">
            DLT GSM Carrier Route
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs">
        {statusMsg && (
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3 text-emerald-300 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Borrower */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Select Recipient Borrower (कर्जदार निवडा)
            </label>
            <select
              value={selectedBorrowerId}
              onChange={(e) => {
                setSelectedBorrowerId(e.target.value);
                setCustomMsg("");
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              {borrowers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fullName} &bull; +91 {b.phone} ({b.activeLoanCode || "No Active Loan"})
                </option>
              ))}
            </select>
          </div>

          {/* Select Template */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              DLT SMS Template Type (नमुना)
            </label>
            <select
              value={templateType}
              onChange={(e) => {
                setTemplateType(e.target.value as SMSReminderType);
                setCustomMsg("");
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="DUE_TODAY">Payment Due Today (आज देय हप्ता)</option>
              <option value="DUE_IN_2_DAYS">Upcoming Due in 2 Days (2 दिवस आधी आठवण)</option>
              <option value="OVERDUE">Overdue Warning (थकबाकी चेतावणी)</option>
              <option value="RECEIPT">Payment Acknowledgement Receipt (जमा पावती)</option>
              <option value="WELCOME">Loan Sanction & Welcome (कर्ज वाटप स्वागत)</option>
              <option value="CUSTOM">Custom Notice Message (इतर संदेश)</option>
            </select>
          </div>
        </div>

        {/* Message Editor / Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>SMS Message Text</span>
            <span className="font-mono text-[10px] text-slate-500">
              {currentMessage.length} characters ({Math.ceil(currentMessage.length / 160)} SMS credit) &bull; DLT ID: {tplData.defaultTemplateId}
            </span>
          </div>
          <textarea
            rows={3}
            value={currentMessage}
            onChange={(e) => setCustomMsg(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white leading-relaxed focus:border-blue-500 focus:outline-none font-sans text-xs"
          />
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenNativeSMS}
            className="border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 gap-1.5 text-xs h-9"
          >
            <Smartphone className="h-4 w-4 text-blue-400" />
            <span>Open Phone SMS App</span>
          </Button>

          <Button
            type="button"
            onClick={handleSendSMS}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 px-5 gap-1.5 shadow-lg shadow-blue-600/20"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isSending ? "Dispatching..." : "Send via SMSLocal Gateway"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
