"use client";

import { useState, useCallback } from "react";
import { getRiskScore, analyzePatterns, type PatternAlert } from "@/lib/patterns";

export function usePatterns() {
  const [riskScore, setRiskScore] = useState(0);
  const [patternAlert, setPatternAlert] = useState<PatternAlert | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = useCallback(async (mood: string) => {
    setAnalyzing(true);
    try {
      const score = getRiskScore(mood);
      setRiskScore(score);

      const alert = await analyzePatterns(mood);
      setPatternAlert(alert);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const clear = useCallback(() => {
    setRiskScore(0);
    setPatternAlert(null);
  }, []);

  return { riskScore, patternAlert, analyzing, analyze, clear };
}
