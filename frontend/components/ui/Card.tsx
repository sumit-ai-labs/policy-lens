"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Standard glass card — Luminous design */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={["glass shadow-soft rounded-2xl p-6", className].join(" ")}
    >
      {children}
    </div>
  );
}

/** Risk/warning card — error red tint */
export function RiskCard({ children, className = "" }: CardProps) {
  return (
    <div
      className={["rounded-xl p-4", className].join(" ")}
      style={{
        background: "#ffdad6",
        border: "1px solid var(--lp-error)",
      }}
    >
      {children}
    </div>
  );
}

/** Info card — secondary purple tint */
export function InfoCard({ children, className = "" }: CardProps) {
  return (
    <div
      className={["rounded-xl p-4", className].join(" ")}
      style={{
        background: "#e9ddff",
        border: "1px solid var(--lp-secondary)",
      }}
    >
      {children}
    </div>
  );
}

/** Tertiary/orange accent card */
export function WarnCard({ children, className = "" }: CardProps) {
  return (
    <div
      className={["rounded-xl p-4", className].join(" ")}
      style={{
        background: "#ffecd4",
        border: "1px solid var(--lp-tertiary)",
      }}
    >
      {children}
    </div>
  );
}
