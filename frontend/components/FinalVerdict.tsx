"use client";

import React from "react";
import { AnalysisResult } from "../types";

const RISK_META = {
  HIGH: {
    icon: "🔴",
    label: "High Risk",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    glow: "shadow-[0_0_60px_rgba(244,63,94,0.12)]",
    accent: "bg-rose-500",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    bar: "bg-rose-400",
  },
  MEDIUM: {
    icon: "🟡",
    label: "Medium Risk",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.12)]",
    accent: "bg-amber-500",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    bar: "bg-amber-400",
  },
  LOW: {
    icon: "🟢",
    label: "Low Risk",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_60px_rgba(16,185,129,0.12)]",
    accent: "bg-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bar: "bg-emerald-400",
  },
} as const;

function FinalVerdict({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const riskKey = (result.risk_level as keyof typeof RISK_META) in RISK_META
    ? (result.risk_level as keyof typeof RISK_META)
    : "MEDIUM";
  const meta = RISK_META[riskKey];

  const conf = result.confidence;
  const confScore = conf?.score ?? null;
  const confLabel =
    confScore === null ? null
    : confScore >= 8 ? "High Confidence"
    : confScore >= 5 ? "Medium Confidence"
    : "Low Confidence";
  const confBarColor =
    confScore === null ? "bg-white/20"
    : confScore >= 8 ? "bg-emerald-400"
    : confScore >= 5 ? "bg-amber-400"
    : "bg-rose-400";
  const confPct = confScore !== null ? Math.round((confScore / 10) * 100) : 0;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border ${meta.border} ${meta.bg} ${meta.glow} p-8 sm:p-10 backdrop-blur-md`}
    >
      {/* Ambient glow blob */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full opacity-30 blur-[80px]"
        style={{ background: riskKey === "HIGH" ? "#f43f5e" : riskKey === "MEDIUM" ? "#f59e0b" : "#10b981" }}
      />

      {/* Header row */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
          Final Verdict
        </span>
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold ${meta.badge}`}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Verdict text — the main message, always fully visible */}
      <div className={`relative mx-auto mb-8 max-w-3xl rounded-2xl border ${meta.border} bg-black/30 p-6 sm:p-8`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-full ${meta.accent} opacity-70`} />
        <p className="pl-4 text-base sm:text-lg font-semibold leading-relaxed text-white/90 break-words">
          👉 {result.final_verdict}
        </p>
      </div>

      {/* Confidence + method row */}
      <div className="mb-8 flex flex-col items-center gap-4">
        {confScore !== null && (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <div className="flex w-full items-center justify-between text-xs font-bold">
              <span className="text-zinc-400">🎯 {confLabel}</span>
              <span className="text-white">{confScore}/10</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confBarColor}`}
                style={{ width: `${confPct}%` }}
              />
            </div>
            {conf?.reason && (
              <p className="text-center text-[11px] text-zinc-500 leading-snug">{conf.reason}</p>
            )}
          </div>
        )}

        {result.analysis_method && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            {result.analysis_method}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 shadow-[0_0_24px_rgba(37,99,235,0.35)]"
        >
          🔄 Analyze Another Policy
        </button>
      </div>
    </section>
  );
}

export default React.memo(FinalVerdict);
