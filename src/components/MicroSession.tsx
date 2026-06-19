"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { techniques, type Technique } from "@/data/techniques";
import { saveUrgeLog, type UrgeLog } from "@/lib/urgeTracking";
import { addFeedItem } from "@/lib/feed";

interface Props {
  initialIntensity: number;
  onComplete: (log: UrgeLog) => void;
  onDismiss: () => void;
}

type Phase = "breathe" | "choose" | "doing" | "reflect" | "done";

function getRecommendedTechnique(intensity: number, mood?: string): Technique {
  const urgent = techniques.filter((t) => t.bestFor.includes("urgent"));
  if (intensity >= 8) return urgent[0] || techniques[0];
  if (mood) {
    const matched = techniques.filter((t) => t.bestFor.includes(mood));
    if (matched.length > 0) return matched[0];
  }
  return techniques[Math.floor(Math.random() * techniques.length)];
}

function PhaseIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i <= current ? "w-8 bg-accent" : "w-2 bg-bg-elevated"
          }`}
        />
      ))}
    </div>
  );
}

function BreathingPhase({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "wait">("inhale");
  const [count, setCount] = useState(4);
  const phaseRef = useRef<"inhale" | "hold" | "exhale" | "wait">("inhale");
  const startRef = useRef(Date.now());
  const roundsRef = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const DURATIONS: Record<string, number> = { inhale: 4, hold: 4, exhale: 4, wait: 2 };
  const NEXT: Record<string, "inhale" | "hold" | "exhale" | "wait"> = {
    inhale: "hold", hold: "exhale", exhale: "wait", wait: "inhale",
  };

  useEffect(() => {
    const TICK_MS = 200;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const d = DURATIONS[phaseRef.current];
      const remaining = Math.max(0, Math.ceil(d - elapsed));
      setCount(remaining);

      if (elapsed >= d) {
        const next = NEXT[phaseRef.current];
        phaseRef.current = next;
        startRef.current = Date.now();
        setPhase(next);
        setCount(DURATIONS[next]);

        if (next === "inhale") {
          roundsRef.current += 1;
          if (roundsRef.current >= 3) {
            clearInterval(timer);
            onDoneRef.current();
          }
        }
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, []);

  const circleSize = 160 + (
    phase === "inhale" ? count * 8
    : phase === "hold" ? 32
    : phase === "exhale" ? count * -8
    : 0
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in">
      <p className="text-sm text-text-secondary font-medium tracking-wider uppercase">Center yourself</p>
      <div
        className="rounded-full border-2 border-accent/30 flex items-center justify-center transition-all duration-1000 ease-in-out"
        style={{ width: circleSize, height: circleSize }}
      >
        <span className="text-5xl font-heading font-bold text-accent tabular-nums">{count}</span>
      </div>
      <p className="text-lg font-medium text-text-primary">
        {phase === "inhale" ? "Breathe In" : phase === "hold" ? "Hold" : phase === "exhale" ? "Breathe Out" : "Rest"}
      </p>
    </div>
  );
}

function TechniquePhase({
  technique,
  onDone,
  onSkip,
}: {
  technique: Technique;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(parseInt(technique.duration) || 60);

  useEffect(() => {
    if (stepIndex >= technique.steps.length) {
      onDone();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setStepIndex((i) => i + 1);
          return parseInt(technique.duration) || 60;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stepIndex, technique, onDone]);

  const step = technique.steps[stepIndex] || "";

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 animate-fade-in">
      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{technique.name}</p>
      <p className="text-2xl font-heading font-bold text-text-primary text-center leading-snug">{step}</p>
      <p className="text-5xl font-heading font-bold text-accent tabular-nums">{timeLeft}s</p>
      <div className="flex gap-1.5">
        {technique.steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i <= stepIndex ? "bg-accent" : "bg-bg-elevated"
            }`}
          />
        ))}
      </div>
      <button
        onClick={onSkip}
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors mt-4"
      >
        Skip to reflect
      </button>
    </div>
  );
}

