"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    console.error("QuitPorn error:", error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-heading font-bold text-text-primary">Something went wrong</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          This is on us. Your data is safe — it&apos;s stored locally on your device.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
