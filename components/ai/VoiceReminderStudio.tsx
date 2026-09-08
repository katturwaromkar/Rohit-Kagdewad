"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { generateVoiceScript, VoiceReminderType, VoiceTone } from "@/lib/ai/voice";
import { generateWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";
import {
  Mic,
  Play,
  Square,
  Volume2,
  Send,
  Languages,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  PhoneCall,
  Calendar,
  Sparkles,
} from "lucide-react";

interface BorrowerOption {
  id: string;
  fullName: string;
  phone: string;
  borrowerCode: string;
  activeLoanCode?: string;
  dueAmount?: number;
  dueDate?: string;
}

interface LiveDuesDetail {
  totalOverdueAmount: number;
  totalDueTodayAmount: number;
  totalOutstanding: number;
  effectivePendingAmount: number;
  overdueCount: number;
  primaryLoanCode: string;
  earliestDueDate: string | null;
  daysOverdue: number;
}

interface VoiceReminderStudioProps {
  borrowers: BorrowerOption[];
  initialBorrowerId?: string;
  initialType?: VoiceReminderType;
}

export function VoiceReminderStudio({
  borrowers,
  initialBorrowerId,
  initialType = "DUE_TODAY",
}: VoiceReminderStudioProps) {
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(
    initialBorrowerId || borrowers[0]?.id || ""
  );
  const [reminderType, setReminderType] = useState<VoiceReminderType>(initialType);
  const [language, setLanguage] = useState<"mr" | "en">("mr");
  const [tone, setTone] = useState<VoiceTone>("POLITE");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [liveDues, setLiveDues] = useState<LiveDuesDetail | null>(null);
  const [isFetchingDues, setIsFetchingDues] = useState(false);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.88);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [copied, setCopied] = useState(false);

  const currentBorrower = borrowers.find((b) => b.id === selectedBorrowerId) || borrowers[0];

  // Fetch accurate live dues whenever borrower changes
  useEffect(() => {
    if (!selectedBorrowerId) return;

    let isMounted = true;
    setIsFetchingDues(true);

    fetch(`/api/voice-calls/borrower-dues?borrowerId=${selectedBorrowerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.summary) {
          setLiveDues({
            totalOverdueAmount: data.summary.totalOverdueAmount,
            totalDueTodayAmount: data.summary.totalDueTodayAmount,
            totalOutstanding: data.summary.totalOutstanding,
            effectivePendingAmount: data.summary.effectivePendingAmount,
            overdueCount: data.summary.overdueCount,
            primaryLoanCode: data.summary.primaryLoanCode,
            earliestDueDate: data.summary.earliestDueDate,
            daysOverdue: data.summary.daysOverdue,
          });

          if (data.summary.totalOverdueAmount > 0) {
            setReminderType("OVERDUE_ALERT");
            setTone("URGENT");
          }
        }
      })
      .catch((err) => console.error("Error fetching borrower live dues", err))
      .finally(() => {
        if (isMounted) setIsFetchingDues(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBorrowerId]);

  // Initialize SpeechSynthesis and find best Indian Female Voice
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      const indianFemaleVoice =
        voices.find(
          (v) =>
            (v.lang.includes("IN") || v.lang.includes("mr") || v.lang.includes("hi")) &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("heera") ||
              v.name.toLowerCase().includes("neerja") ||
              v.name.toLowerCase().includes("veena") ||
              v.name.toLowerCase().includes("priya") ||
              v.name.toLowerCase().includes("swara") ||
              v.name.toLowerCase().includes("kalpana") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("google"))
        ) ||
        voices.find((v) => v.lang.startsWith("mr") || v.lang.startsWith("hi") || v.lang === "en-IN") ||
        voices.find((v) => v.lang.includes("en-IN")) ||
        voices[0];

      setSelectedVoice(indianFemaleVoice || null);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const effectiveAmount = customAmount
    ? parseFloat(customAmount) || 0
    : liveDues?.effectivePendingAmount ?? (currentBorrower?.dueAmount || 5000);

  const effectiveDueDate = liveDues?.earliestDueDate || currentBorrower?.dueDate;
  const effectiveLoanCode = liveDues?.primaryLoanCode || currentBorrower?.activeLoanCode;

  const scriptData = generateVoiceScript(reminderType, {
    borrowerName: currentBorrower?.fullName || "Borrower",
    amount: effectiveAmount,
    dueDate: effectiveDueDate,
    loanCode: effectiveLoanCode,
    language,
    tone,
    daysOverdue: liveDues?.daysOverdue,
  });

  const handlePlayVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(scriptData.script);
    utterance.lang = scriptData.langCode;
    utterance.rate = speechRate;
    utterance.pitch = 1.15; // Natural pleasant female pitch

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptData.whatsappTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = generateWhatsAppLink(
    currentBorrower?.phone || "",
    scriptData.whatsappTranscript
  );

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-900/90 shadow-2xl">
      <CardHeader className="py-4 px-4 sm:px-6 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Voice Reminders & WhatsApp Audio Dispatch</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                Live Marathi Audio
              </span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Accurate live pending dues calculation & spoken notice generator in natural Indian female tone.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              handleStopVoice();
              setLanguage("mr");
            }}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              language === "mr"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            मराठी आवाज
          </button>
          <button
            type="button"
            onClick={() => {
              handleStopVoice();
              setLanguage("en");
            }}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              language === "en"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Indian English
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Recipient & Reminder Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Borrower (कर्जदार)
            </label>
            <select
              value={selectedBorrowerId}
              onChange={(e) => {
                handleStopVoice();
                setSelectedBorrowerId(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none"
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
              Notice Type (प्रकार)
            </label>
            <select
              value={reminderType}
              onChange={(e) => {
                handleStopVoice();
                setReminderType(e.target.value as VoiceReminderType);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="DUE_TODAY">Payment Due Today (आज देय हप्ता)</option>
              <option value="DUE_IN_2_DAYS">Due in 2 Days Notice (२ दिवसांत देय)</option>
              <option value="OVERDUE_ALERT">Overdue Urgent Alert (थकबाकी सूचना)</option>
              <option value="PHONE_CALL_REMINDER">Phone Call Notice (कॉल सूचना)</option>
              <option value="PAYMENT_RECEIPT">Payment Receipt Confirmation (पावती)</option>
              <option value="LOAN_WELCOME">Loan Disbursal Welcome (कर्ज वाटप)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Amount (थकीत रक्कम ₹)
            </label>
            <input
              type="number"
              value={customAmount || (effectiveAmount ? String(effectiveAmount) : "")}
              onChange={(e) => {
                handleStopVoice();
                setCustomAmount(e.target.value);
              }}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Pending Dues Badge Breakdown */}
        {liveDues && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Live Account Status:</span>
            {liveDues.totalOverdueAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold font-mono">
                Overdue: ₹{liveDues.totalOverdueAmount.toLocaleString("en-IN")} ({liveDues.overdueCount} installments)
              </span>
            )}
            {liveDues.totalDueTodayAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold font-mono">
                Due Today: ₹{liveDues.totalDueTodayAmount.toLocaleString("en-IN")}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
              Total Outstanding: ₹{liveDues.totalOutstanding.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Live Audio Visualizer Player Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isPlaying ? handleStopVoice : handlePlayVoice}
                className={`h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95 shrink-0 ${
                  isPlaying
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 animate-pulse"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                }`}
                title={isPlaying ? "Stop" : "Play Voice Preview"}
              >
                {isPlaying ? (
                  <Square className="h-4 w-4 fill-white" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5 fill-white" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {isPlaying ? "Playing Spoken Voice Note..." : "Audio Engine Ready"}
                  </span>
                  {isPlaying && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === "mr" ? "मराठी स्पष्ट उच्चार व व्यावसायिक टोन" : "Polite Indian Business Accent"} &bull; {speechRate}x Speed
                </p>
              </div>
            </div>

            {/* Speed Rate Selector */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="mr-1">Speed:</span>
              <button
                type="button"
                onClick={() => setSpeechRate(0.82)}
                className={`px-2 py-0.5 rounded font-medium ${speechRate === 0.82 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                0.8x
              </button>
              <button
                type="button"
                onClick={() => setSpeechRate(0.88)}
                className={`px-2 py-0.5 rounded font-medium ${speechRate === 0.88 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                0.9x
              </button>
              <button
                type="button"
                onClick={() => setSpeechRate(1.0)}
                className={`px-2 py-0.5 rounded font-medium ${speechRate === 1.0 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                1.0x
              </button>
            </div>
          </div>

          {/* Animated Waveform Simulation */}
          <div className="flex items-center justify-center gap-1 h-7 px-2 py-1 rounded-xl bg-slate-950 border border-slate-800/80">
            {Array.from({ length: 32 }).map((_, i) => {
              const height = isPlaying
                ? Math.max(15, Math.floor(Math.sin((i + Date.now() / 100) * 0.5) * 100))
                : 20;
              return (
                <div
                  key={i}
                  style={{ height: `${height}%` }}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                />
              );
            })}
          </div>

          {/* Spoken Script Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="uppercase tracking-wider">Spoken Message Transcript (मजकूर)</span>
              <span className="text-[10px] text-slate-500">Estimated Duration: ~{scriptData.durationSec}s</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              "{scriptData.script}"
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400">
            Recipient: <span className="text-white font-semibold">{currentBorrower?.fullName}</span> (+91 {currentBorrower?.phone})
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyScript}
              className="h-9 px-3.5 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Text"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isPlaying ? handleStopVoice : handlePlayVoice}
              className="h-9 px-3.5 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
            >
              <Volume2 className="h-4 w-4 text-blue-400" />
              <span>{isPlaying ? "Stop Audio" : "Listen Audio"}</span>
            </Button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Send className="h-4 w-4" />
                <span>Send WhatsApp Voice Message</span>
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

