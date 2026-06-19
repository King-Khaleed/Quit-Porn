"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveUrgeLog } from "@/lib/urgeTracking";

type Phase = "landing" | "breathing" | "complete";

interface Props {
  domain?: string;
  onReturn?: () => void;
}

const TRIGGERS = [
  { id: "boredom", label: "Boredom", icon: "⊘" },
  { id: "stress", label: "Stress", icon: "⚡" },
  { id: "habit", label: "Just habit", icon: "↻" },
  { id: "lonely", label: "Loneliness", icon: "○" },
  { id: "angry", label: "Anger", icon: "△" },
  { id: "tired", label: "Tired", icon: "◠" },
  { id: "curious", label: "Curious", icon: "?" },
];

const BREATH_PATTERNS = [
  { phase: "inhale", duration: 4000, label: "Breathe in" },
  { phase: "hold", duration: 4000, label: "Hold" },
  { phase: "exhale", duration: 4000, label: "Breathe out" },
  { phase: "wait", duration: 2000, label: "Rest" },
];

function getPhaseForTrigger(triggerId: string) {
  const suggestions: Record<string, string> = {
    boredom: "Surf the Urge — notice the feeling without acting. It will pass like a wave.",
    stress: "4-7-8 Breathing — inhale 4s, hold 7s, exhale 8s. Activates the parasympathetic system.",
    habit: "Pattern Interrupt — physically change your environment. Stand up, walk to another room.",
    lonely: "Reach Out — text a friend or write in your encrypted journal. Connection reduces craving.",
    angry: "Progressive Muscle Relaxation — tense and release each muscle group from toes to head.",
    tired: "Power Nap or Walk — low energy lowers inhibition. 10 minutes of movement resets your brain.",
    curious: "Thought Labeling — say 'I notice I'm having the thought that...' Creates distance from the urge.",
  };
  return suggestions[triggerId] || suggestions.boredom;
}

function useStreakData() {
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const d = JSON.parse(localStorage.getItem("qp_streak") || "{}");
      setStreak({ current: d.current || 0, longest: d.longest || 0 });
    } catch {}
  }, []);
  return streak;
}

function BreathingCircle({ onDone }: { onDone: () => void }) {
  const [scale, setScale] = useState(0.5);
  const [timeLeft, setTimeLeft] = useState(BREATH_PATTERNS[0].duration / 1000);
  const stepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let step = 0;
    let round = 0;
    const totalRounds = 3;

    const runStep = () => {
      const pattern = BREATH_PATTERNS[step % BREATH_PATTERNS.length];
      stepRef.current = step;

      setScale(pattern.phase === "inhale" ? 1 : pattern.phase === "exhale" ? 0.5 : pattern.phase === "hold" ? 1 : 0.5);
      setTimeLeft(pattern.duration / 1000);

      let elapsed = 0;
      const tick = 50;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        elapsed += tick;
        const remaining = Math.max(0, Math.ceil((pattern.duration - elapsed) / 1000));
        setTimeLeft(remaining);
        if (elapsed >= pattern.duration) {
          if (timerRef.current) clearInterval(timerRef.current);
          step++;
          if (step >= BREATH_PATTERNS.length * totalRounds) {
            onDone();
            return;
          }
          runStep();
        }
      }, tick);
    };

    runStep();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onDone]);

  const pattern = BREATH_PATTERNS[stepRef.current % BREATH_PATTERNS.length];
  const round = Math.floor(stepRef.current / BREATH_PATTERNS.length) + 1;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <div className="relative flex items-center justify-center">
        <div
          className="w-32 h-32 rounded-full bg-accent/10 border-2 border-accent/30 transition-all duration-[50ms] flex items-center justify-center"
          style={{ transform: `scale(${scale})` }}
        >
          <span className="text-2xl font-bold text-accent tabular-nums">{timeLeft}</span>
        </div>
      </div>
      <p className="text-lg font-heading font-semibold text-text-primary">{pattern?.label}</p>
      <p className="text-xs text-text-tertiary">Round {round} of 3</p>
    </div>
  );
}

export function isHighRiskWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 21 || hour <= 2;
}

export function hasRecentUrge(minutes: number = 120): boolean {
  if (typeof window === "undefined") return false;
  try {
    const urges = JSON.parse(localStorage.getItem("qp_urges") || "[]") as any[];
    if (urges.length === 0) return false;
    const latest = new Date(urges[urges.length - 1].timestamp).getTime();
    return Date.now() - latest < minutes * 60 * 1000;
  } catch {
    return false;
  }
}

export function isLowStreak(days: number = 3): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = JSON.parse(localStorage.getItem("qp_streak") || "{}");
    return (data.current || 0) <= days;
  } catch {
    return false;
  }
}