export default function MicroSession({ initialIntensity, onComplete, onDismiss }: Props) {
  const [phase, setPhase] = useState<Phase>("breathe");
  const [urgeBefore, setUrgeBefore] = useState(initialIntensity);
  const [urgeAfter, setUrgeAfter] = useState(0);
  const [mood, setMood] = useState("");
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [shareToFeed, setShareToFeed] = useState(false);

  useEffect(() => {
    setTechnique(getRecommendedTechnique(initialIntensity));
  }, [initialIntensity]);

  const handleBreatheDone = useCallback(() => setPhase("choose"), []);
  const handleTechniqueDone = useCallback(() => setPhase("reflect"), []);
  const handleReflectDone = useCallback(() => {
    if (!technique) return;
    const drop = (urgeAfter || 0) < urgeBefore ? urgeBefore - (urgeAfter || 0) : 0;
    const log: UrgeLog = {
      intensity: urgeBefore,
      intensityAfter: urgeAfter || urgeBefore,
      techniqueId: technique.id,
      techniqueWorked: (urgeAfter || 0) < urgeBefore,
      mood: mood || undefined,
      context: undefined,
      timestamp: new Date().toISOString(),
    };
    saveUrgeLog(log);
    if (shareToFeed) {
      addFeedItem({
        timestamp: log.timestamp,
        intensity: log.intensity,
        techniqueId: technique.id,
        techniqueName: technique.name,
        drop: drop > 0 ? drop : undefined,
        worked: (urgeAfter || 0) < urgeBefore,
      });
    }
    onComplete(log);
    setPhase("done");
  }, [urgeBefore, urgeAfter, technique, mood, onComplete, shareToFeed]);

  if (!technique) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <PhaseIndicator
          current={
            phase === "breathe" ? 0 : phase === "choose" ? 1 : phase === "doing" ? 2 : phase === "reflect" ? 3 : 4
          }
          total={4}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-5">
        {phase === "breathe" && <BreathingPhase onDone={handleBreatheDone} />}

        {phase === "choose" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <p className="text-sm text-text-secondary">Recommended for you</p>
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-text-primary">{technique.name}</p>
              <p className="text-sm text-text-secondary mt-1">{technique.subtitle}</p>
              <p className="text-xs text-text-tertiary mt-2">{technique.duration} • {technique.category}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTechnique(
                    techniques.filter((t) => t.id !== technique.id)[
                      Math.floor(Math.random() * (techniques.length - 1))
                    ]
                  );
                }}
                className="px-4 py-2 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
              >
                Try another
              </button>
              <button
                onClick={() => setPhase("doing")}
                className="px-6 py-2 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
              >
                Start
              </button>
            </div>
          </div>
        )}

        {phase === "doing" && (
          <TechniquePhase technique={technique} onDone={handleTechniqueDone} onSkip={() => setPhase("reflect")} />
        )}

        {phase === "reflect" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <p className="text-sm text-text-secondary">How intense is the urge now?</p>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                <button
                  key={v}
                  onClick={() => setUrgeAfter(v)}
                  className={`w-9 h-14 rounded-lg text-xs font-bold transition-all ${
                    urgeAfter >= v
                      ? v <= 3
                        ? "bg-accent/30 text-accent"
                        : v <= 6
                        ? "bg-warning/30 text-warning"
                        : "bg-danger/30 text-danger"
                      : "bg-bg-elevated text-text-tertiary/30"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {["calm", "anxious", "stressed", "sad", "bored", "lonely", "angry", "proud"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mood === m ? "bg-accent text-black" : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={handleReflectDone}
              className="px-8 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              Log & Continue
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <span className="text-3xl">{urgeAfter < urgeBefore ? "✓" : "💪"}</span>
            </div>
            <p className="text-xl font-heading font-bold text-text-primary text-center">
              {urgeAfter < urgeBefore
                ? `Dropped from ${urgeBefore} to ${urgeAfter}`
                : "You showed up. That's the win."}
            </p>
            <p className="text-sm text-text-secondary text-center max-w-xs">
              {urgeAfter < urgeBefore
                ? "You just proved you can shift your state. That skill grows every time you use it."
                : "Not every session drops the number. Showing up when it's hard builds the muscle."}
            </p>
            <div className="bg-bg-surface border border-border-primary rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-text-tertiary">Drop: {urgeBefore} → {urgeAfter} ({(urgeBefore - urgeAfter) > 0 ? `-${urgeBefore - urgeAfter}` : "0"})</p>
              <p className="text-xs text-text-tertiary">Technique: {technique.name}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={shareToFeed}
                  onChange={(e) => setShareToFeed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-bg-elevated rounded-full peer-checked:bg-accent/40 transition-colors" />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-text-tertiary transition-all duration-200 ${shareToFeed ? 'translate-x-4 bg-accent' : ''}`} />
              </div>
              <span className="text-xs text-text-tertiary peer-checked:text-text-secondary">
                Share anonymously to help others
              </span>
            </label>
            <button
              onClick={onDismiss}
              className="px-8 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all mt-2"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {phase === "breathe" && (
        <div className="px-5 pb-8">
          <button
            onClick={() => setPhase("choose")}
            className="w-full py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
          >
            Skip breathing
          </button>
        </div>
      )}
    </div>
  );
}
