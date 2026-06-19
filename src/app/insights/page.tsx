"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import {
  getUrgeTrend,
  getUrgeIntensitySeries,
  getTechniqueRanking,
  getRecoveryTimeTrend,
  loadUrgeLogs,
} from "@/lib/urgeTracking";

type Duration = 7 | 30 | 90;

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
    <div className="bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up">
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

export default function InsightsPage() {
  const { session } = useAuth();
  const { streak } = useStreak();
  const [duration, setDuration] = useState<Duration>(7);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to see insights.</p>
      </div>
    );
  }

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
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-text-primary">Insights</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Urge trends, technique effectiveness, and recovery patterns.
          </p>
        </div>

        {/* Duration toggle */}
        <div className="mt-5 flex gap-2">
          {([7, 30, 90] as Duration[]).map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                duration === d ? "bg-accent text-black" : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover"
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

        {/* Trend summary */}
        <div className="mt-3 flex items-center justify-center gap-5 text-xs bg-bg-surface border border-border-primary rounded-xl px-4 py-3 animate-fade-in-up stagger-1">
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-text-primary tabular-nums">{trend.average}</p>
            <p className="text-text-tertiary">7d avg urge</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-heading font-bold tabular-nums ${trendColor}`}>
              {trendArrow} {trend.trend === "down" ? "Down" : trend.trend === "up" ? "Up" : "Stable"}
            </p>
            <p className="text-text-tertiary">Trend</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-text-primary tabular-nums">{trend.peak7d}</p>
            <p className="text-text-tertiary">Peak (7d)</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-heading font-bold text-text-primary tabular-nums">{trend.logs7d}</p>
            <p className="text-text-tertiary">Logs (7d)</p>
          </div>
        </div>

        {/* Urge Awareness Score */}
        {totalUrges > 0 && (
          <div className="mt-3 bg-bg-surface border border-border-primary rounded-xl px-4 py-4 animate-fade-in-up stagger-2">
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
          <div className="mt-3 bg-bg-surface border border-border-primary rounded-xl px-4 py-4 animate-fade-in-up stagger-3">
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
        <div className="mt-3 bg-bg-surface border border-border-primary rounded-xl px-4 py-4 animate-fade-in-up stagger-4">
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

        {/* Best Streak — secondary */}
        <div className="mt-3 bg-bg-surface border border-border-primary rounded-xl px-4 py-4 animate-fade-in-up stagger-5">
          <p className="text-sm text-text-secondary mb-1">Best Streak</p>
          <p className="text-2xl font-heading font-bold text-text-primary tabular-nums">{streak.longest} days</p>
        </div>

        {/* Empty state */}
        {totalUrges === 0 && (
          <div className="mt-6 bg-bg-surface border border-border-primary rounded-xl px-4 py-8 text-center animate-fade-in-up">
            <p className="text-sm text-text-tertiary">
              No data yet. Log your first urge on the home screen to start tracking trends.
            </p>
          </div>
        )}
      </div>

      <Nav />
    </>
  );
}
