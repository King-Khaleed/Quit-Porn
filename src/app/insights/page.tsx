"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import TechniqueCard from "@/components/TechniqueCard";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import {
  getUrgeTrend,
  getUrgeIntensitySeries,
  getTechniqueRanking,
  getRecoveryTimeTrend,
  loadUrgeLogs,
} from "@/lib/urgeTracking";
import {
  techniques,
  getTechniquesForMood,
  type Technique,
} from "@/data/techniques";
import { logTechniqueLocal } from "@/lib/db";

type Duration = 7 | 30 | 90;
type InsightTab = "stats" | "techniques";

const MOOD_FILTERS = ["all", "anxious", "stressed", "bored", "lonely", "angry", "sad", "urgent", "overwhelmed", "restless"];

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full h-24 bg-bg-elevated rounded-lg relative overflow-hidden flex items-end">
        <div
          className={`w-full rounded-t-lg transition-all duration-500 ${color}`}
          style={{ height: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

function UrgeChart({ days }: { days: Duration }) {
  const series = getUrgeIntensitySeries(days);
  const max = Math.max(...series.map((s) => s.avg), 1);
  const barColor = "bg-accent/70";

  return (
    <div className="card-glass p-4 animate-fade-in-up">
      <p className="text-sm text-text-secondary mb-3">Urge Trend — Last {days} Days</p>
      <div className="flex gap-0.5">
        {series.map((s) => (
          <Bar key={s.date} value={s.avg} max={max} color={barColor} />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-text-tertiary/60 mt-1">
        <span>{series[0]?.date?.slice(5) || ""}</span>
        <span>{series[series.length - 1]?.date?.slice(5) || ""}</span>
      </div>
    </div>
  );
}

function StatsView({ duration, setDuration, streak }: { duration: Duration; setDuration: (d: Duration) => void; streak: { current: number; longest: number; relapseDates: string[] } }) {
  const trend = getUrgeTrend();
  const techniqueRanking = getTechniqueRanking();
  const recoveryTrend = getRecoveryTimeTrend();
  const logs = loadUrgeLogs();
  const totalUrges = logs.length;
  const resolvedUrges = logs.filter((l) => l.techniqueWorked === true).length;
  const awarenessScore = totalUrges > 0 ? Math.round((resolvedUrges / totalUrges) * 100) : 0;

  const trendArrow = trend.trend === "down" ? "↓" : trend.trend === "up" ? "↑" : "→";
  const trendColor = trend.trend === "down" ? "text-accent" : trend.trend === "up" ? "text-danger" : "text-text-tertiary";

  return (
    <>
      {/* Duration toggle */}
      <div className="flex gap-2">
        {([7, 30, 90] as Duration[]).map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`tab-pill ${
              duration === d ? "tab-pill-active" : "tab-pill-inactive"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Urge Chart */}
      <div className="mt-4">
        <UrgeChart days={duration} />
      </div>

      {/* Trend summary cards */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          { label: "Avg", value: trend.average, color: "text-text-primary" },
          { label: "Trend", value: `${trendArrow} ${trend.trend === "down" ? "Down" : trend.trend === "up" ? "Up" : "Stable"}`, color: trendColor },
          { label: "Peak", value: trend.peak7d, color: "text-text-primary" },
          { label: "Logs", value: trend.logs7d, color: "text-text-primary" },
        ].map((stat, i) => (
          <div key={stat.label} className="card-glass p-3 text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className={`text-lg font-heading font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Urge Awareness Score */}
      {totalUrges > 0 && (
        <div className="mt-3 card-glass p-4 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-secondary">Urge Awareness Score</p>
            <span className={`text-lg font-heading font-bold ${
              awarenessScore >= 70 ? "text-accent" : awarenessScore >= 40 ? "text-warning" : "text-danger"
            }`}>
              {awarenessScore}%
            </span>
          </div>
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                awarenessScore >= 70 ? "bg-accent" : awarenessScore >= 40 ? "bg-warning" : "bg-danger"
              }`}
              style={{ width: `${awarenessScore}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {resolvedUrges} of {totalUrges} urges logged with a technique that worked
          </p>
        </div>
      )}

      {/* Technique Effectiveness */}
      {techniqueRanking.length > 0 && (
        <div className="mt-3 card-glass p-4 animate-fade-in-up stagger-3">
          <p className="text-sm text-text-secondary mb-3">Technique Effectiveness</p>
          <div className="space-y-2">
            {techniqueRanking.slice(0, 5).map((t) => {
              const maxDrop = Math.max(...techniqueRanking.map((r) => r.avgDrop), 1);
              const pct = (t.avgDrop / maxDrop) * 100;
              return (
                <div key={t.techniqueId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-primary font-medium capitalize">{t.techniqueId.replace(/-/g, " ")}</span>
                    <span className="text-text-tertiary">-{t.avgDrop} pts avg ({t.uses}x)</span>
                  </div>
                  <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time to Recover */}
      <div className="mt-3 card-glass p-4 animate-fade-in-up stagger-4">
        <p className="text-sm text-text-secondary mb-1">Time to Recover</p>
        <p className={`text-2xl font-heading font-bold tabular-nums ${
          recoveryTrend.trend === "improving" ? "text-accent" : recoveryTrend.trend === "worsening" ? "text-danger" : "text-text-primary"
        }`}>
          {recoveryTrend.avgMinutes > 0 ? `${recoveryTrend.avgMinutes} min` : "—"}
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          {recoveryTrend.trend === "improving"
            ? "Trend: Improving — you're recovering faster"
            : recoveryTrend.trend === "worsening"
            ? "Trend: Worsening — consider trying new techniques"
            : "Not enough data yet"}
        </p>
      </div>

      {/* Best Streak */}
      <div className="mt-3 card-glass p-4 animate-fade-in-up stagger-5">
        <p className="text-sm text-text-secondary mb-1">Best Streak</p>
        <p className="text-2xl font-heading font-bold text-text-primary tabular-nums">{streak.longest} days</p>
      </div>
    </>
  );
}

function TechniquesView() {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const filtered: Technique[] =
    filter === "all"
      ? showAll
        ? techniques
        : techniques.slice(0, 3)
      : getTechniquesForMood(filter);

  const handleLog = (techniqueId: string, worked: boolean) => {
    logTechniqueLocal({
      techniqueId,
      mood: filter === "all" ? "neutral" : filter,
      time: new Date().toISOString(),
      worked,
    });
  };

  return (
    <>
      <div className="overflow-x-auto scrollbar-none -mx-1">
        <div className="flex gap-2 pb-1 px-1">
          {MOOD_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => {
                setFilter(m);
                setShowAll(true);
              }}
              className={`tab-pill whitespace-nowrap ${
                filter === m ? "tab-pill-active" : "tab-pill-inactive"
              }`}
            >
              {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((tech, i) => (
          <div key={tech.id} style={{ animationDelay: `${i * 0.08}s` }}>
            <TechniqueCard
              technique={tech}
              onLog={handleLog}
              compact={false}
            />
          </div>
        ))}
      </div>

      {filter === "all" && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all duration-200"
        >
          Show All 10 Techniques
        </button>
      )}

      {filter === "all" && showAll && techniques.length > 3 && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all duration-200"
        >
          Show Recommended
        </button>
      )}
    </>
  );
}

export default function InsightsPage() {
  const { session } = useAuth();
  const { streak } = useStreak();
  const [duration, setDuration] = useState<Duration>(7);
  const [tab, setTab] = useState<InsightTab>("stats");

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to see insights.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-28">
        <div className="animate-fade-in">
          <h1 className="text-lg font-heading font-bold text-text-primary">Insights</h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            Track patterns and build recovery skills.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="mt-5 flex gap-1 p-1 rounded-xl bg-bg-surface/60 border border-border-primary/50">
          <button
            onClick={() => setTab("stats")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              tab === "stats"
                ? "bg-accent text-black shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setTab("techniques")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              tab === "techniques"
                ? "bg-accent text-black shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Techniques
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {tab === "stats" ? (
            <StatsView duration={duration} setDuration={setDuration} streak={streak} />
          ) : (
            <TechniquesView />
          )}
        </div>
      </div>

      <Nav />
    </>
  );
}
