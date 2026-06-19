"use client";

import { useState, useCallback } from "react";
import {
  loadStreak,
  saveStreak,
  recordRelapse,
  incrementStreak,
  type StreakData,
} from "@/lib/streak";

const LAST_LOG_KEY = "qp_last_journal_date";

function validateStreakOnMount(): StreakData {
  const stored = loadStreak();
  if (stored.current === 0) return stored;
  const lastLog = localStorage.getItem(LAST_LOG_KEY);
  if (!lastLog) return stored;
  const today = new Date().toISOString().split("T")[0];
  if (lastLog === today) return stored;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (lastLog === yesterday) return stored;
  const fresh = { ...stored, current: 1, longest: stored.longest };
  saveStreak(fresh);
  return fresh;
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(validateStreakOnMount);

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
