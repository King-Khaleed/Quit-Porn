"use client";

import { useState, useCallback } from "react";
import { saveRecovery } from "@/lib/relapseRecovery";
import { useStreak } from "@/hooks/useStreak";

interface Props {
  onComplete: () => void;
  onDismiss: () => void;
}

type Phase = "step1" | "step2" | "step3" | "done";

const TRIGGERS = [
  { value: "bored", label: "I was bored" },
  { value: "stressed", label: "I was stressed" },
  { value: "lonely", label: "I was lonely" },
  { value: "triggered", label: "Triggered by content" },
  { value: "sleep", label: "I couldn't sleep" },
  { value: "unsure", label: "I don't know yet" },
];

const LESSONS = [
  { value: "technique", label: "Try a technique next time" },
  { value: "environment", label: "Change my environment" },
  { value: "reach-out", label: "Reach out to someone" },
  { value: "sleep", label: "Prioritize sleep" },
  { value: "catch-early", label: "Catch it earlier" },
];

const COMMITMENTS = [
  "Start fresh today",
  "Use a technique next time",
  "Journal tonight",
  "Go to bed on time",
  "Reach out before acting",
];

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

export default function RelapseRecovery({ onComplete, onDismiss }: Props) {
  const { handleRelapse } = useStreak();
  const [phase, setPhase] = useState<Phase>("step1");
  const [trigger, setTrigger] = useState("");
  const [triggerDetail] = useState("");
  const [lesson, setLesson] = useState("");
  const [lessonDetail] = useState("");
  const [commitment, setCommitment] = useState("");
  const [customCommitment, setCustomCommitment] = useState("");

  const handleFinish = useCallback(() => {
    handleRelapse();
    saveRecovery({
      timestamp: new Date().toISOString(),
      trigger,
      triggerDetail,
      lesson,
      lessonDetail,
      commitment: commitment === "_custom" ? customCommitment : commitment,
      completed: true,
    });
    onComplete();
    setPhase("done");
  }, [trigger, triggerDetail, lesson, lessonDetail, commitment, customCommitment, onComplete, handleRelapse]);

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <PhaseIndicator
          current={
            phase === "step1" ? 0 : phase === "step2" ? 1 : phase === "step3" ? 2 : 3
          }
          total={3}
        />
      </div>

      <div className="flex-1 flex flex-col px-5 overflow-y-auto">
        {phase === "step1" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-text-primary">
                What happened?
              </p>
              <p className="text-sm text-text-secondary mt-1">
                No judgment. This is just a data point.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {TRIGGERS.map((t) => {
                const active = trigger === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      setTrigger(t.value);
                      if (t.value !== "unsure") setPhase("step2");
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-accent text-black"
                        : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "step2" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-text-primary">
                What can you learn?
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Every data point makes you stronger.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {LESSONS.map((l) => {
                const active = lesson === l.value;
                return (
                  <button
                    key={l.value}
                    onClick={() => {
                      setLesson(l.value);
                      setPhase("step3");
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-accent text-black"
                        : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "step3" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-text-primary">
                What&apos;s your commitment?
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Forward motion. One small step.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {COMMITMENTS.map((c) => {
                const active = commitment === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCommitment(c)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-accent text-black"
                        : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
              <button
                onClick={() => setCommitment("_custom")}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  commitment === "_custom"
                    ? "bg-accent text-black"
                    : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary"
                }`}
              >
                Write my own
              </button>
            </div>
            {commitment === "_custom" && (
              <textarea
                value={customCommitment}
                onChange={(e) => setCustomCommitment(e.target.value)}
                placeholder="What do you commit to?"
                rows={2}
                className="w-full max-w-sm bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
              />
            )}
            <button
              onClick={handleFinish}
              disabled={!commitment || (commitment === "_custom" && customCommitment.trim().length < 3)}
              className="px-8 py-3 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Move Forward
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-text-primary">
                You&apos;re back
              </p>
              <p className="text-sm text-text-secondary mt-2 max-w-xs mx-auto leading-relaxed">
                Your streak counter reset. But your knowledge just grew. That data point makes your recovery stronger.
              </p>
            </div>
            <div className="bg-bg-surface border border-border-primary rounded-xl px-5 py-4 max-w-sm w-full space-y-2">
              <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Recovery Log</p>
              <div className="text-xs text-text-secondary space-y-1">
                <p>Trigger: <span className="text-text-primary capitalize">{trigger}</span></p>
                <p>Lesson: <span className="text-text-primary capitalize">{lesson}</span></p>
                <p>Commitment: <span className="text-text-primary">{commitment === "_custom" ? customCommitment : commitment}</span></p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="px-8 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {phase !== "done" && (
        <div className="px-5 pb-8">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
          >
            Not now
          </button>
        </div>
      )}

      {phase === "step1" && trigger === "unsure" && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setPhase("step2")}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
          >
            That&apos;s OK — let&apos;s move forward
          </button>
        </div>
      )}
    </div>
  );
}
