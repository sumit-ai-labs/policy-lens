"use client";

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

const SAMPLE_POLICY = `§ 7.3  The Company shall not be liable for any loss, damage,
liability or expense of any nature whatsoever caused by, or
attributable to, directly or indirectly, any act of terrorism
or terrorist activity, regardless of any other cause or event
contributing concurrently to the loss.

§ 4.7  It is understood and agreed that this Policy excludes
any and all loss or expenses of whatsoever nature directly or
indirectly resulting from, arising out of, or in connection
with nuclear energy or nuclear reaction.`;

export default function Preview() {
  return (
    <section id="preview" className="relative lp-page px-6 pb-32 sm:px-10 overflow-hidden">
      <div className="lp-divider mb-20" />
      <div className="mx-auto max-w-6xl">

        {/* Section header */}
        <InView className="mb-14 text-center">
          <p className="lp-section-label mb-3">Live Preview</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            See exactly what our AI finds
          </h2>
          <p className="lp-hero-sub mx-auto mt-4 max-w-lg">
            A real example of what PolicyAI surfaces from a standard insurance document.
          </p>
        </InView>

        <InView delay={0.1}>
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>

            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Left — Policy text */}
              <div className="p-8 border-b lg:border-b-0 lg:border-r"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/60" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <span className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                    Original Policy Text
                  </span>
                </div>
                <div className="rounded-xl p-6"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <pre className="text-sm leading-7 whitespace-pre-wrap font-mono text-slate-400">
                    {SAMPLE_POLICY}
                  </pre>
                </div>
              </div>

              {/* Right — AI Insights */}
              <div className="p-8 flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="lp-section-label">✦ AI Insights</span>
                </div>

                {/* High risk */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="rounded-xl p-5"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">High Risk Exclusion</p>
                      <p className="text-sm font-bold text-white">Total Terrorism Exclusion</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Zero coverage for any terrorism-related events, even if concurrent causes are covered.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Standard */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}
                  className="rounded-xl p-5"
                  style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">ℹ️</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1">Standard Clause</p>
                      <p className="text-sm font-bold text-white">Standard Nuclear Clause</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Typical exclusion for nuclear events. Common for this class of policy.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Risk score */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
                  className="rounded-xl p-5 mt-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Risk Score</span>
                    <span className="text-2xl font-black text-white">
                      75 <span className="text-sm font-medium text-slate-500">/ 100</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(to right,#f59e0b,#f87171)" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-medium text-slate-600">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}
