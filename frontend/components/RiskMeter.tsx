"use client";

import React from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { RiskSummary, Scores } from "../types";

interface RiskMeterProps {
  scores: Scores;
  itchScore: number;
  riskSummary: RiskSummary;
}

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
  if (ratio >= 0.7) return "bg-rose-500";
  if (ratio >= 0.4) return "bg-amber-500";
  return "bg-emerald-500";
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 shadow-lg">
      Based on AI + risk density: {payload[0].value}
    </div>
  );
}

function RiskMeter({ scores, itchScore, riskSummary }: RiskMeterProps) {
  const donutData = [
    { name: "ITCH", value: itchScore },
    { name: "Remaining", value: Math.max(0, 100 - itchScore) },
  ];
  const riskDistribution = [
    { name: "High", value: riskSummary.high, fill: RISK_COLORS.HIGH },
    { name: "Medium", value: riskSummary.medium, fill: RISK_COLORS.MEDIUM },
    { name: "Low", value: riskSummary.low, fill: RISK_COLORS.LOW },
  ];

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Score Dashboard</p>
        <h3 className="mt-2 text-2xl font-black text-zinc-900">ITCH Score</h3>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid grid-cols-1 gap-4">
          <div
            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-5 text-white shadow-lg shadow-zinc-900/10"
            title="ITCH blends severity, frequency, TAM, and whitespace into one score."
          >
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={58}
                    outerRadius={78}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="rgba(255,255,255,0.12)" />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-28 flex flex-col items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">ITCH Score</span>
              <span className="mt-2 text-5xl font-black text-white">{itchScore}</span>
            </div>
          </div>

          <div
            className="rounded-[1.75rem] border border-zinc-200/60 bg-stone-50/50 p-5 transition-all duration-300 hover:border-zinc-200 hover:bg-white hover:shadow-sm"
            title="Count of high, medium, and low risks found in the policy."
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Risk Distribution</p>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#52525b", fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {SCORE_META.map((metric) => {
            const value = scores[metric.key];
            const tone = getRiskTone(value, 10);

            return (
              <div
                key={metric.key}
                className="rounded-2xl border border-transparent bg-stone-50/80 px-4 py-4 transition-all duration-300 hover:border-zinc-200 hover:bg-white hover:shadow-sm"
                title="Based on AI signals plus extracted risk density."
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-wide text-zinc-700">{metric.label}</span>
                  <span className="text-sm font-black text-zinc-900">{value}/10</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200">
                  <div className={`h-full rounded-full ${tone}`} style={{ width: `${(value / 10) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default React.memo(RiskMeter);
