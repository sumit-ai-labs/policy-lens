"use client";

import React from "react";

/** Single shimmer block */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Full result dashboard skeleton — mirrors the real ResultDashboard layout */
export function ResultSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 page-enter w-full">
      {/* Hero skeleton */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 space-y-5">
          <div className="flex gap-3">
            <SkeletonBlock className="h-7 w-24 rounded-full" />
            <SkeletonBlock className="h-7 w-32 rounded-full" />
          </div>
          <SkeletonBlock className="h-16 w-32" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <div className="flex gap-2 flex-wrap pt-2">
            {[1, 2, 3].map((k) => (
              <SkeletonBlock key={k} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3 flex-1">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-4/5" />
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            {[1, 2, 3].map((k) => (
              <SkeletonBlock key={k} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Score dashboard skeleton */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SkeletonBlock className="h-40 rounded-2xl" />
          <div className="space-y-4 rounded-2xl border border-white/5 bg-black/20 p-6">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="space-y-1.5">
                <div className="flex justify-between">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-3 w-8" />
                </div>
                <SkeletonBlock className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="h-40 rounded-2xl" />
        </div>
      </div>

      {/* Top risks skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[1, 2, 3].map((k) => (
          <div key={k} className="rounded-3xl border border-white/5 bg-black/20 p-5 space-y-3">
            <SkeletonBlock className="h-6 w-24 rounded-full" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Comparison page skeleton */
export function ComparisonSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 page-enter w-full">
      {/* Hero verdict skeleton */}
      <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 sm:p-12 space-y-6">
        <SkeletonBlock className="h-5 w-28 rounded-full" />
        <SkeletonBlock className="h-12 w-3/4" />
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-5 w-5/6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((k) => (
            <SkeletonBlock key={k} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
      {/* Scores skeleton */}
      <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 space-y-3">
        <SkeletonBlock className="h-6 w-40 mx-auto" />
        {[1, 2, 3, 4, 5].map((k) => (
          <SkeletonBlock key={k} className="h-12 w-full rounded-2xl" />
        ))}
      </div>
      {/* Deep dive skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((k) => (
          <div key={k} className="rounded-[2.5rem] border border-white/10 bg-black/20 p-8 space-y-4">
            <SkeletonBlock className="h-8 w-32" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            {[1, 2, 3].map((j) => (
              <SkeletonBlock key={j} className="h-14 rounded-2xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
