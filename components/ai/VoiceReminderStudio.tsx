"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { generateVoiceScript, VoiceReminderType, VoiceTone } from "@/lib/ai/voice";
import { generateWhatsAppLink, formatCurrency } from "@/lib/utils";
import {
  Mic,
  Play,
  Square,
  Volume2,
  Send,
  Languages,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Radio,
  Share2,
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

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.88);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const currentBorrower = borrowers.find((b) => b.id === selectedBorrowerId) || borrowers[0];

  // Initialize SpeechSynthesis and find best Indian Female Voice
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Look for Indian female voices
      const indianFemaleVoice = voices.find(
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
    : currentBorrower?.dueAmount || 5000;

  const scriptData = generateVoiceScript(reminderType, {
    borrowerName: currentBorrower?.fullName || "Borrower",
    amount: effectiveAmount,
    dueDate: currentBorrower?.dueDate,
    loanCode: currentBorrower?.activeLoanCode,
    language,
    tone,
  });

  // Play Indian Female Voice
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

  const whatsappUrl = currentBorrower
    ? generateWhatsAppLink(currentBorrower.phone, scriptData.whatsappText)
    : "#";

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
      <CardHeader className="py-3.5 px-4 sm:px-6 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-pink-600/90 flex items-center justify-center text-white shadow-lg shadow-pink-600/20">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                AI Voice Reminder Studio (व्हाईस मेसेज)
              </CardTitle>
              <span className="rounded-full bg-pink-950/80 text-pink-300 border border-pink-800/80 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Indian Female Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Personalized voice notes in Marathi & Indian English</p>
          </div>
        </div>

        {/* Language Pill Switch */}
        <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              handleStopVoice();
              setLanguage("mr");
            }}
            className={`flex-1 sm:flex-none text-center px-3 py-1 rounded-md font-medium transition-colors ${
              language === "mr"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            मराठी आवाज (Marathi)
          </button>
          <button
            type="button"
            onClick={() => {
              handleStopVoice();
              setLanguage("en");
            }}
            className={`flex-1 sm:flex-none text-center px-3 py-1 rounded-md font-medium transition-colors ${
              language === "en"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Indian English Voice
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-pink-500 focus:outline-none"
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
              Voice Message Type (प्रकार)
            </label>
            <select
              value={reminderType}
              onChange={(e) => {
                handleStopVoice();
                setReminderType(e.target.value as VoiceReminderType);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-pink-500 focus:outline-none"
            >
              <option value="DUE_TODAY">Payment Due Today (आजचा हप्ता)</option>
              <option value="DUE_IN_2_DAYS">Due in 2 Days Notice (२ दिवसांत देय)</option>
              <option value="OVERDUE_ALERT">Overdue Urgent Alert (थकबाकी सूचना)</option>
              <option value="PAYMENT_RECEIPT">Payment Receipt (पावती व्हाईस)</option>
              <option value="LOAN_WELCOME">New Loan Welcome (कर्ज वाटप स्वागत)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Amount (रक्कम ₹)
            </label>
            <input
              type="number"
              value={customAmount || (currentBorrower?.dueAmount ? String(currentBorrower.dueAmount) : "")}
              onChange={(e) => {
                handleStopVoice();
                setCustomAmount(e.target.value);
              }}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 font-mono focus:border-pink-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Audio Visualizer Player Box */}
        <div className="rounded-2xl border border-pink-900/60 bg-gradient-to-b from-slate-950 to-pink-950/20 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isPlaying ? handleStopVoice : handlePlayVoice}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 shrink-0 ${
                  isPlaying
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/30 animate-pulse"
                    : "bg-pink-600 hover:bg-pink-700 shadow-pink-600/30"
                }`}
                title={isPlaying ? "Stop" : "Play Voice Preview"}
              >
                {isPlaying ? (
                  <Square className="h-5 w-5 fill-white" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5 fill-white" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {isPlaying ? "Playing Indian Female Voice..." : "Indian Female Voice Ready"}
                  </span>
                  {isPlaying && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === "mr" ? "मराठी स्पष्ट उच्चार व सौम्य टोन" : "Polite Indian English Accent"} &bull; {speechRate}x Speed
                </p>
              </div>
            </div>

            {/* Speed Rate Slider */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>Speed:</span>
              <button
                type="button"
                onClick={() => setSpeechRate(0.82)}
                className={`px-2 py-0.5 rounded ${speechRate === 0.82 ? "bg-pink-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                0.8x
              </button>
              <button
                type="button"
                onClick={() => setSpeechRate(0.88)}
                className={`px-2 py-0.5 rounded ${speechRate === 0.88 ? "bg-pink-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                0.9x (Natural)
              </button>
              <button
                type="button"
                onClick={() => setSpeechRate(1.0)}
                className={`px-2 py-0.5 rounded ${speechRate === 1.0 ? "bg-pink-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                1.0x
              </button>
            </div>
          </div>

          {/* Animated Waveform Simulation */}
          <div className="flex items-center justify-center gap-1 h-8 px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-800/80">
            {Array.from({ length: 32 }).map((_, i) => {
              const height = isPlaying
                ? Math.max(15, Math.floor(Math.sin((i + Date.now() / 100) * 0.5) * 100))
                : 20;
              return (
                <div
                  key={i}
                  style={{ height: `${height}%` }}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying ? "bg-pink-500" : "bg-slate-700"
                  }`}
                />
              );
            })}
          </div>

          {/* Spoken Script Preview Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider block">
              Spoken Transcript (व्हॉईस संदेश मजकूर)
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              "{scriptData.script}"
            </div>
          </div>
        </div>

        {/* WhatsApp Dispatch Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400">
            Recipient: <span className="text-white font-medium">{currentBorrower?.fullName}</span> (+91 {currentBorrower?.phone})
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isPlaying ? handleStopVoice : handlePlayVoice}
              className="h-9 px-3.5 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
            >
              <Volume2 className="h-4 w-4 text-pink-400" />
              <span>{isPlaying ? "Stop" : "Test Voice"}</span>
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
                className="w-full sm:w-auto h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Send className="h-4 w-4" />
                <span>Send via WhatsApp</span>
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
