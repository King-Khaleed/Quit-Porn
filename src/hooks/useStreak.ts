"use client";

import { useState, useCallback, useEffect } from "react";
import {
  loadStreak,
  saveStreak,
  recordRelapse,
  incrementStreak,
  type StreakData,
} from "@/lib/streak";

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(loadStreak);

  useEffect(() => {
    const stored = loadStreak();
    setStreak(stored);
  }, []);

  const handleRelapse = useCallback(() => {
    const updated = recordRelapse();
    setStreak({ ...updated });
    return updated;
  }, []);

  const handleIncrement = useCallback(() => {
    const updated = incrementStreak();
    setStreak({ ...updated });
    return updated;
  }, []);

  const reset = useCallback(() => {
    const fresh = { current: 0, longest: 0, lastRelapse: null, relapseDates: [] };
    saveStreak(fresh);
    setStreak(fresh);
  }, []);

  return { streak, handleRelapse, handleIncrement, reset };
}
