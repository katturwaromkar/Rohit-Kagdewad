"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, Play, CheckCircle2, AlertCircle } from "lucide-react";

interface DispatcherProps {
  borrowers: Array<{
    id: string;
    fullName: string;
    phone: string;
    borrowerCode: string;
  }>;
}

export function WhatsAppDispatcher({ borrowers }: DispatcherProps) {
  const router = useRouter();
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(borrowers[0]?.id || "");
  const [templateType, setTemplateType] = useState("DUE_TODAY");
  const [customText, setCustomText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Cron Simulation
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronSummary, setCronSummary] = useState<any>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");
    setIsSending(true);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: selectedBorrowerId,
          templateType: templateType === "CUSTOM" ? null : templateType,
          customMessage: templateType === "CUSTOM" ? customText : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to dispatch message.");
        setIsSending(false);
        return;
      }

      setStatusMsg(`WhatsApp notification dispatched successfully! (Status: ${data.message.status})`);
      setIsSending(false);
      router.refresh();
    } catch (err) {
      setErrorMsg("Network error dispatching message.");
      setIsSending(false);
    }
  };

  const handleRunCron = async () => {
    setIsCronRunning(true);
    setErrorMsg("");
    setStatusMsg("");
    setCronSummary(null);

    try {
      const res = await fetch("/api/cron/reminders?key=rk-lending-cron-secure-2026");
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Cron trigger failed.");
        setIsCronRunning(false);
        return;
      }

      setCronSummary(data.summary);
      setStatusMsg(`Cron job executed successfully. Sent: ${data.summary.sentCount}, Skipped (Deduplicated): ${data.summary.skippedCount}`);
      setIsCronRunning(false);
      router.refresh();
    } catch (err) {
      setErrorMsg("Failed to connect to reminder cron.");
      setIsCronRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Test Dispatcher Box (7 cols) */}
      <Card className="lg:col-span-7 bg-white border-blue-200">
        <CardHeader className="py-3.5 bg-blue-50/40 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Manual Notification Dispatcher
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {statusMsg && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md bg-red-50 border border-red-200 p-2.5 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Recipient Borrower
                </label>
                <select
                  required
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-1.5 focus:border-blue-600 focus:outline-none"
                >
                  {borrowers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} (+91 {b.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Message Template
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-1.5 focus:border-blue-600 focus:outline-none"
                >
                  <option value="DUE_TODAY">Payment Due Today</option>
                  <option value="DUE_IN_2_DAYS">Due in 2 Days Notice</option>
                  <option value="OVERDUE_NOTICE">Overdue Warning</option>
                  <option value="LOAN_DISBURSED">Loan Disbursal Confirmation</option>
                  <option value="CUSTOM">Custom Freeform Message</option>
                </select>
              </div>
            </div>

            {templateType === "CUSTOM" && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Custom Message Content
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type message text..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                isLoading={isSending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send WhatsApp Message</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Automated Daily Cron Trigger Panel (5 cols) */}
      <Card className="lg:col-span-5 bg-white border-slate-200">
        <CardHeader className="py-3.5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Automated Daily Cron Engine
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          <p className="text-slate-500 leading-relaxed">
            In production, Vercel Cron automatically triggers <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">/api/cron/reminders</code> every morning at 09:00 AM IST.
          </p>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1 text-slate-700 font-mono text-[11px]">
            <div>&bull; Scans: Dues Today, Due in 2 Days, Overdues</div>
            <div>&bull; Guards: Prevents duplicate reminders on same day</div>
            <div>&bull; Security: Bearer Secret Token Protected</div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            isLoading={isCronRunning}
            onClick={handleRunCron}
            className="w-full gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
          >
            <Play className="h-3.5 w-3.5 text-blue-600" />
            <span>Simulate Daily Cron Run Now</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
