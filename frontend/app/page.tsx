"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

const EASE = "easeOut";

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

const InViewFadeUp = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const steps = [
    { step: "01", title: "Upload or Paste", desc: "Share your insurance policy document or text instantly." },
    { step: "02", title: "AI Analysis", desc: "Our engine maps hidden risks, conditions, and exclusions." },
    { step: "03", title: "Clear Verdict", desc: "Get an actionable ITCH score and side-by-side comparisons." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-indigo-500/30">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px] opacity-60 mix-blend-screen" />
      <div className="absolute top-[20%] left-[20%] -z-10 h-[400px] w-[500px] rounded-full bg-indigo-600/20 blur-[100px] opacity-50 mix-blend-screen" />
      
      {/* Top Nav */}
      <nav className="absolute top-0 w-full px-6 py-6 sm:px-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <span className="text-white font-black text-xs">AI</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white">PolicyAI</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-32 text-center sm:pt-40 lg:pt-48 z-10">
        <FadeUp delay={0.05}>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-blue-200 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Powered by Next-Gen AI · Instant Decisions
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Understand Any{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
              Insurance Policy
            </span>{" "}
            in Seconds
          </h1>
        </FadeUp>

        <FadeUp delay={0.25}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Stop guessing what you&apos;re signing. Upload any policy to instantly uncover hidden risks, strict conditions, and get a clear ITCH score.
          </p>
        </FadeUp>

        <FadeUp delay={0.35} className="w-full">
          <div className="mt-14 grid w-full max-w-3xl mx-auto grid-cols-1 gap-6 sm:grid-cols-2">
            <Link href="/app" className="group h-full">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:border-blue-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-inner group-hover:border-blue-500/30 transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center z-10">
                  <h3 className="text-lg font-black text-white">Analyze One Policy</h3>
                  <p className="mt-2 text-sm text-zinc-400">Upload a single document for deep review and risk scoring.</p>
                </div>
              </motion.div>
            </Link>
            
            <Link href="/compare" className="group h-full">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:border-indigo-500/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-inner group-hover:border-indigo-500/30 transition-colors">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="text-center z-10">
                  <h3 className="text-lg font-black text-white">Compare Policies</h3>
                  <p className="mt-2 text-sm text-zinc-400">Side-by-side analysis to see which policy is truly safer.</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* How it works */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 sm:px-10 z-10">
        <InViewFadeUp className="mb-14 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-500">How It Works</p>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Three steps to total clarity</h2>
        </InViewFadeUp>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
          <div className="absolute top-1/2 left-[10%] right-[10%] hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
              className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-400">{s.step}</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-100">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative mx-auto max-w-5xl px-6 pb-24 sm:px-10 z-10">
        <InViewFadeUp>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-zinc-900 p-10 text-center border border-white/10 shadow-2xl sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-[80px]" />

            <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight">Stop guessing.<br />Start knowing.</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-blue-200/80">
              Upload your policy right now and get a complete risk breakdown in under 60 seconds.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row relative z-10">
              <Link href="/app">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full rounded-full bg-blue-600 px-8 py-4 text-sm font-bold tracking-wide text-white shadow-lg hover:bg-blue-500 sm:w-auto"
                >
                  Analyze One Policy
                </motion.button>
              </Link>
              <Link href="/compare">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold tracking-wide text-white backdrop-blur-md transition sm:w-auto"
                >
                  Compare Two Policies
                </motion.button>
              </Link>
            </div>
          </div>
        </InViewFadeUp>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-500 z-10 relative">
        <p>© 2026 PolicyAI · AI-powered insurance intelligence</p>
      </footer>
    </div>
  );
}
