"use client";

import { motion } from "framer-motion";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/** Primary CTA — Luminous #0058be solid */
export function PrimaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, boxShadow: "0 8px 24px -4px rgba(0,88,190,0.35)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={[
        "inline-flex items-center justify-center gap-2",
        "px-6 py-3 rounded-xl text-white font-semibold",
        "shadow-soft transition-all duration-200",
        className,
      ].join(" ")}
      style={{ backgroundColor: "var(--lp-primary)" }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}

/** Secondary CTA — tinted outline style */
export function SecondaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, backgroundColor: "rgba(0,88,190,0.10)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={[
        "inline-flex items-center justify-center gap-2",
        "px-6 py-3 rounded-xl font-semibold",
        "border transition-all duration-200",
        className,
      ].join(" ")}
      style={{
        backgroundColor: "rgba(0,88,190,0.06)",
        color: "var(--lp-primary)",
        borderColor: "rgba(0,88,190,0.25)",
      }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
