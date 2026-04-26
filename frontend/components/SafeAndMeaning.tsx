"use client";

import React from "react";
import { AnalysisResult } from "../types";

function SafeAndMeaning({ result }: { result: AnalysisResult }) {
  const safePoints = result.safe_points ?? [];
  const hasSafePoints = safePoints.length > 0;

  if (!hasSafePoints) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400 relative z-10">
        ✅ Safe Aspects
      </h4>
      <ul className="grid gap-3 sm:grid-cols-2 relative z-10">
        {safePoints.map((point, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 shadow-sm transition hover:border-emerald-500/50 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">
              ✓
            </span>
            <span className="text-sm font-medium leading-relaxed text-zinc-300">{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default React.memo(SafeAndMeaning);
