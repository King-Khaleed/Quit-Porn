import { getLocalJournalEntries } from "./db";

export interface JournalEntry {
  id?: number;
  encrypted: string;
  mood: string;
  timestamp: string;
  synced: boolean;
}

export interface TechniqueLog {
  id?: number;
  techniqueId: string;
  mood: string;
  time: string;
  worked: boolean;
}

export type Emotion = "lonely" | "stressed" | "bored" | "anxious" | "angry" | "sad" | "tired" | "happy" | "calm" | "neutral";

export interface RiskPattern {
  day: number[];
  timeBlock: string;
  emotion: string;
  weight: number;
  count: number;
  total: number;
}

export interface PatternAlert {
  message: string;
  confidence: number;
  day: string;
  time: string;
  emotion: string;
}

const TIME_BLOCKS = [
  { label: "morning", start: 6, end: 11 },
  { label: "afternoon", start: 12, end: 16 },
  { label: "evening", start: 17, end: 20 },
  { label: "night", start: 21, end: 23 },
  { label: "late_night", start: 0, end: 5 },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getTimeBlock(hour: number): string {
  for (const block of TIME_BLOCKS) {
    if (hour >= block.start && hour <= block.end) return block.label;
  }
  return "unknown";
}

export function getContextHint(): { timeBlock: string; dayOfWeek: number; dayName: string } {
  const now = new Date();
  return {
    timeBlock: getTimeBlock(now.getHours()),
    dayOfWeek: now.getDay(),
    dayName: DAY_NAMES[now.getDay()],
  };
}

export async function analyzePatterns(): Promise<PatternAlert | null> {
  const entries = await getLocalJournalEntries();

  const streak = loadStreakSimple();
  const relapseDateSet = new Set(streak.relapseDates || []);

  const relapseEntries = entries.filter((e) => {
    const entryDate = new Date(e.timestamp).toISOString().split("T")[0];
    return relapseDateSet.has(entryDate) || e.mood === "urge" || e.mood === "relapse_yes";
  });

  const relapsePatterns: Record<string, { count: number; total: number }> = {};

  for (const entry of relapseEntries) {
    const ts = new Date(entry.timestamp);
    const day = ts.getDay();
    const timeBlock = getTimeBlock(ts.getHours());
    const key = `${day}_${timeBlock}_${entry.mood || "unknown"}`;
    if (!relapsePatterns[key]) relapsePatterns[key] = { count: 0, total: 0 };
    relapsePatterns[key].count += 1;
  }

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    const day = ts.getDay();
    const timeBlock = getTimeBlock(ts.getHours());
    const key = `${day}_${timeBlock}_${entry.mood || "unknown"}`;
    if (!relapsePatterns[key]) relapsePatterns[key] = { count: 0, total: 0 };
    relapsePatterns[key].total += 1;
  }

  const allPatterns = Object.entries(relapsePatterns)
    .map(([key, val]) => {
      const [dayStr, timeBlock, emotion] = key.split("_");
      return {
        day: [parseInt(dayStr)],
        timeBlock,
        emotion,
        weight: val.total > 0 ? val.count / val.total : 0,
        count: val.count,
        total: val.total,
      };
    })
    .filter((p) => p.total >= 2)
    .sort((a, b) => b.weight - a.weight);

  const topPattern = allPatterns[0];

  if (!topPattern || topPattern.weight < 0.3) return null;

  return {
    message: `You've relapsed ${topPattern.count} out of ${topPattern.total} logged times on ${DAY_NAMES[topPattern.day[0]]}s during the ${topPattern.timeBlock} when feeling ${topPattern.emotion}.`,
    confidence: Math.round(topPattern.weight * 100),
    day: DAY_NAMES[topPattern.day[0]],
    time: topPattern.timeBlock,
    emotion: topPattern.emotion,
  };
}

export function getRiskScore(mood?: string): number {
  const context = getContextHint();
  const streak = loadStreakSimple();
  let score = 0;

  const highRiskTimes = ["evening", "night", "late_night"];
  if (highRiskTimes.includes(context.timeBlock)) score += 0.2;

  const highRiskDays = [0, 6];
  if (highRiskDays.includes(context.dayOfWeek)) score += 0.15;

  const highRiskEmotions: Emotion[] = ["lonely", "stressed", "bored", "anxious", "angry", "sad"];
  if (mood && highRiskEmotions.includes(mood as Emotion)) {
    const emotionScores: Record<string, number> = {
      lonely: 0.25,
      stressed: 0.2,
      bored: 0.2,
      anxious: 0.15,
      angry: 0.15,
      sad: 0.2,
    };
    score += emotionScores[mood] || 0;
  }

  if (streak.current <= 3) score += 0.15;
  else if (streak.current <= 7) score += 0.1;
  else if (streak.current <= 14) score += 0.05;

  return Math.min(1, Math.round(score * 100) / 100);
}

function loadStreakSimple(): { current: number; relapseDates: string[] } {
  if (typeof window === "undefined") return { current: 0, relapseDates: [] };
  try {
    const stored = localStorage.getItem("qp_streak");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        current: parsed.current || 0,
        relapseDates: parsed.relapseDates || [],
      };
    }
  } catch {}
  return { current: 0, relapseDates: [] };
}
