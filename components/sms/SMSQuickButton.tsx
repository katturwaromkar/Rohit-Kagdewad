"use client";

import React, { useState } from "react";
import { MessageSquare, Send, X, Check, Copy, Smartphone, Loader2 } from "lucide-react";
import { generateSMSText, SMSReminderType } from "@/lib/sms/smslocal";
import { formatCurrency } from "@/lib/utils";

interface SMSQuickButtonProps {
  borrowerName: string;
  phone: string;
  amount?: number;
  dueDate?: string;
  loanCode?: string;
  receiptNumber?: string;
  daysOverdue?: number;
  type?: SMSReminderType;
  installmentId?: string;
  borrowerId?: string;
  variant?: "button" | "icon" | "compact";
  className?: string;
}

export function SMSQuickButton({
  borrowerName,
  phone,
  amount = 0,
  dueDate,
  loanCode,
  receiptNumber,
  daysOverdue,
  type = "DUE_TODAY",
  installmentId,
  borrowerId,
  variant = "button",
  className = "",
}: SMSQuickButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const tplData = generateSMSText({
    type,
    borrowerName,
    amount,
    dueDate,
    loanCode,
    receiptNumber,
    daysOverdue,
  });

  const [messageText, setMessageText] = useState(tplData.message);

  const handleSendLiveSMS = async () => {
    setIsSending(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId,
          installmentId,
          phone,
          templateType: type,
          customMessage: messageText,
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
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encodedBody = encodeURIComponent(messageText);
    window.location.href = `sms:${cleanPhone}?body=${encodedBody}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Send SMS Reminder"
          className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-center ${className}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      ) : variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 ${className}`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>SMS पाठवा</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all flex items-center gap-1.5 ${className}`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>SMS</span>
        </button>
      )}

      {/* Quick Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
                    SMS Reminder Notice
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      SMSLocal.in DLT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {borrowerName} &bull; +91 {phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Message Body Input / Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>SMS Text Message (DLT Format)</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {messageText.length} chars ({Math.ceil(messageText.length / 160)} SMS credit)
                </span>
              </div>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white leading-relaxed focus:border-blue-500 focus:outline-none font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenNativeSMS}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                title="Open in Phone Default SMS App"
              >
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Phone SMS App</span>
              </button>

              <button
                type="button"
                onClick={handleSendLiveSMS}
                disabled={isSending}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSending ? "Sending..." : "Send via SMSLocal"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy SMS Text"}</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">
                DLT ID: {tplData.defaultTemplateId}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
