"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles, TrendingUp, X } from "lucide-react";
import { CreditScoreResult, calculateBorrowerRiskScore, BorrowerCreditInput } from "@/lib/ai/risk-scoring";

interface CreditScoreBadgeProps {
  input: BorrowerCreditInput;
  borrowerName?: string;
  variant?: "badge" | "card" | "compact";
  className?: string;
}

export function CreditScoreBadge({
  input,
  borrowerName = "Borrower",
  variant = "badge",
  className = "",
}: CreditScoreBadgeProps) {
  const [showDetail, setShowDetail] = useState(false);
  const result: CreditScoreResult = calculateBorrowerRiskScore(input);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 70) return "text-blue-500 bg-blue-500/10 border-blue-500/30";
    if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    return "text-red-500 bg-red-500/10 border-red-500/30";
  };

  const getIcon = () => {
    if (result.riskLevel === "LOW") return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
    if (result.riskLevel === "MODERATE") return <TrendingUp className="w-3.5 h-3.5 text-blue-500" />;
    if (result.riskLevel === "HIGH") return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
  };

  if (variant === "compact") {
    return (
      <button
        onClick={() => setShowDetail(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getScoreColor(
          result.score
        )} ${className}`}
        title="AI Credit Score"
      >
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>AI Score: {result.score}</span>
        <span className="text-[9px] px-1 rounded bg-black/10 dark:bg-white/10 font-mono">
          {result.grade}
        </span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                AI क्रेडिट स्कोअर (Credit Health)
              </h4>
              <p className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{result.score} / 100</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getScoreColor(result.score)}`}>
                  Grade {result.grade}
                </span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getScoreColor(result.score)} flex items-center gap-1`}>
              {getIcon()}
              <span>{result.riskLabelMr}</span>
            </span>
          </div>
        </div>

        {/* Progress meter */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.score >= 85
                  ? "bg-emerald-500"
                  : result.score >= 70
                  ? "bg-blue-500"
                  : result.score >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
          <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI शिफारस (AI Recommendation):</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {result.recommendationMr}
          </p>
          <p className="text-slate-400 text-[11px] italic">
            {result.recommendationEn}
          </p>
        </div>
      </div>
    );
  }

  // Default badge
  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-sm transition-all hover:scale-105 ${getScoreColor(
          result.score
        )} ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>AI: {result.score}</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">
          {result.grade}
        </span>
      </button>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    AI Borrower Credit Health
                  </h3>
                  <p className="text-xs text-slate-500">{borrowerName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score circle */}
            <div className="flex items-center justify-center py-2">
              <div className="text-center space-y-1">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {result.score}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
                <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${getScoreColor(result.score)}`}>
                  {result.riskLabelMr} ({result.riskLabelEn})
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">वेळेवर परतफेड दर</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {result.repaymentRatioPct}%
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[11px]">थकबाकी हप्ते</span>
                <span className={`font-bold text-sm ${input.overdueInstallmentsCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {input.overdueInstallmentsCount}
                </span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/40 text-xs space-y-1.5">
              <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>AI पत विश्लेषण व शिफारस</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {result.recommendationMr}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                {result.recommendationEn}
              </p>
            </div>

            <button
              onClick={() => setShowDetail(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition-colors hover:opacity-90"
            >
              समजले (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
