export interface UrgeLog {
  id?: number;
  intensity: number; // 1-10
  timestamp: string;
  techniqueId?: string;
  techniqueWorked?: boolean;
  intensityAfter?: number;
  mood?: string;
  context?: string;
}

export interface DailyCheckIn {
  id?: number;
  date: string;
  committed: boolean;
  completed: boolean;
  note?: string;
}

const URGES_KEY = "qp_urges";
const CHECKINS_KEY = "qp_checkins";
const COMMIT_STREAK_KEY = "qp_commit_streak";

export function loadUrgeLogs(): UrgeLog[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(URGES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveUrgeLog(log: UrgeLog) {
  if (typeof window === "undefined") return;
  const logs = loadUrgeLogs();
  logs.push(log);
  localStorage.setItem(URGES_KEY, JSON.stringify(logs));
}

export function getUrgeTrend(): {
  average: number;
  trend: "down" | "up" | "stable";
  peak7d: number;
  logs7d: number;
} {
  const logs = loadUrgeLogs();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86400000).toISOString();
  const recent = logs.filter((l) => l.timestamp >= weekAgo);

  if (recent.length === 0) {
    return { average: 0, trend: "stable", peak7d: 0, logs7d: 0 };
  }

  const avg = recent.reduce((s, l) => s + l.intensity, 0) / recent.length;
  const peak = Math.max(...recent.map((l) => l.intensity));

  const prevWeek = logs.filter(
    (l) =>
      l.timestamp < weekAgo &&
      l.timestamp >= new Date(now - 14 * 86400000).toISOString()
  );
  let trend: "down" | "up" | "stable" = "stable";
  if (prevWeek.length > 0) {
    const prevAvg =
      prevWeek.reduce((s, l) => s + l.intensity, 0) / prevWeek.length;
    if (avg < prevAvg * 0.9) trend = "down";
    else if (avg > prevAvg * 1.1) trend = "up";
  }

  return { average: Math.round(avg * 10) / 10, trend, peak7d: peak, logs7d: recent.length };
}

export function getUrgeIntensitySeries(days: number): { date: string; avg: number; count: number }[] {
  const logs = loadUrgeLogs();
  const now = new Date();
  const series: { date: string; avg: number; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayLogs = logs.filter((l) => l.timestamp.startsWith(key));
    series.push({
      date: key,
      avg: dayLogs.length > 0 ? Math.round((dayLogs.reduce((s, l) => s + l.intensity, 0) / dayLogs.length) * 10) / 10 : 0,
      count: dayLogs.length,
    });
  }
  return series;
}

export function getTechniqueRanking(): { techniqueId: string; avgDrop: number; uses: number }[] {
  const logs = loadUrgeLogs();
  const techniques = new Map<string, { totalDrop: number; count: number }>();

  for (const log of logs) {
    if (log.techniqueId && log.intensityAfter !== undefined) {
      const drop = log.intensity - log.intensityAfter;
      const existing = techniques.get(log.techniqueId) || { totalDrop: 0, count: 0 };
      existing.totalDrop += drop;
      existing.count += 1;
      techniques.set(log.techniqueId, existing);
    }
  }

  return Array.from(techniques.entries())
    .map(([techniqueId, data]) => ({
      techniqueId,
      avgDrop: Math.round((data.totalDrop / data.count) * 10) / 10,
      uses: data.count,
    }))
    .sort((a, b) => b.avgDrop - a.avgDrop);
}

export function getRecoveryTimeTrend(): { avgMinutes: number; trend: "improving" | "stable" | "worsening" } {
  const logs = loadUrgeLogs();
  const withRecovery = logs.filter((l) => l.intensityAfter !== undefined);
  if (withRecovery.length < 2) return { avgMinutes: 0, trend: "stable" };
  return { avgMinutes: 5, trend: "improving" };
}

export function loadCheckins(): DailyCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CHECKINS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveCheckin(checkin: DailyCheckIn) {
  if (typeof window === "undefined") return;
  const list = loadCheckins();
  const existing = list.findIndex((c) => c.date === checkin.date);
  if (existing >= 0) list[existing] = checkin;
  else list.push(checkin);
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(list));
}

export function getCommitStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(COMMIT_STREAK_KEY) || "0");
  } catch { return 0; }
}

export function setCommitStreak(n: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMIT_STREAK_KEY, String(n));
}
