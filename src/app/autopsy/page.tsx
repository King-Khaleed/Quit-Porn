"use client";

import { useState } from "react";
import AutopsyForm from "@/components/AutopsyForm";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";

export default function AutopsyPage() {
  const { session } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  const handleComplete = (analysis: string) => {
    setLastAnalysis(analysis);
    setCompleted(true);
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to use the relapse autopsy.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Relapse Autopsy
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            A shame-free reflection to understand your patterns and grow stronger.
          </p>
        </div>

        <div className="mt-6">
          {!completed ? (
            <AutopsyForm onComplete={handleComplete} />
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              {lastAnalysis && (
                <div className="bg-accent-subtle/20 border border-accent/20 rounded-xl p-5">
                  <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line">
                    {lastAnalysis}
                  </p>
                </div>
              )}

              <div className="bg-bg-surface border border-border-primary rounded-xl p-4 text-center">
                <p className="text-sm text-text-secondary leading-relaxed">
                  Relapses are not failures. They are data points that teach us where to strengthen our recovery.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCompleted(false);
                    setLastAnalysis(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-accent text-black hover:bg-accent-hover transition-all duration-200"
                >
                  New Analysis
                </button>

                <a
                  href="/journal"
                  className="flex-1 py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary text-center transition-all duration-200"
                >
                  Write in Journal
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <Nav />
    </>
  );
}