export function getFocusModeSuggestions(): string[] {
  const suggestions: string[] = [];
  if (isHighRiskWindow()) suggestions.push("It's late — high-risk window. Stay grounded.");
  if (hasRecentUrge()) suggestions.push("You logged an urge recently. Watch for chaining.");
  if (isLowStreak()) suggestions.push("Early in your streak — the first days are the hardest.");
  return suggestions;
}

export default function PreCommitScreen({ domain, onReturn }: Props) {
  const router = useRouter();
  const streak = useStreakData();
  const [phase, setPhase] = useState<Phase>("landing");
  const [trigger, setTrigger] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  const displayDomain = domain || "a blocked site";

  const handleTriggerSelect = useCallback((id: string) => {
    setTrigger(id);
    setPhase("breathing");
  }, []);

  useEffect(() => {
    if (phase === "complete" && !logged) {
      setLogged(true);
      saveUrgeLog({
        intensity: 7,
        timestamp: new Date().toISOString(),
        context: `pre-commit: attempted ${displayDomain}, trigger: ${trigger || "unknown"}`,
        mood: trigger || "unknown",
      });
      try {
        const raw = localStorage.getItem("qp_streak");
        if (raw) {
          const data = JSON.parse(raw);
          data.current = (data.current || 0) + 1;
          if (data.current > (data.longest || 0)) data.longest = data.current;
          localStorage.setItem("qp_streak", JSON.stringify(data));
        }
      } catch {}
    }
  }, [phase, logged, displayDomain, trigger]);

  const handleReturn = useCallback(() => {
    if (onReturn) {
      onReturn();
    } else {
      router.push("/");
    }
  }, [onReturn, router]);

  const suggestion = trigger ? getPhaseForTrigger(trigger) : "";

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col animate-fade-in">
      {/* Stage indicator */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-2">
        {(["landing", "breathing", "complete"] as Phase[]).map((p, i) => (
          <div
            key={p}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              p === phase
                ? "bg-accent w-6"
                : ["landing", "breathing", "complete"].indexOf(phase) > i
                ? "bg-accent/40"
                : "bg-bg-elevated"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 pt-4">
        {/* Phase: Landing */}
        {phase === "landing" && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-12">
              <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h1 className="text-xl font-heading font-bold text-text-primary">You tried to visit</h1>
              <p className="text-sm font-mono text-danger mt-1.5 bg-danger/10 px-4 py-1.5 rounded-lg">{displayDomain}</p>
              <p className="text-sm text-text-secondary mt-4 max-w-xs leading-relaxed">
                That's okay. Let's figure out what's happening and find a better path.
              </p>
              <div className="mt-6 w-full max-w-xs bg-bg-surface border border-border-primary rounded-xl p-4">
                <p className="text-xs text-text-tertiary text-center">Your streak</p>
                <p className="text-2xl font-heading font-bold text-accent text-center mt-1">{streak.current} days</p>
              </div>
            </div>

            <div className="pb-8">
              <p className="text-xs text-text-secondary font-medium mb-3 text-center">What led you here?</p>
              <div className="grid grid-cols-4 gap-2">
                {TRIGGERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTriggerSelect(t.id)}
                    className="flex flex-col items-center gap-1.5 bg-bg-surface border border-border-primary rounded-xl py-3 px-2 hover:bg-bg-surface-hover hover:border-accent/30 active:scale-95 transition-all"
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-[10px] text-text-secondary text-center leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase: Breathing */}
        {phase === "breathing" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <BreathingCircle onDone={() => setPhase("complete")} />
            <p className="text-xs text-text-tertiary text-center max-w-xs mt-4 leading-relaxed">
              {suggestion}
            </p>
          </div>
        )}

        {/* Phase: Complete */}
        {phase === "complete" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-heading font-bold text-text-primary">You paused.</h1>
            <p className="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed">
              You felt the urge, you reflected, and you chose a different path. That's a win.
            </p>
            <div className="mt-6 w-full max-w-xs bg-bg-surface border border-border-primary rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Trigger</span>
                <span className="text-text-secondary font-medium capitalize">{trigger}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Logged as</span>
                <span className="text-text-secondary font-medium">Urge (7/10)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Outcome</span>
                <span className="text-accent font-medium">Resisted ✓</span>
              </div>
            </div>
            <div className="mt-4 bg-bg-elevated/50 border border-border-primary rounded-xl px-4 py-3 text-xs text-text-tertiary leading-relaxed max-w-xs">
              {suggestion}
            </div>
            <button
              onClick={handleReturn}
              className="mt-8 w-full max-w-xs py-3 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              Back to Recovery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
