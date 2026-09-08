"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, generateWhatsAppLink } from "@/lib/utils";
import { generateVoiceScript, VoiceTone } from "@/lib/ai/voice";
import { generateMarathiCallDialogue } from "@/lib/ai/voiceCalling";
import {
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  PhoneIncoming,
  Mic,
  Volume2,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
  RefreshCw,
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";

export interface ScheduledCallItem {
  id: string;
  borrowerId: string;
  borrowerName: string;
  phone: string;
  loanCode: string | null;
  scheduledDate: string;
  scheduledTime: string;
  pendingAmount: number;
  dueDate: string | null;
  language: string;
  tone: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "MISSED" | "CANCELLED";
  spokenScript: string;
  callNotes: string | null;
  executedAt: string | null;
  createdAt: string;
}

export interface BorrowerDuesOption {
  id: string;
  borrowerCode: string;
  fullName: string;
  phone: string;
  city: string;
  loanCodes: string[];
  primaryLoanCode: string;
  totalOverdue: number;
  totalDueToday: number;
  totalOutstanding: number;
  effectivePending: number;
  earliestDueDate: string | null;
  daysOverdue: number;
}

interface VoiceCallingAgentProps {
  initialBorrowers?: BorrowerDuesOption[];
  preselectedBorrowerId?: string;
}

export function VoiceCallingAgent({
  initialBorrowers = [],
  preselectedBorrowerId,
}: VoiceCallingAgentProps) {
  // Tabs: "SCHEDULED_DESK" | "LIVE_CALLER"
  const [activeTab, setActiveTab] = useState<"SCHEDULED_DESK" | "LIVE_CALLER">("SCHEDULED_DESK");

  // Scheduled Calls State
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCallItem[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerDuesOption[]>(initialBorrowers);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // New Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(preselectedBorrowerId || "");
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleTime, setScheduleTime] = useState("10:30 AM");
  const [callTone, setCallTone] = useState<VoiceTone>("POLITE");
  const [callLanguage, setCallLanguage] = useState<"mr" | "en">("mr");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [callNotes, setCallNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Phone Call Simulator State
  const [activeCall, setActiveCall] = useState<{
    borrowerName: string;
    phone: string;
    pendingAmount: number;
    loanCode: string;
    dueDate?: string;
    script: string;
    callId?: string;
  } | null>(null);

  const [callState, setCallState] = useState<"IDLE" | "DIALING" | "CONNECTED" | "ENDED">("IDLE");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Best Indian voice selector
  const [speechVoice, setSpeechVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Load voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const best =
        voices.find(
          (v) =>
            (v.lang.includes("IN") || v.lang.includes("mr") || v.lang.includes("hi")) &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("heera") ||
              v.name.toLowerCase().includes("neerja") ||
              v.name.toLowerCase().includes("veena") ||
              v.name.toLowerCase().includes("priya") ||
              v.name.toLowerCase().includes("swara") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("google"))
        ) ||
        voices.find((v) => v.lang.startsWith("mr") || v.lang.startsWith("hi") || v.lang === "en-IN") ||
        voices.find((v) => v.lang.includes("en-IN")) ||
        voices[0];
      setSpeechVoice(best || null);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Fetch scheduled calls and borrowers dues
  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/voice-calls/list?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setScheduledCalls(data.calls || []);
      }
    } catch (e) {
      console.error("Failed to fetch scheduled calls", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBorrowers = async () => {
    try {
      const res = await fetch("/api/voice-calls/borrower-dues");
      const data = await res.json();
      if (data.success && Array.isArray(data.borrowers)) {
        setBorrowers(data.borrowers);
        if (!selectedBorrowerId && data.borrowers.length > 0) {
          setSelectedBorrowerId(data.borrowers[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch borrower dues", e);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [statusFilter]);

  useEffect(() => {
    if (borrowers.length === 0) {
      fetchBorrowers();
    }
  }, []);

  // Selected borrower info for scheduling modal
  const currentSelectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId) || borrowers[0];

  const effectiveScheduleAmount = customAmount
    ? parseFloat(customAmount) || 0
    : currentSelectedBorrower?.effectivePending || 5000;

  // Generate live script preview for modal
  const previewData = generateVoiceScript("PHONE_CALL_REMINDER", {
    borrowerName: currentSelectedBorrower?.fullName || "Borrower",
    amount: effectiveScheduleAmount,
    dueDate: currentSelectedBorrower?.earliestDueDate || undefined,
    loanCode: currentSelectedBorrower?.primaryLoanCode || "LN-MAIN",
    language: callLanguage,
    tone: callTone,
  });

  // Call timer effect
  useEffect(() => {
    if (callState === "CONNECTED") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Handle Start Live AI Call
  const startLiveCall = (callData: {
    borrowerName: string;
    phone: string;
    pendingAmount: number;
    loanCode: string;
    dueDate?: string;
    script?: string;
    callId?: string;
  }) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const marathiDialogue = generateMarathiCallDialogue({
      borrowerName: callData.borrowerName,
      pendingAmount: callData.pendingAmount,
      dueDate: callData.dueDate,
      loanCode: callData.loanCode,
      tone: callTone,
    });

    const script = callData.script || marathiDialogue.fullSpokenScript;

    setActiveCall({
      ...callData,
      script,
    });

    setCallState("DIALING");
    setActiveTab("LIVE_CALLER");

    // Simulate connection delay (2.5s dialing / ringing)
    setTimeout(() => {
      setCallState("CONNECTED");
      speakCallScript(script, callData.callId);
    }, 2500);
  };

  // Speak script via Web Speech API in Marathi
  const speakCallScript = (script: string, callId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "mr-IN";
    utterance.rate = 0.88;
    utterance.pitch = 1.15; // Natural Indian Female Tone

    if (speechVoice) {
      utterance.voice = speechVoice;
    }

    utterance.onend = async () => {
      // Keep connected for a few seconds then end
      setTimeout(() => {
        setCallState("ENDED");
        if (callId) {
          markCallCompleted(callId, "AI Automated Marathi Call completed successfully.");
        }
      }, 3000);
    };

    utterance.onerror = () => {
      setCallState("ENDED");
    };

    window.speechSynthesis.speak(utterance);
  };

  // End Call Handler
  const endCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallState("ENDED");
  };

  // Mark Call as Completed in Backend
  const markCallCompleted = async (callId: string, notes?: string) => {
    try {
      await fetch("/api/voice-calls/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId,
          callNotes: notes || "AI automated voice call completed.",
          status: "COMPLETED",
        }),
      });
      fetchCalls();
    } catch (e) {
      console.error("Failed to mark call executed", e);
    }
  };

  // Cancel Scheduled Call
  const cancelCall = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled call?")) return;
    try {
      const res = await fetch(`/api/voice-calls/schedule?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCalls();
      }
    } catch (e) {
      console.error("Failed to cancel call", e);
    }
  };

  // Handle Schedule Form Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowerId || !scheduleDate || !scheduleTime) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/voice-calls/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: selectedBorrowerId,
          borrowerName: currentSelectedBorrower?.fullName,
          phone: currentSelectedBorrower?.phone,
          loanCode: currentSelectedBorrower?.primaryLoanCode,
          scheduledDate: scheduleDate,
          scheduledTime: scheduleTime,
          customAmount: customAmount ? parseFloat(customAmount) : undefined,
          dueDate: currentSelectedBorrower?.earliestDueDate,
          language: callLanguage,
          tone: callTone,
          callNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowScheduleModal(false);
        setCallNotes("");
        setCustomAmount("");
        fetchCalls();
      } else {
        alert(data.error || "Failed to schedule call.");
      }
    } catch (err: any) {
      alert("Failed to schedule call: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered calls
  const filteredCalls = scheduledCalls.filter((c) => {
    const matchesSearch =
      c.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.loanCode && c.loanCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const formatSecToTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>AI Automated Marathi Voice Calling Agent</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                100% मोफत / Free
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated scheduled phone calls speaking live pending amounts & due dates in natural Marathi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant={activeTab === "SCHEDULED_DESK" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("SCHEDULED_DESK")}
            className="text-xs h-9 gap-1.5"
          >
            <Calendar className="h-4 w-4" />
            <span>Scheduled Calls Desk</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "LIVE_CALLER" ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              if (!activeCall && borrowers.length > 0) {
                const b = borrowers[0];
                setActiveCall({
                  borrowerName: b.fullName,
                  phone: b.phone,
                  pendingAmount: b.effectivePending,
                  loanCode: b.primaryLoanCode,
                  dueDate: b.earliestDueDate || undefined,
                  script: "",
                });
              }
              setActiveTab("LIVE_CALLER");
            }}
            className="text-xs h-9 gap-1.5"
          >
            <PhoneIncoming className="h-4 w-4 text-emerald-400" />
            <span>Live AI Caller Terminal</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule New Call</span>
          </Button>
        </div>
      </div>

      {/* TAB 1: SCHEDULED CALLS DESK */}
      {activeTab === "SCHEDULED_DESK" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search borrower or phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      statusFilter === st
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchCalls}
                className="h-8 px-2.5 border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Table of Scheduled Calls */}
          <div className="border border-slate-800 bg-slate-900/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Borrower (कर्जदार)</th>
                    <th className="p-3.5">Schedule Date & Time</th>
                    <th className="p-3.5">Live Pending Dues</th>
                    <th className="p-3.5">Language & Tone</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                        Loading scheduled voice calls...
                      </td>
                    </tr>
                  ) : filteredCalls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <PhoneCall className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="font-medium text-slate-300">No scheduled calls found</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Click "Schedule New Call" to set up an automated Marathi AI phone reminder.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCalls.map((call) => {
                      const isUpcoming = call.status === "SCHEDULED";
                      const waText = `🎙️ *AI व्हॉईस कॉल संदेश*\n\n` +
                        `नमस्कार *${call.borrowerName}*,\n\n` +
                        `📢 *थकीत रक्कम:* ₹${call.pendingAmount.toLocaleString("en-IN")}\n` +
                        `📅 *अंतिम तारीख:* ${call.dueDate ? formatDate(call.dueDate, "dd MMMM yyyy") : "आज"}\n\n` +
                        `💬 *संदेश:* "${call.spokenScript}"\n\n` +
                        `🏢 *रोहित कागदेवाड प्रायव्हेट लेंडिंग*\n📞 9665269105`;

                      const waUrl = generateWhatsAppLink(call.phone, waText);

                      return (
                        <tr key={call.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{call.borrowerName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              +91 {call.phone} {call.loanCode ? `• ${call.loanCode}` : ""}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                              <span>{formatDate(call.scheduledDate, "dd MMM yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{call.scheduledTime}</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-amber-400 font-mono">
                              ₹{call.pendingAmount.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Due: {call.dueDate ? formatDate(call.dueDate, "dd MMM") : "Today"}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                              {call.language === "mr" ? "मराठी" : "English"} &bull; {call.tone}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                call.status === "SCHEDULED"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                  : call.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {call.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1-Tap AI Call Simulator */}
                              <button
                                type="button"
                                onClick={() =>
                                  startLiveCall({
                                    borrowerName: call.borrowerName,
                                    phone: call.phone,
                                    pendingAmount: call.pendingAmount,
                                    loanCode: call.loanCode || "LN-MAIN",
                                    dueDate: call.dueDate || undefined,
                                    script: call.spokenScript,
                                    callId: call.id,
                                  })
                                }
                                title="Run Live AI Call Now"
                                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 transition-all shadow-sm"
                              >
                                <PhoneForwarded className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Call Now</span>
                              </button>

                              {/* Direct Phone Call */}
                              <a
                                href={`tel:${call.phone.replace(/[^0-9+]/g, "")}`}
                                title="Direct Phone Telephony"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                              </a>

                              {/* Send WhatsApp Audio Script */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Send WhatsApp Message"
                                className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </a>

                              {/* Cancel */}
                              {isUpcoming && (
                                <button
                                  type="button"
                                  onClick={() => cancelCall(call.id)}
                                  title="Cancel Schedule"
                                  className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 transition-all flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE AI CALLER TERMINAL */}
      {activeTab === "LIVE_CALLER" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Phone Caller Terminal */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-slate-800 bg-slate-900/90 shadow-2xl">
              <CardHeader className="py-4 px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <PhoneIncoming className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white">
                      Live AI Phone Caller Simulator (मराठी)
                    </CardTitle>
                    <p className="text-[11px] text-slate-400">
                      Real-time interactive voice dialog & borrower live response terminal
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase ${
                      callState === "CONNECTED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                        : callState === "DIALING"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {callState}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Caller Screen Simulation */}
                <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-5 overflow-hidden shadow-2xl">
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-emerald-600/5 pointer-events-none" />

                  {/* Avatar & Pulse Ring */}
                  <div className="relative">
                    {callState === "CONNECTED" && (
                      <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
                    )}
                    {callState === "DIALING" && (
                      <span className="absolute -inset-4 rounded-full bg-amber-500/20 animate-ping" />
                    )}
                    <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-slate-600 flex items-center justify-center shadow-xl">
                      <User className="h-10 w-10 text-slate-200" />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 z-10">
                    <h3 className="text-xl font-bold text-white">
                      {activeCall?.borrowerName || "Select Borrower"}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      +91 {activeCall?.phone || "0000000000"} &bull; Loan: {activeCall?.loanCode || "LN-MAIN"}
                    </p>
                    <div className="text-xs font-mono text-emerald-400 font-semibold pt-1">
                      {callState === "CONNECTED"
                        ? `⏱️ Call in Progress: ${formatSecToTime(callDuration)}`
                        : callState === "DIALING"
                        ? "📞 Calling Borrower..."
                        : callState === "ENDED"
                        ? "🔴 Call Ended"
                        : "Ready to Call"}
                    </div>
                  </div>

                  {/* Audio Waveform Simulator */}
                  <div className="w-full max-w-xs flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl bg-slate-900 border border-slate-800 z-10">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const height =
                        callState === "CONNECTED"
                          ? Math.max(20, Math.floor(Math.sin((i + callDuration * 3) * 0.6) * 100))
                          : 15;
                      return (
                        <div
                          key={i}
                          style={{ height: `${height}%` }}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            callState === "CONNECTED"
                              ? "bg-emerald-400"
                              : callState === "DIALING"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-slate-700"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Call Controls Bar */}
                  <div className="flex items-center gap-4 z-10 pt-2">
                    {callState === "IDLE" || callState === "ENDED" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCall) {
                            startLiveCall(activeCall);
                          }
                        }}
                        className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 transition-all active:scale-95"
                        title="Start AI Call"
                      >
                        <PhoneCall className="h-6 w-6 fill-white" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={endCall}
                        className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all active:scale-95 animate-pulse"
                        title="End Call"
                      >
                        <PhoneOff className="h-6 w-6 fill-white" />
                      </button>
                    )}

                    {/* Direct Telephony Call Link */}
                    {activeCall && (
                      <a
                        href={`tel:${activeCall.phone.replace(/[^0-9+]/g, "")}`}
                        className="h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition-all"
                        title="Open in Phone Dialer (SIM Call)"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Spoken Dialog Transcript */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      AI Spoken Marathi Speech Transcript (उच्चार मजकूर)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Indian Female Tone &bull; 0.88x Natural Cadence
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                    {activeCall?.script || "No active speech loaded. Select a borrower to generate Marathi script."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Select Borrower & Instant Dues Breakdown */}
          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/90">
              <CardHeader className="py-3.5 px-4 bg-slate-950 border-b border-slate-800">
                <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
                  Select Borrower for Live Call
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {borrowers.map((b) => {
                    const isSelected = activeCall?.phone === b.phone;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          const marathiDialogue = generateMarathiCallDialogue({
                            borrowerName: b.fullName,
                            pendingAmount: b.effectivePending,
                            dueDate: b.earliestDueDate,
                            loanCode: b.primaryLoanCode,
                            tone: callTone,
                          });

                          setActiveCall({
                            borrowerName: b.fullName,
                            phone: b.phone,
                            pendingAmount: b.effectivePending,
                            loanCode: b.primaryLoanCode,
                            dueDate: b.earliestDueDate || undefined,
                            script: marathiDialogue.fullSpokenScript,
                          });
                          setCallState("IDLE");
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-blue-600/10 border-blue-500 text-white shadow-md"
                            : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{b.fullName}</span>
                          <span className="font-bold text-xs font-mono text-amber-400">
                            ₹{b.effectivePending.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>+91 {b.phone}</span>
                          <span>{b.daysOverdue > 0 ? `${b.daysOverdue}d Overdue` : "Due Active"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Schedule Automated AI Voice Call
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calls borrower at chosen date & time in Marathi with live pending balance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* Borrower Select */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Borrower (कर्जदार)
                </label>
                <select
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none"
                  required
                >
                  {borrowers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} (+91 {b.phone}) — ₹{b.effectivePending.toLocaleString("en-IN")} Dues
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Call Date (दिनांक)
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Call Time (वेळ)
                  </label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* Amount & Tone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Pending Amount (रक्कम ₹)
                  </label>
                  <input
                    type="number"
                    value={customAmount || (currentSelectedBorrower ? String(currentSelectedBorrower.effectivePending) : "")}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Tone (आवाजाचा टोन)
                  </label>
                  <select
                    value={callTone}
                    onChange={(e) => setCallTone(e.target.value as VoiceTone)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="POLITE">नम्र स्मरणपत्र (Polite Reminder)</option>
                    <option value="URGENT">तातडीची सूचना (Urgent Overdue Alert)</option>
                  </select>
                </div>
              </div>

              {/* Spoken Script Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Generated Marathi Calling Script Preview
                </span>
                <p className="text-slate-200 leading-relaxed">
                  "{previewData.spokenText}"
                </p>
              </div>

              {/* Call Notes */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Internal Notes (पर्यायी)
                </label>
                <input
                  type="text"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. Call after morning business hours"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleModal(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {isSubmitting ? "Scheduling..." : "Confirm & Schedule Call"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
