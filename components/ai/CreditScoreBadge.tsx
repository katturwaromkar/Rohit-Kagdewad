"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, X, Activity } from "lucide-react";
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
    if (score >= 85) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 70) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (score >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  const getIcon = () => {
    if (result.riskLevel === "LOW") return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    if (result.riskLevel === "MODERATE") return <TrendingUp className="w-3.5 h-3.5 text-blue-400" />;
    if (result.riskLevel === "HIGH") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => setShowDetail(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getScoreColor(
          result.score
        )} ${className}`}
        title="Credit Rating & Repayment Index"
      >
        <Activity className="w-3 h-3 text-blue-400" />
        <span>Score: {result.score}</span>
        <span className="text-[10px] px-1 rounded bg-black/30 font-mono font-bold">
          {result.grade}
        </span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-xl space-y-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Credit Rating & Repayment Index (कर्जदार पत निर्देशांक)
              </h4>
              <p className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <span className="font-mono">{result.score} / 100</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getScoreColor(result.score)}`}>
                  Grade {result.grade}
                </span>
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <span className={`text-xs font-semibold px-3 py-1 rounded-xl border ${getScoreColor(result.score)} flex items-center gap-1.5`}>
              {getIcon()}
              <span>{result.riskLabelMr} ({result.riskLabelEn})</span>
            </span>
          </div>
        </div>

        {/* Progress meter */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.score >= 85
                  ? "bg-emerald-500"
                  : result.score >= 70
                  ? "bg-blue-500"
                  : result.score >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>

        {/* Portfolio Advisory & Analysis */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Underwriting & Risk Advisory (पत विश्लेषण व शिफारस):</span>
          </div>
          <p className="text-slate-200 leading-relaxed font-medium">
            {result.recommendationMr}
          </p>
          <p className="text-slate-400 text-[11px]">
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
        type="button"
        onClick={() => setShowDetail(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border shadow-sm transition-all hover:opacity-90 ${getScoreColor(
          result.score
        )} ${className}`}
      >
        <Activity className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-mono">Credit: {result.score}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-bold">
          {result.grade}
        </span>
      </button>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Borrower Credit & Repayment Profile
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{borrowerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score circle */}
            <div className="flex items-center justify-center py-2">
              <div className="text-center space-y-1.5">
                <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
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
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">वेळेवर परतफेड दर</span>
                <span className="font-bold text-white text-sm font-mono mt-0.5 block">
                  {result.repaymentRatioPct}%
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">थकबाकी हप्ते</span>
                <span className={`font-bold text-sm font-mono mt-0.5 block ${input.overdueInstallmentsCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {input.overdueInstallmentsCount}
                </span>
              </div>
            </div>

            {/* Advisory Note */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Underwriting Assessment (पत विश्लेषण व शिफारस)</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-medium">
                {result.recommendationMr}
              </p>
              <p className="text-slate-400 text-[11px]">
                {result.recommendationEn}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDetail(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-600/20"
            >
              समजले (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
