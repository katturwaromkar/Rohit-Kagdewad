"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, Play, CheckCircle2, AlertCircle, Languages } from "lucide-react";

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
  const [language, setLanguage] = useState<"both" | "mr" | "en">("both");
  const [customText, setCustomText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Cron Simulation
  const [isCronRunning, setIsCronRunning] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");

    if (!selectedBorrowerId) {
      setErrorMsg("Please select a borrower first.");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: selectedBorrowerId,
          templateType: templateType === "CUSTOM" ? null : templateType,
          customMessage: templateType === "CUSTOM" ? customText : null,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to dispatch message.");
        setIsSending(false);
        return;
      }

      setStatusMsg(`WhatsApp message dispatched successfully! (Status: ${data.message.status})`);
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

    try {
      const res = await fetch("/api/cron/reminders?key=rk-lending-cron-secure-2026");
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Cron trigger failed.");
        setIsCronRunning(false);
        return;
      }

      setStatusMsg(`Cron job executed successfully. Sent: ${data.summary?.sentCount || 0}, Skipped: ${data.summary?.skippedCount || 0}`);
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
      <Card className="lg:col-span-7 bg-slate-900 border-slate-800">
        <CardHeader className="py-3.5 bg-slate-800/60 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
                Notification Dispatcher (मेसेज पाठवा)
              </CardTitle>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Languages className="h-3.5 w-3.5 text-blue-400" />
              English & मराठी
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {statusMsg && (
            <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/80 p-2.5 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-950/60 border border-red-800/80 p-2.5 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {borrowers.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No borrowers registered yet. Add a borrower first to send WhatsApp messages.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Recipient Borrower (कर्जदार)
                  </label>
                  <select
                    required
                    value={selectedBorrowerId}
                    onChange={(e) => setSelectedBorrowerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white p-2 focus:border-blue-500 focus:outline-none"
                  >
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fullName} (+91 {b.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Message Template (नमुना)
                  </label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="DUE_TODAY">Payment Due Today (आज देय हप्ता)</option>
                    <option value="DUE_IN_2_DAYS">Due in 2 Days Notice (२ दिवसांत देय)</option>
                    <option value="OVERDUE_NOTICE">Overdue Warning (थकबाकी सूचना)</option>
                    <option value="LOAN_DISBURSED">Loan Disbursed (कर्ज वाटप माहिती)</option>
                    <option value="PAYMENT_RECEIPT">Payment Receipt (पावती मेसेज)</option>
                    <option value="CUSTOM">Custom Freeform Text (स्वतःचा मेसेज)</option>
                  </select>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Language Preference (भाषा निवडा)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("both")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === "both"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Bilingual (दोन्ही)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("mr")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === "mr"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    मराठी Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      language === "en"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    English Only
                  </button>
                </div>
              </div>

              {templateType === "CUSTOM" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Custom Message Content
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Type message text in Marathi or English..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold h-9 px-4"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send WhatsApp Message</span>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Automated Daily Cron Trigger Panel (5 cols) */}
      <Card className="lg:col-span-5 bg-slate-900 border-slate-800">
        <CardHeader className="py-3.5 bg-slate-800/60 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
              Automated Daily Reminders
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          <p className="text-slate-400 leading-relaxed">
            Automated cron scans all upcoming and overdue installments every morning at 09:00 AM IST and dispatches bilingual WhatsApp reminders.
          </p>

          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1.5 text-slate-300 font-mono text-[11px]">
            <div>&bull; Scans: Dues Today, Due in 2 Days, Overdues</div>
            <div>&bull; Auto Deduplication: Prevents double messaging</div>
            <div>&bull; Languages: Automatic Marathi & English</div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            isLoading={isCronRunning}
            onClick={handleRunCron}
            className="w-full h-9 gap-1.5 border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 font-semibold"
          >
            <Play className="h-3.5 w-3.5 text-blue-400" />
            <span>Run Morning Reminder Cycle Now</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
