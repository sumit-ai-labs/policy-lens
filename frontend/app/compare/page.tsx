"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ComparisonDashboard from "@/components/ComparisonDashboard";
import FileUpload from "@/components/FileUpload";
import { ComparisonSkeleton } from "@/components/SkeletonLoader";
import { comparePolicies } from "@/services/api";
import { PolicyComparisonResult } from "@/types";

const FADE = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };
const TRANSITION = { duration: 0.28, ease: "easeOut" } as const;

export default function ComparePage() {
  const [comparisonResult, setComparisonResult] = useState<PolicyComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slowWarning, setSlowWarning] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [policyAText, setPolicyAText] = useState("");
  const [policyBText, setPolicyBText] = useState("");
  const [policyALabel, setPolicyALabel] = useState("Policy A");
  const [policyBLabel, setPolicyBLabel] = useState("Policy B");
  const [lastComparisonRequest, setLastComparisonRequest] = useState<{
    policyAText: string;
    policyBText: string;
    policyALabel: string;
    policyBLabel: string;
  } | null>(null);

  // Cleanup on unmount
  useEffect(() => () => { if (slowTimer.current) clearTimeout(slowTimer.current); }, []);

  const handleCompare = useCallback(async (
    nextPolicyAText = policyAText,
    nextPolicyBText = policyBText,
    nextPolicyALabel = policyALabel,
    nextPolicyBLabel = policyBLabel,
  ) => {
    if (loading) return; // prevent double-submit
    if (!nextPolicyAText.trim() || !nextPolicyBText.trim()) {
      setError("Please provide both policies before comparing.");
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setError("");
    setSlowWarning(false);
    setComparisonResult(null);
    setLastComparisonRequest({ policyAText: nextPolicyAText, policyBText: nextPolicyBText, policyALabel: nextPolicyALabel, policyBLabel: nextPolicyBLabel });
    slowTimer.current = setTimeout(() => setSlowWarning(true), 30000);

    try {
      const data = await comparePolicies(nextPolicyAText, nextPolicyBText, nextPolicyALabel, nextPolicyBLabel);
      if (!abortRef.current) setComparisonResult(data);
    } catch (err: unknown) {
      if (!abortRef.current) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      }
    } finally {
      setLoading(false);
      setSlowWarning(false);
      if (slowTimer.current) clearTimeout(slowTimer.current);
    }
  }, [loading, policyAText, policyBText, policyALabel, policyBLabel]);

  const handleRetry = useCallback(async () => {
    if (!lastComparisonRequest) return;
    await handleCompare(
      lastComparisonRequest.policyAText,
      lastComparisonRequest.policyBText,
      lastComparisonRequest.policyALabel,
      lastComparisonRequest.policyBLabel,
    );
  }, [lastComparisonRequest, handleCompare]);

  const resetWorkspace = useCallback(() => {
    abortRef.current = true;
    setComparisonResult(null);
    setError("");
    setLoading(false);
    setPolicyAText("");
    setPolicyBText("");
    setPolicyALabel("Policy A");
    setPolicyBLabel("Policy B");
  }, []);

  const canCompare = !loading && !!policyAText.trim() && !!policyBText.trim();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] px-4 py-14 sm:px-6 lg:px-8 text-zinc-200">
      {/* Background Glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[20%] -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[150px] opacity-70 mix-blend-screen" />
      <div className="pointer-events-none absolute bottom-[10%] right-[-10%] -z-10 h-[500px] w-[600px] rounded-full bg-purple-600/10 blur-[120px] opacity-50 mix-blend-screen" />

      <main className="mx-auto flex max-w-7xl flex-col items-center gap-12 relative z-10">
        {/* Page header */}
        <motion.section
          className="max-w-4xl text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
            Decision-Ready Insights
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 sm:text-5xl lg:text-6xl">
            Compare Policies
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400 font-medium">
            Upload or paste two policies to compare risks, exclusions, and conditions side-by-side.
          </p>
        </motion.section>

        <AnimatePresence mode="wait">
          {/* Input form */}
          {!comparisonResult && !loading && (
            <motion.div
              key="form"
              {...FADE}
              transition={TRANSITION}
              className="flex w-full max-w-5xl flex-col gap-6"
            >
              {/* Tab switcher */}
              <div className="grid grid-cols-2 rounded-3xl border border-white/10 bg-white/5 p-1 shadow-sm backdrop-blur-md">
                {(["upload", "paste"] as const).map((tab) => (
                  <button
                    key={tab}
                    id={`compare-tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-[1.3rem] px-4 py-3 text-sm font-bold transition ${
                      activeTab === tab ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "upload" ? "Upload file" : "Paste text"}
                  </button>
                ))}
              </div>

              {/* Upload tab */}
              {activeTab === "upload" && (
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-md">
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      id="policy-a-label"
                      value={policyALabel}
                      onChange={(e) => setPolicyALabel(e.target.value)}
                      placeholder="Policy A label"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:bg-white/5"
                    />
                    <input
                      id="policy-b-label"
                      value={policyBLabel}
                      onChange={(e) => setPolicyBLabel(e.target.value)}
                      placeholder="Policy B label"
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:bg-white/5"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <FileUpload
                      onTextExtracted={setPolicyAText}
                      isLoadingAnalysis={loading}
                      title={`Upload ${policyALabel || "Policy A"}`}
                      description="Extract text for the first policy"
                      buttonLabel="Extract Policy A"
                    />
                    <FileUpload
                      onTextExtracted={setPolicyBText}
                      isLoadingAnalysis={loading}
                      title={`Upload ${policyBLabel || "Policy B"}`}
                      description="Extract text for the second policy"
                      buttonLabel="Extract Policy B"
                    />
                  </div>
                  <div className="relative group mt-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <motion.button
                      id="compare-btn-upload"
                      onClick={() => handleCompare()}
                      disabled={!canCompare}
                      whileHover={canCompare ? { scale: 1.01 } : {}}
                      whileTap={canCompare ? { scale: 0.98 } : {}}
                      className="relative w-full rounded-[1.75rem] bg-indigo-600 px-6 py-5 text-sm font-black uppercase tracking-[0.15em] text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-zinc-500 disabled:border disabled:border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.2)]"
                    >
                      {loading ? "Analyzing Policies…" : "Compare Policies"}
                    </motion.button>
                  </div>
                </section>
              )}

              {/* Paste tab */}
              {activeTab === "paste" && (
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-md">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <input
                        id="paste-policy-a-label"
                        value={policyALabel}
                        onChange={(e) => setPolicyALabel(e.target.value)}
                        placeholder="Policy A label"
                        className="mb-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:bg-white/5"
                      />
                      <textarea
                        id="paste-policy-a-text"
                        value={policyAText}
                        onChange={(e) => setPolicyAText(e.target.value)}
                        placeholder="Paste the first policy text here..."
                        rows={12}
                        className="w-full rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:bg-white/5 resize-none"
                      />
                    </div>
                    <div>
                      <input
                        id="paste-policy-b-label"
                        value={policyBLabel}
                        onChange={(e) => setPolicyBLabel(e.target.value)}
                        placeholder="Policy B label"
                        className="mb-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:bg-white/5"
                      />
                      <textarea
                        id="paste-policy-b-text"
                        value={policyBText}
                        onChange={(e) => setPolicyBText(e.target.value)}
                        placeholder="Paste the second policy text here..."
                        rows={12}
                        className="w-full rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-zinc-300 outline-none transition focus:border-indigo-500/50 focus:bg-white/5 resize-none"
                      />
                    </div>
                  </div>
                  <div className="relative group mt-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <motion.button
                      id="compare-btn-paste"
                      onClick={() => handleCompare()}
                      disabled={!canCompare}
                      whileHover={canCompare ? { scale: 1.01 } : {}}
                      whileTap={canCompare ? { scale: 0.98 } : {}}
                      className="relative mt-2 w-full rounded-[1.75rem] bg-indigo-600 px-6 py-5 text-sm font-black uppercase tracking-[0.15em] text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-zinc-500 disabled:border disabled:border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.2)]"
                    >
                      {loading ? "Analyzing Policies…" : "Compare Policies"}
                    </motion.button>
                  </div>
                </section>
              )}

              {/* Error state */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-6 shadow-sm backdrop-blur-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-rose-400">Unable to compare policies</p>
                      <p className="mt-1 text-sm leading-6 text-rose-200">{error}</p>
                      <p className="mt-1 text-xs text-rose-300/60">Please try again or check your connection.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      id="retry-compare-btn"
                      onClick={handleRetry}
                      disabled={loading || !lastComparisonRequest}
                      className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retry
                    </button>
                    <button
                      id="dismiss-compare-error-btn"
                      onClick={() => setError("")}
                      className="rounded-full border border-rose-500/30 bg-transparent px-5 py-2.5 text-sm font-bold text-rose-300 transition hover:bg-rose-500/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Skeleton while loading */}
          {loading && (
            <motion.div key="skeleton" {...FADE} transition={TRANSITION} className="w-full">
              {slowWarning && (
                <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-400 mx-auto w-fit">
                  <span className="animate-pulse">⏳</span> AI is still working — large policies take longer…
                </div>
              )}
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-6 py-4 mx-auto max-w-xl justify-center">
                <div className="h-4 w-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">AI is analyzing both policies…</p>
                  <p className="text-xs text-indigo-300/70 mt-0.5">Extracting risks, running ITCH scoring engine</p>
                </div>
              </div>
              <ComparisonSkeleton />
            </motion.div>
          )}

          {/* Results */}
          {comparisonResult && !loading && (
            <motion.div
              key="result"
              {...FADE}
              transition={TRANSITION}
              className="flex w-full flex-col gap-10"
            >
              <ComparisonDashboard result={comparisonResult} />
              <div className="flex flex-wrap justify-center gap-4 pb-12">
                <motion.button
                  id="compare-another-btn"
                  onClick={resetWorkspace}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full bg-indigo-600 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                >
                  Compare different policies
                </motion.button>
                <motion.button
                  id="rerun-compare-btn"
                  onClick={handleRetry}
                  disabled={loading || !lastComparisonRequest}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Re-run comparison
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
