"use client";

import { useState, useEffect } from "react";
import TechniqueCard from "@/components/TechniqueCard";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import {
  techniques,
  getTechniquesForMood,
  type Technique,
} from "@/data/techniques";
import { logTechniqueLocal } from "@/lib/db";

const MOOD_FILTERS = ["all", "anxious", "stressed", "bored", "lonely", "angry", "sad", "urgent", "overwhelmed", "restless"];

export default function TechniquesPage() {
  const { session } = useAuth();
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const filtered: Technique[] =
    filter === "all"
      ? showAll
        ? techniques
        : techniques.slice(0, 3)
      : getTechniquesForMood(filter);

  const handleLog = (techniqueId: string, worked: boolean) => {
    logTechniqueLocal({
      techniqueId,
      mood: filter === "all" ? "neutral" : filter,
      time: new Date().toISOString(),
      worked,
    });
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to access techniques.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Micro-Moments
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            60-second neuroscience-backed interventions for when urges hit.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1">
            {MOOD_FILTERS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setFilter(m);
                  setShowAll(true);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  filter === m
                    ? "bg-accent text-black"
                    : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover"
                }`}
              >
                {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((tech, i) => (
            <div key={tech.id} style={{ animationDelay: `${i * 0.08}s` }}>
              <TechniqueCard
                technique={tech}
                onLog={handleLog}
                compact={false}
              />
            </div>
          ))}
        </div>

        {filter === "all" && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all duration-200"
          >
            Show All 10 Techniques
          </button>
        )}

        {filter === "all" && showAll && techniques.length > 3 && (
          <button
            onClick={() => setShowAll(false)}
            className="mt-4 py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all duration-200"
          >
            Show Recommended
          </button>
        )}
      </div>

      <Nav />
    </>
  );
}
