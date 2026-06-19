export interface CoachMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CoachSession {
  id: string;
  messages: CoachMessage[];
  createdAt: string;
  updatedAt: string;
}

interface CoachUsage {
  date: string;
  count: number;
}

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
  "openrouter/owl-alpha",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen3.6-35b-a3b:free",
];

const MAX_FREE_DAILY = 5;
const SESSION_KEY = "qp_coach_session";
const USAGE_KEY = "qp_coach_usage";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function loadUsage(): CoachUsage {
  if (typeof window === "undefined") return { date: today(), count: 0 };
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today()) return parsed;
    }
  } catch {}
  return { date: today(), count: 0 };
}

export function saveUsage(usage: CoachUsage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

export function getRemainingMessages(): number {
  const usage = loadUsage();
  const max = MAX_FREE_DAILY;
  return Math.max(0, max - usage.count);
}

export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("qp_premium") === "true";
  } catch {
    return false;
  }
}

export function canSendMessage(): boolean {
  if (isPremium()) return true;
  return getRemainingMessages() > 0;
}

export function loadSession(): CoachSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function saveSession(session: CoachSession) {
  if (typeof window === "undefined") return;
  session.updatedAt = new Date().toISOString();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function createNewSession(): CoachSession {
  return {
    id: Date.now().toString(),
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

import { loadUrgeLogs, getUrgeTrend, getTechniqueRanking } from "@/lib/urgeTracking";

function loadStreak() {
  if (typeof window === "undefined")
    return { current: 0, longest: 0, lastRelapse: null, relapseDates: [] };
  try {
    const stored = localStorage.getItem("qp_streak");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { current: 0, longest: 0, lastRelapse: null, relapseDates: [] };
}

type ContextData = {
  streak: number;
  longest: number;
  lastRelapse: string | null;
  totalUrges: number;
  recentAvg: number;
  trend: string;
  bestTechnique: string;
  bestTechniqueDrop: number;
  peak7d: number;
  logs7d: number;
};

function getTechniqueById(id: string): { name: string } | undefined {
  const techniques = [
    { id: "box-breathing", name: "Box Breathing" },
    { id: "5-4-3-2-1", name: "5-4-3-2-1 Grounding" },
    { id: "cold-water", name: "Cold Water Splash" },
    { id: "urge-surfing", name: "Urge Surfing" },
    { id: "push-ups", name: "Push-ups to Failure" },
    { id: "journal-dump", name: "Journal Dump" },
    { id: "change-scenery", name: "Change Scenery" },
    { id: "text-friend", name: "Text a Friend" },
    { id: "10-minute-rule", name: "10-Minute Delay" },
    { id: "music-reset", name: "Music Reset" },
  ];
  return techniques.find((t) => t.id === id);
}

export function buildContextData(): ContextData {
  const streak = loadStreak();
  const trend = getUrgeTrend();
  const ranking = getTechniqueRanking();
  const logs = loadUrgeLogs();

  let bestTechnique = "none yet";
  let bestTechniqueDrop = 0;
  if (ranking.length > 0) {
    const tech = getTechniqueById(ranking[0].techniqueId);
    bestTechnique = tech?.name || ranking[0].techniqueId;
    bestTechniqueDrop = ranking[0].avgDrop;
  }

  return {
    streak: streak.current,
    longest: streak.longest,
    lastRelapse: streak.lastRelapse,
    totalUrges: logs.length,
    recentAvg: trend.average,
    trend: trend.trend,
    bestTechnique,
    bestTechniqueDrop,
    peak7d: trend.peak7d,
    logs7d: trend.logs7d,
  };
}

function buildSystemPrompt(ctx: ContextData): string {
  const relapsedRecently =
    ctx.lastRelapse &&
    new Date(ctx.lastRelapse).getTime() > Date.now() - 86400000 * 3;

  const trendDescription =
    ctx.trend === "down"
      ? "Urges are trending down — the user is improving."
      : ctx.trend === "up"
      ? "Urges are rising recently — extra support may help."
      : "Urge levels are stable.";

  const techniqueSection =
    ctx.bestTechnique !== "none yet"
      ? `The user's most effective technique is ${ctx.bestTechnique} (avg drop ${ctx.bestTechniqueDrop} pts).`
      : "The user has not used any techniques yet.";

  return `You are QuitPorn Coach — a neuroscience-informed recovery coach. Your only job is helping this person break free from compulsive porn use.

CORE RULES:
- Warm, direct, shame-free. Never say "you failed", "you should have", or "you're weak."
- Frame everything as data and learning. A relapse is feedback, not failure.
- Use evidence-based techniques: CBT, urge surfing, grounding, behavioral activation.
- Be concise: 3-4 sentence responses. Go deeper only if the user asks.
- End every response with one concrete, actionable next step.
- Never diagnose, prescribe medication, or claim to cure. You are a coach, not a doctor.
- If the user mentions self-harm or suicidal thoughts, tell them to contact a crisis helpline immediately.

USER CONTEXT:
- Streak: ${ctx.streak} days clean (best: ${ctx.longest})
- ${relapsedRecently ? "The user had a relapse recently. Be especially gentle and forward-looking." : "No recent relapse."}
- ${trendDescription}
- Total urges logged: ${ctx.totalUrges}
- ${techniqueSection}
- 7d peak urge: ${ctx.peak7d}, weekly logs: ${ctx.logs7d}

HOW TO RESPOND BY SITUATION:
- User is having an urge NOW: Walk them through a technique step-by-step. Start with grounding. Be present.
- User reports a relapse: Thank them for their honesty. Extract the lesson. Look forward. No dwelling on guilt.
- User asks for motivation: Reference their specific data. "You went from X to Y — that's real progress."
- User asks about a technique: Explain the neuroscience briefly (1 sentence), then guide them through it.
- User is vague or quiet: Offer a gentle prompt. "What's on your mind? No wrong answers here."`;
}

export function buildSystemPromptFromData(): string {
  const ctx = buildContextData();
  return buildSystemPrompt(ctx);
}

function createUserDataSummary(ctx: ContextData): string {
  const parts: string[] = [];
  parts.push(`Streak: ${ctx.streak} days`);
  if (ctx.logs7d > 0) {
    parts.push(`7d urge avg: ${ctx.recentAvg}, trend: ${ctx.trend}`);
  }
  if (ctx.bestTechnique !== "none yet") {
    parts.push(`Best technique: ${ctx.bestTechnique} (-${ctx.bestTechniqueDrop}pts)`);
  }
  return parts.join(" · ");
}

export function getUserDataSummary(): string {
  return createUserDataSummary(buildContextData());
}

export async function sendCoachMessage(
  messages: { role: string; content: string }[]
): Promise<{ content: string; model: string }> {
  const systemPrompt = buildSystemPromptFromData();

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system").slice(-10),
  ];

  const errors: string[] = [];

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "QuitPorn",
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (response.status === 429) {
        errors.push(`${model}: rate limited`);
        continue;
      }

      if (!response.ok) {
        errors.push(`${model}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content =
        data.choices?.[0]?.message?.content ||
        "I'm here to help. Could you tell me more about what's going on?";

      return { content, model };
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : "Unknown error"}`);
      continue;
    }
  }

  const errorMsg =
    errors.length > 0
      ? errors.join("; ")
      : "No models available";

  throw new Error(`AI coach unavailable. ${errorMsg}`);
}

export function recordUsage() {
  const usage = loadUsage();
  usage.count += 1;
  saveUsage(usage);
}
