"use client";

import React, { useState } from "react";
import { AnalysisResult, RiskyClause } from "../types";
import CollapsibleSection from "./CollapsibleSection";

// ─── Keyword highlight ────────────────────────────────────────────────────────
const HIGHLIGHT_KEYWORDS = [
  "claim", "premium", "surrender", "deadline", "charges",
  "penalty", "lock-in", "document", "exclusion", "void",
  "forfeiture", "deductible", "depreciation", "rejection", "denial",
];

function HighlightedText({ text }: { text: string }) {
  const pattern = new RegExp(`(${HIGHLIGHT_KEYWORDS.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const isKw = HIGHLIGHT_KEYWORDS.some(
          (k) => k.toLowerCase() === part.toLowerCase()
        );
        return isKw ? (
          <mark key={i} className="rounded bg-blue-500/20 px-1 py-0.5 font-semibold text-blue-300 not-italic">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
}

// ─── Condition item ───────────────────────────────────────────────────────────
function ConditionItem({ text, index }: { text: string; index: number }) {
  return (
    <li className="group flex items-start gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition-all duration-200 hover:border-amber-500/50 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-black text-amber-400">
        {index + 1}
      </span>
      <span className="text-sm leading-6 text-zinc-300">
        <HighlightedText text={text} />
      </span>
    </li>
  );
}

// ─── Exclusion item ───────────────────────────────────────────────────────────
function ExclusionItem({ text }: { text: string }) {
  return (
    <li className="group flex items-start gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition-all duration-200 hover:border-rose-500/50 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
      <span className="text-sm leading-6 text-zinc-300">
        <HighlightedText text={text} />
      </span>
    </li>
  );
}

// ─── Risk item ────────────────────────────────────────────────────────────────
const pillColors = {
  HIGH: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  LOW: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const levelBorder = {
  HIGH: "border-l-rose-500 hover:border-rose-500/50 hover:bg-white/5",
  MEDIUM: "border-l-amber-500 hover:border-amber-500/50 hover:bg-white/5",
  LOW: "border-l-emerald-500 hover:border-emerald-500/50 hover:bg-white/5",
};

const levelBar = {
  HIGH: "bg-rose-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};

function RiskItem({ risk }: { risk: RiskyClause }) {
  const [expanded, setExpanded] = useState(false);
  const level = (risk.impact ?? "LOW") as "HIGH" | "MEDIUM" | "LOW";
  const pill = pillColors[level] ?? pillColors.LOW;
  const border = levelBorder[level] ?? levelBorder.LOW;
  const bar = levelBar[level] ?? levelBar.LOW;
  const hasExtra = !!(risk.legal_meaning || risk.ambiguity);

  return (
    <li
      className={`rounded-2xl border border-white/5 border-l-4 bg-black/20 px-4 py-3.5 transition-all duration-200 shadow-sm ${border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-5 text-white">
          <HighlightedText text={risk.title || risk.clause} />
        </p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${pill}`}
        >
          {level}
        </span>
      </div>

      {/* Impact / reason */}
      <p className="mt-2 text-sm leading-5 text-zinc-400 line-clamp-2">
        <HighlightedText text={risk.reason || risk.clause} />
      </p>

      {/* Confidence bar (if impact_level present) */}
      {risk.impact_level && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${bar}`}
              style={{ width: level === "HIGH" ? "85%" : level === "MEDIUM" ? "55%" : "25%" }}
            />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
            {level === "HIGH" ? "High" : level === "MEDIUM" ? "Medium" : "Low"} risk
          </span>
        </div>
      )}

      {/* Source line */}
      {risk.source && (
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          📄 {risk.source}
        </p>
      )}

      {/* Legal / Ambiguity expand */}
      {hasExtra && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? "Hide" : "Legal details"}
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-xs leading-5">
              {risk.legal_meaning && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-400">⚖️</span>
                  <p>
                    <span className="font-black uppercase tracking-wide text-zinc-500">Legal: </span>
                    <span className="text-zinc-300">{risk.legal_meaning}</span>
                  </p>
                </div>
              )}
              {risk.ambiguity && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-400">🌫</span>
                  <p>
                    <span className="font-black uppercase tracking-wide text-amber-500">Ambiguity: </span>
                    <span className="text-zinc-300">{risk.ambiguity}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}

