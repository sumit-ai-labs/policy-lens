"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8,8,15,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: "linear-gradient(135deg,#5b8ef8,#a78bfa)" }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Policy<span style={{ color: "#5b8ef8" }}>AI</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        {[
          { label: "Features", href: "#features" },
          { label: "How It Works", href: "#preview" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right CTA */}
      <Link href="/app">
        <button className="lp-btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
          Analyze Policy
        </button>
      </Link>
    </motion.nav>
  );
}
