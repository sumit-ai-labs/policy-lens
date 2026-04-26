"use client";

import React, { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";

import { AnalysisResult } from "../types";

const SCORE_META = [
  { key: "severity", label: "Severity" },
  { key: "frequency", label: "Frequency" },
  { key: "tam", label: "TAM" },
  { key: "whitespace", label: "Whitespace" },
] as const;

const RISK_COLORS = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

function getRiskTone(value: number, max: number) {
  const ratio = value / max;
  if (ratio >= 0.7) return "bg-red-500";
  if (ratio >= 0.4) return "bg-amber-500";
  return "bg-green-500";
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
      Value: {payload[0].value}
    </div>
  );
}

function ScoreDashboard({ result }: { result: AnalysisResult }) {
  const riskSummary = result.risk_summary ?? { high: 0, medium: 0, low: 0 };
  const donutData = [
    { name: "ITCH", value: result.itch_score ?? 0 },
    { name: "Remaining", value: Math.max(0, 100 - (result.itch_score ?? 0)) },
  ];
  const riskDistribution = [
    { name: "High", value: riskSummary.high, fill: RISK_COLORS.HIGH },
    { name: "Medium", value: riskSummary.medium, fill: RISK_COLORS.MEDIUM },
    { name: "Low", value: riskSummary.low, fill: RISK_COLORS.LOW },
  ];

  const [showExplanations, setShowExplanations] = useState(false);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donut Chart | ITCH */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/20 p-6">
          <div className="h-40 w-full min-h-[10rem] min-w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
                <RechartsTooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-white">{result.itch_score}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">ITCH</span>
          </div>
        </div>

        {/* Severity, Frequency, TAM, Whitespace */}
        <div className="flex flex-col justify-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-6">
          {SCORE_META.map((metric) => {
            const value = result.scores[metric.key];
            const tone = getRiskTone(value, 10);
            return (
              <div key={metric.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">{metric.label}</span>
                  <span className="text-xs font-bold text-white">{value}/10</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${tone}`} style={{ width: `${(value / 10) * 100}%` }} />
                </div>
                {showExplanations && result.score_explanation && result.score_explanation[metric.key] && (
                  <p className="mt-1 text-[10px] italic text-zinc-500 leading-tight">
                    {result.score_explanation[metric.key]}
                  </p>
                )}
              </div>
            );
          })}
          
          {result.score_explanation && (
            <button 
              onClick={() => setShowExplanations(!showExplanations)}
              className="mt-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors self-start"
            >
              {showExplanations ? "Hide Explanations" : "Why this score?"}
            </button>
          )}
        </div>

        {/* Risk Distribution Bar Chart */}
        <div className="flex flex-col justify-center rounded-2xl border border-white/5 bg-black/20 p-6">
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">Risk Distribution</p>
          <div className="h-32 w-full min-h-[8rem] min-w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={riskDistribution}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(ScoreDashboard);
