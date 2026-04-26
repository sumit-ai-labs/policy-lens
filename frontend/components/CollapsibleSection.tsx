"use client";

import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  accent?: "amber" | "rose" | "emerald" | "blue" | "zinc";
}

const accentMap = {
  amber: {
    badge: "bg-amber-500/20 text-amber-400",
    chevron: "text-amber-500",
    border: "border-amber-500/30",
    header: "hover:bg-amber-500/10",
  },
  rose: {
    badge: "bg-rose-500/20 text-rose-400",
    chevron: "text-rose-500",
    border: "border-rose-500/30",
    header: "hover:bg-rose-500/10",
  },
  emerald: {
    badge: "bg-emerald-500/20 text-emerald-400",
    chevron: "text-emerald-500",
    border: "border-emerald-500/30",
    header: "hover:bg-emerald-500/10",
  },
  blue: {
    badge: "bg-blue-500/20 text-blue-400",
    chevron: "text-blue-500",
    border: "border-blue-500/30",
    header: "hover:bg-blue-500/10",
  },
  zinc: {
    badge: "bg-white/10 text-zinc-300",
    chevron: "text-zinc-500",
    border: "border-white/10",
    header: "hover:bg-white/5",
  },
};

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  accent = "zinc",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colors = accentMap[accent];

  return (
    <div
      className={`overflow-hidden rounded-3xl border bg-white/5 backdrop-blur-md shadow-sm transition-all duration-200 ${colors.border}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 ${colors.header}`}
      >
        <span className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{title}</span>
          {badge !== undefined && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${colors.badge}`}
            >
              {badge}
            </span>
          )}
        </span>
        {/* Animated chevron */}
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${colors.chevron} ${isOpen ? "rotate-180" : "rotate-0"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Animated body */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 px-5 pb-5 pt-4 bg-black/20">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CollapsibleSection);
