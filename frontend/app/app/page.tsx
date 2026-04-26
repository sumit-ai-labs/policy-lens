"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import FileUpload from "@/components/FileUpload";
import ResultDashboard from "@/components/ResultDashboard";
import { ResultSkeleton } from "@/components/SkeletonLoader";
import { analyzePolicy } from "@/services/api";
import { AnalysisResult } from "@/types";

const FADE = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };
const TRANSITION = { duration: 0.28, ease: "easeOut" } as const;

export default function SinglePolicyPage() {
  const [singleResult, setSingleResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slowWarning, setSlowWarning] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [manualText, setManualText] = useState("");
  const [lastSubmittedText, setLastSubmittedText] = useState("");

  // Cleanup on unmount
  useEffect(() => () => { if (slowTimer.current) clearTimeout(slowTimer.current); }, []);

  const clearResults = useCallback(() => setSingleResult(null), []);

  const handleAnalyze = useCallback(async (extractedText: string) => {
    if (loading) return; // prevent double-submit
    if (!extractedText.trim()) return;

    abortRef.current = false;
    setLoading(true);
    setError("");
    setSlowWarning(false);
    clearResults();
    setLastSubmittedText(extractedText);
    slowTimer.current = setTimeout(() => setSlowWarning(true), 30000);

    try {
      const data = await analyzePolicy(extractedText);
      if (!abortRef.current) setSingleResult(data);
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
  }, [loading, clearResults]);

  const handleRetry = useCallback(async () => {
    if (!lastSubmittedText.trim()) return;
    await handleAnalyze(lastSubmittedText);
  }, [lastSubmittedText, handleAnalyze]);

  const resetWorkspace = useCallback(() => {
    abortRef.current = true;
    setSingleResult(null);
    setManualText("");
    setError("");
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 px-4 py-14 sm:px-6 lg:px-8 text-zinc-200">
      {/* Background Glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px] opacity-60 mix-blend-screen" />
      <div className="pointer-events-none absolute top-1/4 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px] opacity-40 mix-blend-screen" />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[120px] opacity-40 mix-blend-screen" />

      <main className="mx-auto flex max-w-7xl flex-col items-center gap-10 relative z-10">
        {/* Page header */}
        <motion.section
          className="max-w-4xl text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
            Decision-ready insurance review
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Analyze a Single Policy
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
            Upload or paste policy wording to evaluate risks, exclusions, and scorecards.
          </p>
        </motion.section>

        <AnimatePresence mode="wait">
          {/* Input form — hidden while showing results */}
          {!singleResult && !loading && (
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
                    id={`tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-[1.3rem] px-4 py-3 text-sm font-bold transition ${
                      activeTab === tab ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "upload" ? "Upload file" : "Paste text"}
                  </button>
                ))}
              </div>

              {activeTab === "upload" && (
                <FileUpload onTextExtracted={handleAnalyze} isLoadingAnalysis={loading} />
              )}

              {activeTab === "paste" && (
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-md">
                  <h2 className="text-2xl font-black text-white">Paste policy text</h2>
                  <p className="mt-2 text-sm text-zinc-400">Use this when you already have the extracted wording.</p>
                  <textarea
                    id="paste-textarea"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Paste your insurance policy text here..."
                    rows={12}
                    className="mt-5 w-full rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-zinc-300 outline-none transition focus:border-blue-500/50 focus:bg-white/5 resize-none"
                  />
                  <motion.button
                    id="analyze-text-btn"
                    onClick={() => handleAnalyze(manualText)}
                    disabled={loading || !manualText.trim()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  >
                    {loading ? "Analyzing…" : "Analyze Text"}
                  </motion.button>
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
                      <p className="text-sm font-bold uppercase tracking-wide text-rose-400">Unable to analyze policy</p>
                      <p className="mt-1 text-sm leading-6 text-rose-200">{error}</p>
                      <p className="mt-1 text-xs text-rose-300/60">Please try again or check your network connection.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      id="retry-btn"
                      onClick={handleRetry}
                      disabled={loading || !lastSubmittedText.trim()}
                      className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retry
                    </button>
                    <button
                      id="dismiss-error-btn"
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
              {/* Slow-warning banner */}
              {slowWarning && (
                <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-400 mx-auto w-fit">
                  <span className="animate-pulse">⏳</span> AI is still working — large policies take longer…
                </div>
              )}
              {/* Analysis progress banner */}
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-6 py-4 mx-auto max-w-xl justify-center">
                <div className="h-4 w-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">Analyzing your policy…</p>
                  <p className="text-xs text-blue-300/70 mt-0.5">Extracting risks, conditions, exclusions & scoring</p>
                </div>
              </div>
              <ResultSkeleton />
            </motion.div>
          )}

          {/* Results */}
          {singleResult && !loading && (
            <motion.div
              key="result"
              {...FADE}
              transition={TRANSITION}
              className="flex w-full flex-col gap-10"
            >
              <ResultDashboard result={singleResult} onReset={resetWorkspace} />
              <div className="flex flex-wrap justify-center gap-4 pb-12">
                <motion.button
                  id="analyze-another-btn"
                  onClick={resetWorkspace}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full bg-blue-600 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                >
                  Analyze another document
                </motion.button>
                <motion.button
                  id="rerun-btn"
                  onClick={handleRetry}
                  disabled={loading || !lastSubmittedText.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Re-run analysis
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
