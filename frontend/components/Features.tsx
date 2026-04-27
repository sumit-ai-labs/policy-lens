"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const InView = ({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const FEATURES = [
  {
    id: "feature-analyze",
    gradient: "linear-gradient(135deg,rgba(91,142,248,0.15),rgba(91,142,248,0.05))",
    border: "rgba(91,142,248,0.25)",
    iconBg: "rgba(91,142,248,0.15)",
    iconColor: "#5b8ef8",
    badgeBg: "rgba(91,142,248,0.12)",
    badgeColor: "#5b8ef8",
    badge: "Single Analysis",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Analyze One Policy",
    desc: "Upload a single PDF to extract key terms, exclusions, and get a full risk rating — all in under 60 seconds.",
    cta: "Start Analysis",
    href: "/app",
    ctaColor: "#5b8ef8",
  },
  {
    id: "feature-compare",
    gradient: "linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.05))",
    border: "rgba(167,139,250,0.25)",
    iconBg: "rgba(167,139,250,0.15)",
    iconColor: "#a78bfa",
    badgeBg: "rgba(167,139,250,0.12)",
    badgeColor: "#a78bfa",
    badge: "Side-by-Side",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Compare Policies",
    desc: "Upload two policies to see a side-by-side breakdown of coverage differences, risks, and which gives better value.",
    cta: "Start Comparison",
    href: "/compare",
    ctaColor: "#a78bfa",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Upload Your PDF", desc: "Drop in any insurance policy document — health, auto, home, or life." },
  { step: "02", title: "AI Reads & Analyzes", desc: "Our Gemini-powered engine scans every clause, exclusion, and legal term." },
  { step: "03", title: "Get Your Verdict", desc: "Receive a plain-English breakdown with a risk score and actionable insights." },
];

export default function Features() {
  return (
    <section id="features" className="relative lp-page px-6 pb-32 pt-20 sm:px-10 overflow-hidden">
      <div className="lp-divider mb-20" />
      <div className="mx-auto max-w-6xl">

        {/* Section header */}
        <InView className="mb-16 text-center">
          <p className="lp-section-label mb-3">Core Features</p>
          <h2 className="lp-h2 text-white text-4xl sm:text-5xl font-bold tracking-tight">
            Two powerful tools.{" "}
            <span className="lp-gradient-text">One clear verdict.</span>
          </h2>
          <p className="lp-hero-sub mx-auto mt-4 max-w-lg">
            Whether you have one policy or need to compare two — PolicyAI has you covered.
          </p>
        </InView>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <InView key={f.id} delay={i * 0.12}>
              <Link href={f.href} id={f.id} className="group block h-full">
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full rounded-2xl p-8 flex flex-col gap-6 cursor-pointer transition-all duration-300"
                  style={{
                    background: f.gradient,
                    border: `1px solid ${f.border}`,
                  }}
                >
                  {/* Badge */}
                  <span className="self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    style={{ background: f.badgeBg, color: f.badgeColor }}>
                    {f.badge}
                  </span>

                  {/* Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: f.iconBg, color: f.iconColor }}>
                    {f.icon}
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-xl font-bold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto flex items-center gap-2 text-sm font-bold transition-opacity group-hover:opacity-80"
                    style={{ color: f.ctaColor }}>
                    {f.cta}
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            </InView>
          ))}
        </div>

        {/* How it works */}
        <InView className="mt-28">
          <p className="lp-section-label mb-4 text-center">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-14 tracking-tight">
            Three steps to <span className="lp-gradient-text">total clarity</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.6%)] right-[calc(16.6%)] h-px"
              style={{ background: "linear-gradient(to right, rgba(91,142,248,0.4), rgba(167,139,250,0.4))" }} />
            {HOW_IT_WORKS.map((step, i) => (
              <InView key={step.step} delay={i * 0.1} className="flex flex-col items-center text-center">
                <div
                  className="relative h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black mb-5 z-10"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: i === 0 ? "#5b8ef8" : i === 1 ? "#a78bfa" : "#22d3ee",
                  }}>
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </InView>
            ))}
          </div>
        </InView>

      </div>
    </section>
  );
}
