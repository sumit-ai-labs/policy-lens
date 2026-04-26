"use client";

import React from "react";
import { AnalysisResult } from "../types";

const LEVEL_CONFIG = {
  HIGH: {
    icon: "🔴",
    label: "High Risk",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    bar: "bg-rose-500",
    accent: "border-l-rose-500",
    bg: "bg-rose-950/20",
  },
  MEDIUM: {
    icon: "🟡",
    label: "Medium Risk",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    bar: "bg-amber-400",
    accent: "border-l-amber-400",
    bg: "bg-amber-950/20",
  },
  LOW: {
    icon: "🟢",
    label: "Low Risk",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    bar: "bg-emerald-400",
    accent: "border-l-emerald-400",
    bg: "bg-emerald-950/20",
  },
} as const;

function TopRisks({ result }: { result: AnalysisResult }) {
  if (!result.top_risks?.length) return null;

  const risksToDisplay = result.top_risks.slice(0, 3);

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-base">🔥</span>
          Top Risks
        </h3>
        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
          {risksToDisplay.length} Critical
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {risksToDisplay.map((risk, idx) => {
          // New schema: risk.impact is the level field (HIGH/MEDIUM/LOW)
          // risk.description is the human-readable impact text
          const levelKey = ((risk.impact ?? "LOW") as string).toUpperCase() as keyof typeof LEVEL_CONFIG;
          const cfg = LEVEL_CONFIG[levelKey] ?? LEVEL_CONFIG.LOW;

          return (
            <div
              key={idx}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-black/20 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${cfg.glow}`}
            >
              {/* Coloured left accent bar */}
              <div className={`absolute left-0 top-0 h-full w-1 ${cfg.bar}`} />

              <div className="flex flex-col gap-3 p-5 pl-6">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.badge}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                    #{idx + 1}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-base font-bold leading-snug text-white">
                  {risk.title}
                </h4>

                {/* Impact description */}
                {risk.description && (
                  <p className="text-sm leading-relaxed text-zinc-300 line-clamp-3 group-hover:line-clamp-none transition-all">
                    {risk.description}
                  </p>
                )}

                {/* Legal meaning */}
                {risk.legal_meaning && (
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
                    <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                      ⚖️ Legal
                    </p>
                    <p className="text-xs font-medium leading-relaxed text-indigo-200">
                      {risk.legal_meaning}
                    </p>
                  </div>
                )}

                {/* Ambiguity */}
                {risk.ambiguity && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400">
                      🌫 Ambiguity
                    </p>
                    <p className="text-xs font-medium leading-relaxed text-amber-200">
                      {risk.ambiguity}
                    </p>
                  </div>
                )}

                {/* Source */}
                {risk.source?.match(/\d+/)?.[0] && (
                  <p className="mt-auto text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    📄 Page {risk.source.match(/\d+/)![0]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default React.memo(TopRisks);

