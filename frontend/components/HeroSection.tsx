"use client";

import React from "react";
import { AnalysisResult } from "../types";

function HeroSection({ result }: { result: AnalysisResult }) {
  const isHighRisk = result.risk_level === "HIGH";
  const isMediumRisk = result.risk_level === "MEDIUM";

  const badgeIcon = isHighRisk ? "🔴" : isMediumRisk ? "🟡" : "🟢";
  const badgeText = isHighRisk ? "High Risk" : isMediumRisk ? "Medium Risk" : "Low Risk";
  const badgeColors = isHighRisk
    ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
    : isMediumRisk
    ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";

  const policyTypeDisplay = result.policy_type
    ? result.policy_type.split(/[\/\s_-]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "Insurance Policy";

  // Risk summary counters
  const rs = result.risk_summary ?? { high: 0, medium: 0, low: 0 };
  const totalRisks = (rs.high ?? 0) + (rs.medium ?? 0) + (rs.low ?? 0);

  // Tags — prefer decision_tags (new schema) otherwise fall back to tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayTags: string[] = ((result as any).decision_tags ?? result.tags ?? []).slice(0, 5);

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
      {/* ── LEFT: Hero card ── */}
      <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-7 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          {/* Policy type + risk badge row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold tracking-wide ${badgeColors}`}>
              {badgeIcon} {badgeText}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300">
              {policyTypeDisplay}
            </span>
          </div>

          {/* ITCH score */}
          <div className="mt-7 flex items-baseline gap-4">
            <span className="text-6xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{result.itch_score}</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">ITCH Score</span>
              <span className="text-xs text-zinc-400">out of 100</span>
            </div>
          </div>

          {/* Short summary */}
          {result.short_summary && (
            <p className="mt-5 text-base font-medium leading-relaxed text-zinc-300">
              &ldquo;{result.short_summary}&rdquo;
            </p>
          )}

          {/* Risk distribution chips */}
          {totalRisks > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(rs.high ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-red-900/40 bg-red-950/50 px-3 py-1 text-xs font-bold text-red-400">
                  🔴 {rs.high} High
                </span>
              )}
              {(rs.medium ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-amber-900/40 bg-amber-950/50 px-3 py-1 text-xs font-bold text-amber-400">
                  🟡 {rs.medium} Medium
                </span>
              )}
              {(rs.low ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-900/40 bg-emerald-950/50 px-3 py-1 text-xs font-bold text-emerald-400">
                  🟢 {rs.low} Low
                </span>
              )}
            </div>
          )}
        </div>

        {/* Decision tags */}
        {displayTags.length > 0 && (
          <div className="mt-7 relative z-10">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Decision Tags</p>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:border-blue-500/50 hover:bg-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Quick Insight + What this means ── */}
      <div className="flex flex-col gap-5">
        {/* Quick insight */}
        <div className="flex flex-1 flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 relative z-10">Quick Insight</p>
          <p className="text-base font-semibold leading-relaxed text-white relative z-10">
            &ldquo;{result.quick_insight || (Array.isArray(result.what_this_means) ? result.what_this_means[0] : result.what_this_means) || result.summary?.split(".")[0]}&rdquo;
          </p>
        </div>

        {/* What this means */}
        {Array.isArray(result.what_this_means) && result.what_this_means.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-inner backdrop-blur-md">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">👉 What This Means</p>
            <ul className="space-y-2.5">
              {result.what_this_means.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-sm leading-relaxed text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default React.memo(HeroSection);

