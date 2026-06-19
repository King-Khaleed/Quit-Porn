"use client";

import { useState } from "react";

const steps = [
  {
    title: "Tap Share",
    description: "Tap the Share button in Safari's toolbar at the bottom of the screen.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M12 2v12" />
        <path d="M8 6l4-4 4 4" />
      </svg>
    ),
  },
  {
    title: "Scroll Down",
    description: "Scroll down in the share sheet and tap 'Add to Home Screen'.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 13l5 5 5-5" />
        <path d="M12 6v12" />
      </svg>
    ),
  },
  {
    title: "Tap Add",
    description: "Tap 'Add' in the top-right corner. The app will appear on your home screen.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
];

export default function InstallGuide() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-border-primary rounded-xl p-5 space-y-4 animate-fade-in-up">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-lg font-heading font-semibold text-text-primary mb-1">
            Install on iOS
          </h2>
          <p className="text-sm text-text-secondary">
            Get the full app experience with push notifications and offline access.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-accent-subtle/20 border border-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-sm">{step.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{step.title}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-accent-subtle/10 border border-accent/10 rounded-lg px-4 py-2.5">
          <p className="text-xs text-text-secondary leading-relaxed">
            Already installed? The app works fully offline. Your data is encrypted and never leaves your device unless you choose to sync.
          </p>
        </div>
      </div>

      <button
        onClick={handleCopyLink}
        className="w-full py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all duration-200"
      >
        {copied ? "Link Copied!" : "Copy App Link"}
      </button>
    </div>
  );
}
