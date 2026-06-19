"use client";

import { useState } from "react";
import { type Technique } from "@/data/techniques";

function BreathingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
      <path d="M12 11v10" />
      <path d="M8 17l4 3 4-3" />
    </svg>
  );
}

function GroundingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="4" />
      <path d="M12 3v3" />
      <path d="M12 17v4" />
      <path d="M5 10H3" />
      <path d="M21 10h-2" />
    </svg>
  );
}

function PhysicalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M10 7l-4 7h3l-1 6" />
      <path d="M14 7l4 7h-3l1 6" />
    </svg>
  );
}

function CognitiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 5.5V21h8v-5.5c1.5-1 3-3 3-5.5a7 7 0 0 0-7-7z" />
      <path d="M9 9h6" />
      <path d="M9 13h4" />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M4 20c1.5-2 3.5-3 5-3s3.5 1 5 3" />
      <path d="M14 17c1.5-2 3.5-3 5-3s2.5 1 3.5 2" />
    </svg>
  );
}

function SensoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
      <path d="M8 11c0 2 2 4 4 4s4-2 4-4" />
      <path d="M12 15v3" />
      <path d="M9 21h6" />
    </svg>
  );
}

const categoryIcons: Record<string, (props: { className?: string }) => React.ReactNode> = {
  breathing: BreathingIcon,
  grounding: GroundingIcon,
  physical: PhysicalIcon,
  cognitive: CognitiveIcon,
  social: SocialIcon,
  sensory: SensoryIcon,
};

interface Props {
  technique: Technique;
  onLog?: (techniqueId: string, worked: boolean) => void;
  compact?: boolean;
}

export default function TechniqueCard({ technique, onLog, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const handleFeedback = (worked: boolean) => {
    setFeedback(worked);
    onLog?.(technique.id, worked);
    setTimeout(() => setFeedback(null), 2000);
  };

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left bg-bg-surface border border-border-primary rounded-xl px-4 py-3 hover:bg-bg-surface-hover transition-all duration-200 animate-fade-in-up"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">{technique.name}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{technique.duration}</p>
          </div>
          {categoryIcons[technique.category]?.({ className: "text-accent shrink-0" })}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-primary rounded-xl overflow-hidden animate-fade-in-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-bg-surface-hover transition-all duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {categoryIcons[technique.category]?.({ className: "text-accent shrink-0" })}
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
                {technique.category}
              </span>
              <span className="text-xs text-text-tertiary">{technique.duration}</span>
            </div>
            <h3 className="text-base font-heading font-semibold text-text-primary">
              {technique.name}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">{technique.subtitle}</p>
          </div>
          <span className={`text-text-tertiary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 animate-slide-up space-y-3">
          <div className="space-y-1.5">
            {technique.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-accent font-mono text-xs mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="bg-accent-subtle/10 border border-accent/10 rounded-lg px-3 py-2">
            <p className="text-xs text-text-tertiary leading-relaxed">
              <span className="text-accent font-medium">Why it works: </span>
              {technique.science}
            </p>
          </div>

          {feedback === null && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFeedback(true);
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all duration-200"
              >
                Helped
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFeedback(false);
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all duration-200"
              >
                Didn&apos;t Help
              </button>
            </div>
          )}

          {feedback !== null && (
            <p className="text-xs text-accent text-center">
              {feedback ? "Saved — this technique works for you" : "Noted — we'll learn from this"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
