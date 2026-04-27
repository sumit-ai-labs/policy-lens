"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative lp-page z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#5b8ef8,#a78bfa)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Policy<span style={{ color: "#5b8ef8" }}>AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Instant AI-powered insurance analysis. Understand any policy in seconds — no legal background needed.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-5">Product</p>
            <nav className="flex flex-col gap-3">
              {[
                { label: "Analyze Policy", href: "/app" },
                { label: "Compare Policies", href: "/compare" },
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#preview" },
              ].map((item) => (
                <Link key={item.label} href={item.href}
                  className="text-sm text-slate-400 hover:text-white transition-colors w-fit">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* CTA column */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Get Started</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Upload your policy and get a full AI analysis in under 60 seconds. Free, no signup required.
            </p>
            <Link href="/app">
              <button className="lp-btn-primary w-fit" style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem" }}>
                Try For Free →
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-slate-600">© 2026 PolicyAI · Soft Precision for Insurance.</p>
          <p className="text-xs text-slate-700">Built with Gemini AI · Next.js · FastAPI</p>
        </div>
      </div>
    </footer>
  );
}
