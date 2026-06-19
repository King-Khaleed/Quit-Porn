"use client";

import { useState } from "react";

const MOODS = [
  { emoji: "😌", label: "Calm" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😟", label: "Anxious" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Stressed" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😈", label: "Urge" },
  { emoji: "🥳", label: "Happy" },
];

interface Props {
  onSave: (text: string, mood: string) => Promise<void>;
  saving?: boolean;
}

export default function JournalEditor({ onSave, saving }: Props) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");

  const canSave = text.trim().length > 3 && mood;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(text, mood);
    setText("");
    setMood("");
  };

  return (
    <div className="animate-fade-in-up stagger-1 space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          How are you feeling?
        </label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(m.label.toLowerCase())}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                mood === m.label.toLowerCase()
                  ? "bg-accent text-black font-medium ring-2 ring-accent/50"
                  : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
              }`}
              aria-label={m.label}
            >
              <span className="mr-1">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          What's on your mind?
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write freely — this is encrypted and private..."
          rows={4}
          className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all duration-200"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Entry"}
      </button>
    </div>
  );
}
