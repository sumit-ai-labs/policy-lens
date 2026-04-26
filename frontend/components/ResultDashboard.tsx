"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { AnalysisResult } from "../types";

import HeroSection from "./HeroSection";
import ScoreDashboard from "./ScoreDashboard";
import TopRisks from "./TopRisks";
import SafeAndMeaning from "./SafeAndMeaning";
import CollapsibleSections from "./CollapsibleSections";
import FinalVerdict from "./FinalVerdict";

interface ResultDashboardProps {
  result: AnalysisResult;
  onReset?: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y:  0 },
};
const itemTransition = { duration: 0.3, ease: "easeOut" as const };

function ResultDashboard({ result, onReset }: ResultDashboardProps) {
  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} transition={itemTransition}><HeroSection result={result} /></motion.div>
      <motion.div variants={item} transition={itemTransition}><ScoreDashboard result={result} /></motion.div>
      <motion.div variants={item} transition={itemTransition}><TopRisks result={result} /></motion.div>
      <motion.div variants={item} transition={itemTransition}><SafeAndMeaning result={result} /></motion.div>
      <motion.div variants={item} transition={itemTransition}><CollapsibleSections result={result} /></motion.div>
      <motion.div variants={item} transition={itemTransition}><FinalVerdict result={result} onReset={onReset || (() => {})} /></motion.div>
    </motion.div>
  );
}

export default memo(ResultDashboard);