// ─── Evidence panel ───────────────────────────────────────────────────────────
interface EvidenceItem {
  snippet: string;
  label: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
}

const evidencePill: Record<string, string> = {
  risk: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  exclusion: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  condition: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  ambiguity: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

const evidenceImpactPill: Record<string, string> = {
  HIGH: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  LOW: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-zinc-500">{pct}%</span>
    </div>
  );
}

function EvidencePanel({ items }: { items: EvidenceItem[] }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-3">
      {items.map((e, i) => (
        <li
          key={i}
          className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/20 px-4 py-3.5 text-sm shadow-sm transition hover:border-white/20 hover:bg-white/10"
        >
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${evidencePill[e.label] ?? evidencePill.risk}`}
            >
              {e.label}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${evidenceImpactPill[(e.impact ?? "LOW")] ?? evidenceImpactPill.LOW}`}
            >
              {e.impact}
            </span>
            <span className="ml-auto">
              <ConfidenceBar value={e.confidence ?? 0} />
            </span>
          </div>
          {/* Snippet */}
          <p className="italic leading-5 text-zinc-400">&ldquo;{e.snippet}&rdquo;</p>
        </li>
      ))}
    </ul>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
function CollapsibleSections({ result }: { result: AnalysisResult }) {
  const conditions = result.conditions ?? [];
  const exclusions = result.exclusions ?? [];
  const allRisks = (result.all_risks ?? []) as RiskyClause[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const evidence = ((result as any).evidence ?? []) as EvidenceItem[];

  const hasConditions = conditions.length > 0;
  const hasExclusions = exclusions.length > 0;
  const hasRisks = allRisks.length > 0;
  const hasEvidence = evidence.length > 0;

  if (!hasConditions && !hasExclusions && !hasRisks && !hasEvidence) return null;

  return (
    <section className="space-y-3 relative z-10">
      <h3 className="px-1 text-xs font-black uppercase tracking-widest text-zinc-500">
        Detailed Breakdown
      </h3>

      {/* ── Conditions ───────────────────────────────────── */}
      {hasConditions && (
        <CollapsibleSection
          title="Conditions"
          badge={conditions.length}
          accent="amber"
          defaultOpen={conditions.length <= 5}
        >
          <p className="mb-3 text-xs text-zinc-500">
            Requirements you must meet for the policy to remain valid or for a claim to succeed.
          </p>
          <ul className="space-y-2">
            {conditions.map((item, i) => (
              <ConditionItem key={i} text={item} index={i} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── Exclusions ───────────────────────────────────── */}
      {hasExclusions && (
        <CollapsibleSection
          title="Exclusions"
          badge={exclusions.length}
          accent="rose"
          defaultOpen={exclusions.length <= 5}
        >
          <p className="mb-3 text-xs text-zinc-500">
            These situations are <strong className="text-rose-600">not covered</strong> — review carefully before relying on this policy.
          </p>
          <ul className="space-y-2">
            {exclusions.map((item, i) => (
              <ExclusionItem key={i} text={item} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── All Risks ────────────────────────────────────── */}
      {hasRisks && (
        <CollapsibleSection
          title="Additional Risks"
          badge={allRisks.length}
          accent="zinc"
        >
          <p className="mb-3 text-xs text-zinc-500">
            All identified risks beyond the top 3, ranked by severity. Click &ldquo;Legal details&rdquo; for deeper analysis.
          </p>
          <ul className="space-y-2.5">
            {allRisks.map((risk, i) => (
              <RiskItem key={i} risk={risk} />
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── Evidence ─────────────────────────────────────── */}
      {hasEvidence && (
        <CollapsibleSection
          title="Supporting Evidence"
          badge={evidence.length}
          accent="blue"
        >
          <p className="mb-3 text-xs text-zinc-500">
            Exact clauses extracted from the policy document that support the analysis above. Confidence bars show how clearly each clause supports its label.
          </p>
          <EvidencePanel items={evidence} />
        </CollapsibleSection>
      )}
    </section>
  );
}

export default React.memo(CollapsibleSections);
