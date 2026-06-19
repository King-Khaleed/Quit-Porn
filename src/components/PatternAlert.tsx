"use client";

import { type PatternAlert as PatternAlertType } from "@/lib/patterns";
import { getContextHint } from "@/lib/patterns";
import { IconCheck, IconAlert } from "@/components/icons";

interface Props {
  alert: PatternAlertType | null;
  riskScore: number;
}

export default function PatternAlertBanner({ alert, riskScore }: Props) {
  const context = getContextHint();

  if (!alert) {
    if (riskScore > 0.5) {
      return (
        <div className="animate-fade-in-up stagger-2 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3">
          <div className="flex items-start gap-3">
            <IconAlert size={20} className="text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning mb-0.5">
                Elevated Risk Window
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {context.dayName} evenings tend to be higher risk. Consider setting up a Micro-Moment or journaling to stay centered.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in-up stagger-2 bg-accent-subtle/10 border border-accent/10 rounded-xl px-4 py-3">
        <div className="flex items-start gap-3">
          <IconCheck size={20} className="text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-accent mb-0.5">
              You&apos;re in a good window
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Keep doing what you&apos;re doing. Journal entries help us spot patterns before they form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up stagger-2 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <IconAlert size={20} className="text-danger mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-danger mb-0.5">
            Curious Pattern Detected
          </p>
          <p className="text-xs text-text-secondary leading-relaxed mb-2">
            {alert.message}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">Confidence:</span>
            <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden max-w-24">
              <div
                className="h-full bg-danger rounded-full transition-all duration-500"
                style={{ width: `${alert.confidence}%` }}
              />
            </div>
            <span className="text-xs font-medium text-text-secondary">
              {alert.confidence}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
