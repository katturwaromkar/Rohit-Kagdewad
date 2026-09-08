"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

interface MonthlyData {
  month: string;
  collected: number;
  disbursed: number;
}

interface FinancialChartsProps {
  monthlyData: MonthlyData[];
  portfolioStats: {
    activeCount: number;
    overdueCount: number;
    closedCount: number;
    activeAmount: number;
    overdueAmount: number;
    closedAmount: number;
  };
}

export function FinancialCharts({ monthlyData, portfolioStats }: FinancialChartsProps) {
  const [activeTab, setActiveTab] = useState<"trend" | "comparison">("trend");

  const totalLoansCount = portfolioStats.activeCount + portfolioStats.overdueCount + portfolioStats.closedCount;
  const activePct = totalLoansCount > 0 ? Math.round((portfolioStats.activeCount / totalLoansCount) * 100) : 0;
  const overduePct = totalLoansCount > 0 ? Math.round((portfolioStats.overdueCount / totalLoansCount) * 100) : 0;
  const closedPct = totalLoansCount > 0 ? Math.round((portfolioStats.closedCount / totalLoansCount) * 100) : 0;

  // Find maximum value for SVG scaling
  const maxCollection = Math.max(...monthlyData.map((d) => Math.max(d.collected, d.disbursed, 10000)), 50000);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 200;
  const padding = { top: 20, right: 20, bottom: 35, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Generate SVG points for collection line/area
  const points = monthlyData.map((d, i) => {
    const x = padding.left + (i / Math.max(monthlyData.length - 1, 1)) * graphWidth;
    const y = padding.top + graphHeight - (d.collected / maxCollection) * graphHeight;
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x},${p.y}`, "");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${padding.top + graphHeight} L ${points[0].x},${padding.top + graphHeight} Z`
    : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Graph Card (8 cols) */}
      <Card className="lg:col-span-8 bg-slate-900 border-slate-800">
        <CardHeader className="py-3 px-4 sm:px-6 bg-slate-800/40 border-b border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
              Financial Performance & Trends (आर्थिक विश्लेषण)
            </CardTitle>
          </div>

          {/* Toggle View */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab("trend")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "trend"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Collection Trend
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "comparison"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Disbursement vs Collection
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {activeTab === "trend" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block"></span>
                  Monthly Repayment Revenue
                </span>
                <span className="font-mono text-slate-300 font-semibold">
                  Peak: {formatCurrency(Math.max(...monthlyData.map(d => d.collected), 0))}
                </span>
              </div>

              {/* Responsive SVG Area Chart */}
              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-44 sm:h-52 overflow-visible"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = padding.top + graphHeight * (1 - ratio);
                    return (
                      <g key={idx}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={svgWidth - padding.right}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 3}
                          textAnchor="end"
                          className="fill-slate-500 text-[9px] font-mono"
                        >
                          {formatCurrency(maxCollection * ratio).replace(".00", "")}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#areaGradient)" />
                  )}

                  {/* Trend line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Points & Month Labels */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        className="fill-blue-500 stroke-slate-900 stroke-2 hover:r-6 transition-all"
                      />
                      <text
                        x={p.x}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-medium"
                      >
                        {p.month}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          ) : (
            /* Bar Comparison Chart */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block"></span>
                    Disbursed (वाटप)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                    Recovered (वसुली)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:gap-4 h-44 sm:h-52 items-end pt-4 border-b border-slate-800">
                {monthlyData.map((d, i) => {
                  const disbHeight = Math.max(8, Math.round((d.disbursed / maxCollection) * 100));
                  const collHeight = Math.max(8, Math.round((d.collected / maxCollection) * 100));

                  return (
                    <div key={i} className="flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        <div
                          style={{ height: `${disbHeight}%` }}
                          className="w-1/2 max-w-[18px] bg-blue-600 rounded-t group-hover:bg-blue-500 transition-all"
                          title={`Disbursed: ${formatCurrency(d.disbursed)}`}
                        />
                        <div
                          style={{ height: `${collHeight}%` }}
                          className="w-1/2 max-w-[18px] bg-emerald-600 rounded-t group-hover:bg-emerald-500 transition-all"
                          title={`Collected: ${formatCurrency(d.collected)}`}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 mt-1">
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Status Distribution Card (4 cols) */}
      <Card className="lg:col-span-4 bg-slate-900 border-slate-800">
        <CardHeader className="py-3.5 px-4 bg-slate-800/40 border-b border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
              Portfolio Health (स्थिती)
            </CardTitle>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{totalLoansCount} Loans</span>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Segmented Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-800 flex overflow-hidden">
              <div
                style={{ width: `${activePct}%` }}
                className="bg-blue-500 transition-all"
                title={`Active: ${activePct}%`}
              />
              <div
                style={{ width: `${overduePct}%` }}
                className="bg-red-500 transition-all"
                title={`Overdue: ${overduePct}%`}
              />
              <div
                style={{ width: `${closedPct}%` }}
                className="bg-emerald-500 transition-all"
                title={`Closed: ${closedPct}%`}
              />
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-white">Active Loans (सुरू)</div>
                  <div className="text-[10px] text-slate-400">{portfolioStats.activeCount} Accounts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white">{formatCurrency(portfolioStats.activeAmount)}</div>
                <div className="text-[10px] text-blue-400 font-semibold">{activePct}% of Total</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-white">Overdue Loans (थकीत)</div>
                  <div className="text-[10px] text-slate-400">{portfolioStats.overdueCount} Accounts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-red-400">{formatCurrency(portfolioStats.overdueAmount)}</div>
                <div className="text-[10px] text-red-400 font-semibold">{overduePct}% of Total</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-white">Closed Loans (पूर्ण)</div>
                  <div className="text-[10px] text-slate-400">{portfolioStats.closedCount} Accounts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-emerald-400">{formatCurrency(portfolioStats.closedAmount)}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{closedPct}% of Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
