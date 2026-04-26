import React, { memo } from "react";
import { motion } from "framer-motion";

import { PolicyComparisonResult } from "../types";
import ClauseList from "./ClauseList";

interface ComparisonDashboardProps {
  result: PolicyComparisonResult;
}

const scoreRows = [
  { key: "severity", label: "Severity" },
  { key: "frequency", label: "Frequency" },
  { key: "tam", label: "TAM" },
  { key: "whitespace", label: "Whitespace" },
] as const;

function lowerIsBetterWinner(left: number, right: number) {
  if (left === right) return "tie";
  return left < right ? "left" : "right";
}

function riskBadgeClass(level: string) {
  if (level === "HIGH") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  if (level === "MEDIUM") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}


const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0 },
};
const itemTransition = { duration: 0.3, ease: "easeOut" as const };

function ComparisonDashboard({ result }: ComparisonDashboardProps) {
  const { policy_a, policy_b, comparison } = result;
  const itchWinner = lowerIsBetterWinner(policy_a.itch_score, policy_b.itch_score);

  return (
    <motion.div
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 pb-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      
      {/* 1. Hero Recommendation Section */}
      <motion.section variants={item} transition={itemTransition} className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
        {/* Glow effect */}
        <div className="absolute -left-40 top-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]" />
        
        <div className="rounded-[2.25rem] bg-black/40 p-8 sm:p-12 border border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Final Verdict
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {comparison.recommended_policy === "policy_a"
                  ? "Policy A is safer."
                  : comparison.recommended_policy === "policy_b"
                  ? "Policy B is safer."
                  : "It's a dead heat."}
              </h2>
              <p className="mt-6 text-xl leading-relaxed text-zinc-300">
                {comparison.recommendation_reason}
              </p>
              
              {comparison.reason && comparison.reason.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {comparison.reason.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-bold text-indigo-300 border border-indigo-500/30">
                      ✓ {r}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {comparison.comparison_points.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-white/5">
                    <div className="mt-0.5 rounded-full bg-indigo-500/20 p-1 text-indigo-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-300">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-[2rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 p-8 sm:p-10 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 transition-colors duration-500 group-hover:bg-indigo-500/10" />
              <p className="relative text-xs font-black uppercase tracking-[0.3em] text-indigo-300">
                Recommended Choice
              </p>
              <div className="relative mt-6">
                <p className="text-5xl font-black text-white sm:text-6xl drop-shadow-lg">
                  {comparison.recommended_policy === "policy_a"
                    ? policy_a.label
                    : comparison.recommended_policy === "policy_b"
                      ? policy_b.label
                      : "Tie"}
                </p>
              </div>
              <p className="relative mt-8 text-sm leading-6 text-indigo-200/80">
                Lower ITCH, severity, and frequency generally indicate a safer policy structure.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. Metrics Showdown */}
      <motion.section variants={item} transition={itemTransition} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 sm:p-12 shadow-sm backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-2xl font-black text-white">Score Showdown</h3>
          <p className="mt-2 text-sm text-zinc-400">Side-by-side comparison of risk metrics (lower is better)</p>
        </div>

        <div className="mt-10 mx-auto max-w-4xl flex flex-col gap-3">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_120px_1fr] items-center gap-4 mb-4">
            <div className="text-right text-sm font-black uppercase tracking-wider text-zinc-500">{policy_a.label}</div>
            <div className="text-center text-xs font-black uppercase tracking-wider text-zinc-700">VS</div>
            <div className="text-left text-sm font-black uppercase tracking-wider text-zinc-500">{policy_b.label}</div>
          </div>

          {/* ITCH Score */}
          <div className="grid grid-cols-[1fr_120px_1fr] items-center gap-4 rounded-2xl bg-black/20 p-4 border border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex justify-end">
              <span className={`text-xl font-black px-4 py-1.5 rounded-full border ${
                itchWinner === "left" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-zinc-400 border-white/5"
              }`}>
                {policy_a.itch_score}
              </span>
            </div>
            <div className="text-center text-sm font-black uppercase tracking-widest text-white">ITCH</div>
            <div className="flex justify-start">
              <span className={`text-xl font-black px-4 py-1.5 rounded-full border ${
                itchWinner === "right" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-zinc-400 border-white/5"
              }`}>
                {policy_b.itch_score}
              </span>
            </div>
          </div>

          {/* Other Scores */}
          {scoreRows.map((row) => {
            const leftValue = policy_a.scores[row.key];
            const rightValue = policy_b.scores[row.key];
            const winner = lowerIsBetterWinner(leftValue, rightValue);

            return (
              <div key={row.key} className="grid grid-cols-[1fr_120px_1fr] items-center gap-4 rounded-2xl bg-black/20 p-4 border border-white/5 hover:bg-white/5 transition-colors">
                <div className="flex justify-end">
                  <span className={`text-lg font-bold px-4 py-1 rounded-full border ${
                    winner === "left" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-transparent text-zinc-500 border-transparent"
                  }`}>
                    {leftValue}
                  </span>
                </div>
                <div className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400">{row.label}</div>
                <div className="flex justify-start">
                  <span className={`text-lg font-bold px-4 py-1 rounded-full border ${
                    winner === "right" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-transparent text-zinc-500 border-transparent"
                  }`}>
                    {rightValue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 3. Deep Dive Breakdown */}
      <motion.section variants={item} transition={itemTransition} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[policy_a, policy_b].map((policy, index) => (
          <div key={index} className="flex flex-col gap-6 rounded-[2.5rem] bg-[#0a0a0c] border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Policy Header */}
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-3xl font-black text-white leading-tight">{policy.label}</h3>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] border ${riskBadgeClass(policy.risk_level)}`}>
                    {policy.risk_level} RISK
                  </span>
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-indigo-300">
                    ITCH {policy.itch_score}
                  </span>
                </div>
              </div>
              <p className="text-base leading-relaxed text-zinc-400 mt-2">
                {policy.short_summary || policy.summary || policy.simplified_text}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2 pb-6 border-b border-white/5">
                {policy.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-wide text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stacked Clause Lists instead of cramped grid */}
            <div className="flex flex-col gap-6 relative z-10 mt-2">
              <ClauseList 
                title="Top Risks" 
                items={policy.top_risks.map((risk) => ({
                  title: risk.title,
                  clause: risk.title,
                  reason: risk.description,
                  impact: risk.impact,
                  source: risk.source,
                }))} 
                type="danger" 
                compact 
              />
              
              <ClauseList 
                title="Conditions" 
                items={policy.conditions} 
                type="warning" 
              />
              
              <ClauseList 
                title="Exclusions" 
                items={policy.exclusions} 
                type="warning" 
              />
              
              {policy.safe_points && policy.safe_points.length > 0 && (
                <ClauseList 
                  title="Safe Aspects" 
                  items={policy.safe_points} 
                  type="neutral" 
                  compact 
                />
              )}
            </div>
          </div>
        ))}
      </motion.section>
    </motion.div>
  );
}

export default memo(ComparisonDashboard);
