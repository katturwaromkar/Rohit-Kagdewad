"use client";

import React, { useState } from "react";
import { Mic, Play, Square, Send, Volume2, Sparkles, X, Check } from "lucide-react";
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
    const femaleVoice = voices.find(
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
          onClick={() => setIsOpen(true)}
          title="AI Indian Female Voice Reminder"
          className={`p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 dark:text-pink-400 border border-pink-500/30 transition-all flex items-center justify-center ${className}`}
        >
          <Mic className="w-4 h-4" />
        </button>
      ) : variant === "compact" ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-600 dark:text-pink-300 border border-pink-500/30 hover:from-pink-500/25 hover:to-purple-500/25 transition-all flex items-center gap-1.5 ${className}`}
        >
          <Mic className="w-3.5 h-3.5 text-pink-500" />
          <span>व्हाईस रिमाइंडर</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 ${className}`}
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>🎙️ AI Voice</span>
        </button>
      )}

      {/* Quick Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    AI Female Voice Reminder
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 font-medium">
                      भारतीय स्त्री आवाज
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {borrowerName} • {formatCurrency(amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopAudio();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language & Tone Switcher */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  भाषा (Language)
                </label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => {
                      stopAudio();
                      setLanguage("mr");
                    }}
                    className={`py-1 rounded font-medium text-center transition-all ${
                      language === "mr"
                        ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    onClick={() => {
                      stopAudio();
                      setLanguage("en");
                    }}
                    className={`py-1 rounded font-medium text-center transition-all ${
                      language === "en"
                        ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  टोन (Voice Tone)
                </label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => {
                      stopAudio();
                      setTone("POLITE");
                    }}
                    className={`py-1 rounded font-medium text-center transition-all ${
                      tone === "POLITE"
                        ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    नम्र (Polite)
                  </button>
                  <button
                    onClick={() => {
                      stopAudio();
                      setTone("URGENT");
                    }}
                    className={`py-1 rounded font-medium text-center transition-all ${
                      tone === "URGENT"
                        ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    तातडी (Urgent)
                  </button>
                </div>
              </div>
            </div>

            {/* Spoken Script Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-pink-500" />
                  व्हाईस नोट स्क्रिप्ट (Voice Script)
                </span>
                <span className="text-[10px] text-pink-500">~{scriptData.durationSec}s</span>
              </div>
              <p className="italic leading-relaxed">"{scriptData.spokenText}"</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePlayVoice}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs border transition-all ${
                  isPlaying
                    ? "bg-red-500 text-white border-red-600 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>थांबवा (Stop)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-pink-500" />
                    <span>ऐका (Play Voice)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp पाठवा</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <button
                onClick={handleCopy}
                className="hover:text-pink-500 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : null}
                <span>{copied ? "कॉपी झाले!" : "स्क्रिप्ट कॉपी करा"}</span>
              </button>
              <a
                href={`/whatsapp?borrowerId=${encodeURIComponent(borrowerName)}&tab=voice`}
                className="text-pink-500 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>पूर्ण स्टुडिओ उघडा</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
