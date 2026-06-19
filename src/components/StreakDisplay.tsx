"use client";

import { type StreakData } from "@/lib/streak";

interface Props {
  streak: StreakData;
}

export default function StreakDisplay({ streak }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 animate-fade-in-up">
      <div className="relative">
        <div className="w-28 h-28 rounded-full border-[3px] border-accent/30 flex items-center justify-center animate-pulse-glow">
          <div className="text-center">
            <span className="text-4xl font-heading font-bold text-accent tabular-nums">
              {streak.current}
            </span>
          </div>
        </div>
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-text-secondary font-medium tracking-wide uppercase whitespace-nowrap">
          {streak.current === 1 ? "Day Clean" : "Days Clean"}
        </span>
      </div>
      {streak.longest > 0 && (
        <p className="text-xs text-text-tertiary mt-2">
          Best: <span className="text-text-secondary font-medium">{streak.longest} days</span>
        </p>
      )}
    </div>
  );
}
