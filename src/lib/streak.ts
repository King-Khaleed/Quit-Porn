export interface StreakData {
  current: number;
  longest: number;
  lastRelapse: string | null;
  relapseDates: string[];
}

const STREAK_KEY = "qp_streak";
const LAST_LOG_KEY = "qp_last_journal_date";

export function getDefaultStreak(): StreakData {
  return {
    current: 0,
    longest: 0,
    lastRelapse: null,
    relapseDates: [],
  };
}

export function loadStreak(): StreakData {
  if (typeof window === "undefined") return getDefaultStreak();
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultStreak();
}

export function saveStreak(streak: StreakData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

export function recordRelapse(): StreakData {
  const streak = loadStreak();
  const today = new Date().toISOString().split("T")[0];

  if (streak.lastRelapse !== today) {
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }
    streak.current = 0;
    streak.lastRelapse = today;
    streak.relapseDates.push(today);
    saveStreak(streak);
  }
  markLoggedToday();
  return streak;
}

export function incrementStreak(): StreakData {
  const streak = loadStreak();
  const today = new Date().toISOString().split("T")[0];

  if (streak.lastRelapse === today) return streak;

  const lastLog = localStorage.getItem(LAST_LOG_KEY);
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (lastLog === today) return streak;

  if (!lastLog || lastLog === yesterday) {
    streak.current += 1;
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }
  } else {
    streak.current = 1;
  }

  saveStreak(streak);
  markLoggedToday();
  return streak;
}

export function markLoggedToday() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_LOG_KEY, new Date().toISOString().split("T")[0]);
}

export function getStreakFromRelapses(): StreakData {
  return loadStreak();
}

export function resetStreak(): StreakData {
  const fresh = getDefaultStreak();
  saveStreak(fresh);
  return fresh;
}

export function calculateFreeDays(streak: StreakData): number {
  return streak.current;
}
