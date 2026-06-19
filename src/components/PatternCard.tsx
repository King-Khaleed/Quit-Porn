"use client";

import { useState, useCallback } from "react";
import {
  loadUrgeLogs,
  getUrgeTrend,
  getTechniqueRanking,
  getRecoveryTimeTrend,
  type UrgeLog,
} from "@/lib/urgeTracking";
import { getTechniqueById } from "@/data/techniques";

type Insight = {
  icon: string;
  title: string;
  body: string;
  type: string;
};

function generateInsights(logs: UrgeLog[]): Insight[] {
  const insights: Insight[] = [];

  if (logs.length === 0) return insights;

  const trend = getUrgeTrend();
  const techniqueRanking = getTechniqueRanking();
  const recovery = getRecoveryTimeTrend();

  if (trend.logs7d > 0 && trend.trend !== "stable") {
    insights.push({
      icon: trend.trend === "down" ? "↓" : "↑",
      title: trend.trend === "down" ? "Urges Trending Down" : "Urges Trending Up",
      body:
        trend.trend === "down"
          ? `Your average urge intensity dropped to ${trend.average} this week. What you're doing is working.`
           : `Your average urge intensity rose to ${trend.average} this week. Use a Micro-Moment before high-risk windows.`,
      type: "trend",
    });
  }

  if (techniqueRanking.length > 0) {
    const best = techniqueRanking[0];
    const technique = getTechniqueById(best.techniqueId);
    insights.push({
      icon: "★",
      title: "Most Effective Technique",
      body: `${technique?.name || best.techniqueId} gives you an average drop of ${best.avgDrop} points (${best.uses} uses).`,
      type: "technique",
    });
  }

  if (recovery.avgMinutes > 0 && recovery.trend !== "stable") {
    insights.push({
      icon: recovery.trend === "improving" ? "→" : "←",
      title: recovery.trend === "improving" ? "Recovering Faster" : "Recovery Slowing",
      body:
        recovery.trend === "improving"
          ? "You're recovering from urges faster than before. Your nervous system is learning."
          : "Recovery time has increased. Try switching techniques or using them earlier.",
      type: "recovery",
    });
  }

  const timeBuckets: Record<string, number[]> = {};
  for (const log of logs) {
    const hour = new Date(log.timestamp).getHours();
    const bucket = hour < 6 ? "Late night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";
    if (!timeBuckets[bucket]) timeBuckets[bucket] = [];
    timeBuckets[bucket].push(log.intensity);
  }

  let highestBucket = "";
  let highestAvg = 0;
  for (const [bucket, vals] of Object.entries(timeBuckets)) {
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (avg > highestAvg) {
      highestAvg = avg;
      highestBucket = bucket;
    }
  }

  if (highestBucket) {
    const today = new Date().getDay();
    const weekendRisk = today >= 5 && (highestBucket === "Evening" || highestBucket === "Night");
    insights.push({
      icon: "⏰",
      title: "Highest-Risk Window",
      body: weekendRisk
        ? `${highestBucket} tends to be your highest-risk period — and it's the weekend. Pre-commit before then.`
        : `${highestBucket} tends to be your highest-risk period (avg ${highestAvg.toFixed(1)}). A Micro-Moment before then can help.`,
      type: "time",
    });
  }

  const moodCounts: Record<string, number> = {};
  for (const log of logs) {
    if (log.mood) {
      moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    }
  }
  let topMood = "";
  let topMoodCount = 0;
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > topMoodCount) { topMoodCount = count; topMood = mood; }
  }
  if (topMood && topMoodCount >= 2) {
    insights.push({
      icon: "◉",
      title: "Common Trigger Mood",
      body: `Your urges most often follow "${topMood}" feelings (${topMoodCount}x). Journaling when you feel ${topMood} can help catch urges earlier.`,
      type: "mood",
    });
  }

  return insights;
}

export default function PatternCard() {
  const [insights] = useState(() => {
    const logs = loadUrgeLogs();
    return generateInsights(logs);
  });
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const handleNext = useCallback(() => {
    setCurrent((c) => (c + 1) % insights.length);
  }, [insights.length]);

  const handlePrev = useCallback(() => {
    setCurrent((c) => (c - 1 + insights.length) % insights.length);
  }, [insights.length]);

  if (dismissed || insights.length === 0) return null;

  const insight = insights[current];

  return (
    <div className="bg-accent-subtle/10 border border-accent/10 rounded-xl p-4 animate-fade-in-up relative">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{insight.icon}</span>
          <p className="text-sm font-medium text-accent">{insight.title}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-text-primary leading-relaxed">{insight.body}</p>
      {insights.length > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handlePrev}
            className="text-text-tertiary hover:text-text-secondary transition-colors p-1"
            aria-label="Previous insight"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex gap-1.5">
            {insights.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? "bg-accent w-3" : "bg-bg-elevated"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="text-text-tertiary hover:text-text-secondary transition-colors p-1"
            aria-label="Next insight"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
