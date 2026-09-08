"use client";

import React, { useState } from "react";
import { Mic, Play, Square, Send, Volume2, X, Check, Copy } from "lucide-react";
import { generateVoiceScript, VoiceReminderType, VoiceTone } from "@/lib/ai/voice";
import { generateWhatsAppLink, formatCurrency } from "@/lib/utils";

interface VoiceQuickButtonProps {
  borrowerName: string;
  phone: string;
  amount?: number;
  dueDate?: string;
  overdueDays?: number;
  type?: VoiceReminderType;
  loanCode?: string;
  receiptNumber?: string;
  variant?: "button" | "icon" | "compact";
  className?: string;
}

export function VoiceQuickButton({
  borrowerName,
  phone,
  amount = 0,
  dueDate,
  overdueDays,
  type = "DUE_TODAY",
  loanCode,
  receiptNumber,
  variant = "button",
  className = "",
}: VoiceQuickButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"mr" | "en">("mr");
  const [tone, setTone] = useState<VoiceTone>(type === "OVERDUE" ? "URGENT" : "POLITE");
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate script
  const scriptData = generateVoiceScript({
    type,
    language,
    borrowerName,
    amount,
    dueDate,
    overdueDays,
    loanCode,
    receiptNumber,
    tone,
    voiceSpeed: 0.88,
  });

  const handlePlayVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Voice synthesis is not supported on this browser.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptData.spokenText);
    utterance.rate = 0.88;
    utterance.pitch = 1.15; // Natural Indian female pitch

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice =
      voices.find(
        (v) =>
          (v.lang.includes("IN") || v.lang.includes("mr") || v.lang.includes("hi")) &&
          (v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("heera") ||
            v.name.toLowerCase().includes("neerja") ||
            v.name.toLowerCase().includes("veena") ||
            v.name.toLowerCase().includes("priya") ||
            v.name.toLowerCase().includes("swara") ||
            v.name.toLowerCase().includes("google"))
      ) ||
      voices.find((v) => v.lang.startsWith("mr") || v.lang.startsWith("hi") || v.lang === "en-IN") ||
      voices.find((v) => v.lang.includes("en-IN")) ||
      voices[0];

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendWhatsApp = () => {
    const waUrl = generateWhatsAppLink(phone, scriptData.whatsappTranscript);
    window.open(waUrl, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptData.whatsappTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Send Spoken Voice Reminder"
          className={`p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-all flex items-center justify-center ${className}`}
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
      ) : variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 ${className}`}
        >
          <Mic className="w-3.5 h-3.5 text-blue-400" />
          <span>व्हाईस नोट</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm transition-all flex items-center gap-1.5 ${className}`}
        >
          <Mic className="w-3.5 h-3.5 text-blue-400" />
          <span>🎙️ Voice Note</span>
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
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
                    Voice Notice Dispatch
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                      मराठी / English Audio
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {borrowerName} &bull; {formatCurrency(amount)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopAudio();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language & Tone Switcher */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  भाषा (Language)
                </label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setLanguage("mr");
                    }}
                    className={`py-1 rounded-lg font-medium text-center transition-all ${
                      language === "mr"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setLanguage("en");
                    }}
                    className={`py-1 rounded-lg font-medium text-center transition-all ${
                      language === "en"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  टोन (Voice Tone)
                </label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setTone("POLITE");
                    }}
                    className={`py-1 rounded-lg font-medium text-center transition-all ${
                      tone === "POLITE"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    नम्र (Polite)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio();
                      setTone("URGENT");
                    }}
                    className={`py-1 rounded-lg font-medium text-center transition-all ${
                      tone === "URGENT"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    तातडी (Urgent)
                  </button>
                </div>
              </div>
            </div>

            {/* Spoken Script Preview */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  Spoken Script (मजकूर)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">~{scriptData.durationSec}s</span>
              </div>
              <p className="leading-relaxed font-sans text-slate-200">"{scriptData.spokenText}"</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handlePlayVoice}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs border transition-all ${
                  isPlaying
                    ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>थांबवा (Stop)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-blue-400" />
                    <span>ऐका (Play Audio)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp पाठवा</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "कॉपी झाले!" : "मजकूर कॉपी करा"}</span>
              </button>
              <a
                href={`/whatsapp?borrowerId=${encodeURIComponent(borrowerName)}`}
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>WhatsApp हब उघडा &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
