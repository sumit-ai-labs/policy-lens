"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FadeUp = ({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.75, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const FINDINGS = [
  { dot: "#f87171", label: "Total Terrorism Exclusion",  tag: "HIGH RISK",  tagColor: "rgba(248,113,113,0.15)", tagText: "#f87171" },
  { dot: "#fbbf24", label: "30-Day Cancellation Notice", tag: "CAUTION",    tagColor: "rgba(251,191,36,0.15)",  tagText: "#fbbf24" },
  { dot: "#60a5fa", label: "Standard Nuclear Clause",    tag: "STANDARD",   tagColor: "rgba(96,165,250,0.15)",  tagText: "#60a5fa" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center overflow-hidden lp-page">
      {/* Background orbs */}
      <div className="lp-orb lp-orb-blue" />
      <div className="lp-orb lp-orb-purple" />
      <div className="lp-orb lp-orb-cyan" />
      <div className="lp-grid-bg" />

      {/* Status badge */}
      <FadeUp delay={0.05}>
        <div className="lp-badge mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Powered by Gemini AI · Instant Policy Intelligence
        </div>
      </FadeUp>

      {/* Headline */}
      <FadeUp delay={0.12}>
        <h1 className="lp-hero-h1 max-w-5xl mx-auto">
          Understand Any{" "}
          <span className="lp-gradient-text">Insurance Policy</span>
          <br className="hidden sm:block" />
          {" "}in Seconds
        </h1>
      </FadeUp>

      {/* Subtext */}
      <FadeUp delay={0.22}>
        <p className="lp-hero-sub mx-auto mt-6 max-w-2xl">
          Stop drowning in legal jargon. PolicyAI instantly extracts hidden risks,
          exclusions, and gives you a clear, actionable verdict on any insurance document.
        </p>
      </FadeUp>

      {/* CTA Buttons */}
      <FadeUp delay={0.32} className="mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/app">
            <button id="hero-cta-analyze" className="lp-btn-primary group">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Analyze My Policy
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </Link>
          <Link href="/compare">
            <button id="hero-cta-compare" className="lp-btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Policies
            </button>
          </Link>
        </div>
      </FadeUp>



      {/* Dashboard Mockup */}
      <FadeUp delay={0.42} className="w-full mt-14 max-w-4xl mx-auto">
        <div className="lp-mockup-wrapper">
          {/* Browser chrome */}
          <div className="lp-mockup-chrome">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 flex items-center px-3">
              <span className="text-xs text-slate-500">app.policyai.com/analyze</span>
            </div>
          </div>

          {/* Content grid */}
          <div className="p-5 grid grid-cols-3 gap-3">
            {/* Risk score */}
            <div className="lp-mock-card col-span-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk Score</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-orange-400">75</span>
                <span className="text-slate-600 text-sm mb-1">/100</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(to right,#f59e0b,#f87171)" }}
                />
              </div>
              <p className="mt-2 text-xs text-orange-400 font-semibold">⚠ High Risk</p>
            </div>

            {/* Key findings */}
            <div className="lp-mock-card col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Key Findings</p>
              <div className="space-y-2">
                {FINDINGS.map((f) => (
                  <div key={f.label} className="flex items-center gap-3 rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: f.dot }} />
                    <span className="text-xs text-slate-300 flex-1 text-left truncate">{f.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: f.tagColor, color: f.tagText }}>{f.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verdict */}
            <div className="lp-mock-card col-span-3 text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Verdict</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                This policy contains <span className="text-red-400 font-semibold">3 high-risk exclusions</span> and{" "}
                <span className="text-yellow-400 font-semibold">2 moderate concerns</span>. The terrorism and nuclear
                exclusions leave significant coverage gaps.{" "}
                <span className="text-blue-400 font-semibold">Recommend reviewing alternatives before signing.</span>
              </p>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
