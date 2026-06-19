"use client";

import { useState, useEffect } from "react";
import { loadUrgeLogs, type UrgeLog } from "@/lib/urgeTracking";

interface DayData {
  date: string;
  dayLabel: string;
  peak: number;
  count: number;
  hasData: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getColorForIntensity(intensity: number): string {
  if (intensity === 0) return "bg-bg-elevated";
  if (intensity <= 3) return "bg-accent/70";
  if (intensity <= 7) return "bg-warning/60";
  return "bg-danger/60";
}

function getLabelForIntensity(intensity: number): string {
  if (intensity === 0) return "—";
  return String(intensity);
}

export default function Timeline() {
  const [days, setDays] = useState<DayData[]>([]);

  useEffect(() => {
    const logs = loadUrgeLogs();
    const now = new Date();
    const result: DayData[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayLogs = logs.filter((l) => l.timestamp.startsWith(key));

      if (dayLogs.length > 0) {
        const peak = Math.max(...dayLogs.map((l) => l.intensity));
        result.push({
          date: key,
          dayLabel: i === 0 ? "Today" : i === 1 ? "Yest" : DAYS[d.getDay()],
          peak,
          count: dayLogs.length,
          hasData: true,
        });
      } else {
        result.push({
          date: key,
          dayLabel: i === 0 ? "Today" : i === 1 ? "Yest" : DAYS[d.getDay()],
          peak: 0,
          count: 0,
          hasData: false,
        });
      }
    }

    setDays(result);
  }, []);

  if (days.length === 0) return null;

  return (
    <div className="bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
        7-Day Timeline
      </p>
      <div className="flex items-end gap-1">
        {days.map((day) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[9px] text-text-tertiary/60 font-medium">{day.dayLabel}</span>
            <div className="w-full flex flex-col items-center gap-0.5">
              {day.hasData ? (
                <>
                  <div className="w-full flex justify-center gap-[2px]">
                    {Array.from({ length: Math.min(day.count, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full ${getColorForIntensity(day.peak)}`}
                        style={{
                          height: `${Math.max(day.peak * 3, 4)}px`,
                          opacity: 1 - i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold tabular-nums ${getColorForIntensity(day.peak).replace("bg-", "text-").replace("/70", "").replace("/60", "") || "text-text-tertiary"}`}>
                    {getLabelForIntensity(day.peak)}
                  </span>
                </>
              ) : (
                <div className="h-3 w-full flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-bg-elevated" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent/70" />
          <span className="text-[9px] text-text-tertiary">Low (1-3)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning/60" />
          <span className="text-[9px] text-text-tertiary">Med (4-7)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-danger/60" />
          <span className="text-[9px] text-text-tertiary">High (8-10)</span>
        </div>
      </div>
    </div>
  );
}
