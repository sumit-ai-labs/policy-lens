import React from "react";

import { RiskyClause } from "../types";

interface ClauseListProps {
  title: string;
  items: string[] | RiskyClause[];
  type: "neutral" | "warning" | "danger";
  compact?: boolean;
  noBox?: boolean;
  hideTitle?: boolean;
}

const HIGHLIGHT_KEYWORDS = [
  "claim",
  "premium",
  "surrender",
  "deadline",
  "charges",
  "penalty",
  "lock-in",
  "document",
];

function renderHighlightedText(text: string) {
  const pattern = new RegExp(`(${HIGHLIGHT_KEYWORDS.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isKeyword = HIGHLIGHT_KEYWORDS.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
    if (!isKeyword) {
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    }

    return (
      <mark key={`${part}-${index}`} className="rounded bg-blue-500/20 px-1 py-0.5 text-blue-300 font-medium">
        {part}
      </mark>
    );
  });
}

function ClauseList({ title, items, type, compact = false, noBox = false, hideTitle = false }: ClauseListProps) {
  if (!items || items.length === 0) return null;

  const icon = {
    neutral: "✅",
    warning: "⏱",
    danger: "⚠️",
  }[type];

  const pillColors = {
    HIGH: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    LOW: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };

  const Component = noBox ? "div" : "section";

  return (
    <Component className={noBox ? "" : "rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-md"}>
      {!hideTitle && (
        <h3 className="mb-4 flex items-center gap-2 text-base font-black text-white">
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
      )}
      <ul className={compact ? "space-y-3" : "space-y-4"}>
        {items.map((item, idx) => {
          const isRisk = typeof item === "object" && item !== null;

          if (!isRisk) {
            const text = item as string;
            return (
              <li
                key={idx}
                className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              >
                <span className="mr-2 font-black text-zinc-600">-</span>
                <span className={compact ? "line-clamp-2 align-middle" : "align-middle"}>{renderHighlightedText(text)}</span>
              </li>
            );
          }

          const risk = item as RiskyClause;
          return (
            <li
              key={idx}
              className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold leading-6 text-white">{renderHighlightedText(risk.title || risk.clause)}</p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                    pillColors[(risk.impact ?? "LOW") as keyof typeof pillColors] ?? pillColors["LOW"]
                  }`}
                >
                  {risk.impact}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                <span className={compact ? "line-clamp-1" : "line-clamp-2"}>{renderHighlightedText(risk.reason || risk.clause)}</span>
              </p>
              {!compact && risk.source && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-zinc-600">{risk.source}</p>
              )}
            </li>
          );
        })}
      </ul>
    </Component>
  );
}

export default React.memo(ClauseList);
