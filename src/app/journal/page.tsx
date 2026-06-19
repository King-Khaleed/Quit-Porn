"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  saveJournalEntryLocal,
  getLocalJournalEntries,
  requestPersistentStorage,
} from "@/lib/db";
import { loadUrgeLogs } from "@/lib/urgeTracking";

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

function getRecentUrgeLevel(): number {
  const logs = loadUrgeLogs();
  const recent = logs
    .filter((l) => l.timestamp >= new Date(Date.now() - 86400000).toISOString())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return recent.length > 0 ? recent[0].intensity : 0;
}

function getContextualPrompt(urgeLevel: number): string {
  if (urgeLevel >= 8) {
    return "That crisis-level urge was intense. What got you through it? What can you do next time to catch it earlier? You're here — that matters.";
  }
  if (urgeLevel >= 5) {
    return "You logged a strong urge today. What was the trigger? How did the technique change your state? Be honest — this is your data.";
  }
  if (urgeLevel >= 1) {
    return "You logged a mild urge earlier. What was the context? Was there an external trigger or an internal feeling?";
  }
  return "How is your recovery going today? What's on your mind — any patterns you're noticing?";
}

function getAdaptiveQuestions(mood: string): string[] {
  const base = ["What triggered this feeling?", "What helped you stay present?"];
  switch (mood) {
    case "urge":
      return ["What was the trigger?", "Which technique helped?", "What will you do differently next time?"];
    case "sad":
    case "lonely":
      return ["What are you missing right now?", "Who can you reach out to?", "What activity lifts your mood?"];
    case "stressed":
    case "anxious":
      return ["What is the source of pressure?", "What is within your control?", "What helps you feel grounded?"];
    case "happy":
    case "calm":
      return ["What contributed to this state?", "How can you recreate this tomorrow?", "What are you grateful for?"];
    default:
      return base;
  }
}

export default function JournalPage() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string | null>(null);

  useEffect(() => {
    requestPersistentStorage();
    getLocalJournalEntries().then(setEntries).catch(() => {});
  }, []);

  // Auto-generate encryption key on first mount
  useEffect(() => {
    try {
      if (typeof localStorage === "undefined") return;
      const stored = localStorage.getItem("qp_passphrase");
      if (stored) {
        setPassphrase(stored);
      } else {
        const phrase = Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        localStorage.setItem("qp_passphrase", phrase);
        setPassphrase(phrase);
      }
    } catch {}
  }, []);

  const recentUrgeLevel = useMemo(() => getRecentUrgeLevel(), []);
  const prompt = useMemo(() => getContextualPrompt(recentUrgeLevel), [recentUrgeLevel]);
  const adaptiveQuestions = useMemo(() => (mood ? getAdaptiveQuestions(mood) : []), [mood]);

  const handleSave = async () => {
    if (!passphrase || text.trim().length < 3 || !mood) return;
    setSaving(true);
    try {
      const encrypted = await encrypt(text, passphrase);
      await saveJournalEntryLocal({
        encrypted,
        mood,
        timestamp: new Date().toISOString(),
        synced: false,
      });
      const updated = await getLocalJournalEntries();
      setEntries(updated);
      setText("");
      setMood("");
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleViewEntry = async (entry: any) => {
    setViewingEntry(entry);
    setDecryptedContent(null);
    setDecryptError(null);

    if (!entry.encrypted) {
      setDecryptedContent("This entry appears to be empty or corrupted.");
      return;
    }
    if (entry.encrypted === "relapse_log") {
      setDecryptedContent("This was automatically logged when you acknowledged a relapse. No additional details were recorded.");
      return;
    }

    if (!passphrase) {
      setDecryptError("Encryption key not found. This entry cannot be decrypted.");
      return;
    }

    setDecrypting(true);
    try {
      const content = await decrypt(entry.encrypted, passphrase);
      setDecryptedContent(content);
    } catch {
      setDecryptError("Could not decrypt this entry. The encryption key may have changed.");
    } finally {
      setDecrypting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to use the journal.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-text-primary">Journal</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Write freely — every entry is encrypted before it leaves your device.
          </p>
        </div>

        {/* Encryption banner */}
        <div className="mt-4 bg-accent-subtle/10 border border-accent/10 rounded-lg px-4 py-2.5 animate-fade-in-up">
          <p className="text-xs text-text-secondary leading-relaxed">
            Encryption active. Your entries are secured before they leave this device.
          </p>
        </div>

        {/* Contextual prompt */}
        <div className="mt-4 bg-bg-surface border border-border-primary rounded-xl px-4 py-3 animate-fade-in-up stagger-1">
          <p className="text-sm text-text-primary leading-relaxed">{prompt}</p>
        </div>

        {/* Journal editor */}
        <div className="mt-4 space-y-4 animate-fade-in-up stagger-2">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              How are you feeling?
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMood(m.label.toLowerCase())}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    mood === m.label.toLowerCase()
                      ? "bg-accent text-black font-medium ring-2 ring-accent/50"
                      : "bg-bg-surface text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  <span className="mr-1">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Adaptive questions */}
          {mood && adaptiveQuestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-text-tertiary">Consider these questions:</p>
              {adaptiveQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setText((prev) => (prev ? `${prev}\n\n${q}` : q))}
                  className="block text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  + {q}
                </button>
              ))}
            </div>
          )}

          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={mood ? "Write freely — this is encrypted and private..." : "Select a mood above to get started..."}
              rows={5}
              className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={text.trim().length < 3 || !mood || saving}
            className="w-full py-2.5 rounded-xl font-medium text-sm transition-all bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>

        {/* Entry viewer */}
        {viewingEntry && (
          <div className="mt-6 animate-fade-in-up">
            <button
              onClick={() => {
                setViewingEntry(null);
                setDecryptedContent(null);
                setDecryptError(null);
              }}
              className="text-sm text-accent hover:text-accent-hover mb-4 inline-flex items-center gap-1 transition-colors"
            >
              ← Close
            </button>
            <div className="bg-bg-surface border border-border-primary rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-tertiary">
                  {(() => {
                    try { return new Date(viewingEntry.timestamp).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    }); } catch { return "Unknown date"; }
                  })()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
                  {viewingEntry.mood === "relapse_yes" ? "relapse" : viewingEntry.mood || "unknown"}
                </span>
              </div>
              {decrypting ? (
                <div className="flex items-center gap-2 py-4">
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <span className="text-sm text-text-tertiary">Decrypting...</span>
                </div>
              ) : decryptedContent ? (
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                  {decryptedContent}
                </p>
              ) : decryptError ? (
                <p className="text-sm text-danger">{decryptError}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Entries list */}
        {entries.length > 0 ? (
          <div className="mt-8 space-y-3">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Entries ({entries.length})
            </p>
            {[...entries].reverse().map((entry: any, i: number) => (
              <button
                key={entry.id ?? i}
                onClick={() => handleViewEntry(entry)}
                className="w-full text-left bg-bg-surface border border-border-primary rounded-xl px-4 py-3 hover:bg-bg-surface-hover transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-tertiary">
                    {(() => {
                      try { return new Date(entry.timestamp).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      }); } catch { return "Unknown date"; }
                    })()}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
                    {entry.mood === "relapse_yes" ? "relapse" : entry.mood}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-1">
                  {entry.encrypted === "relapse_log"
                    ? "Relapse log — tap to view"
                    : "Encrypted entry — tap to decrypt and read"}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 bg-bg-surface border border-border-primary rounded-xl px-4 py-8 text-center animate-fade-in-up">
            <p className="text-sm text-text-tertiary">
              No entries yet. Write your first one above.
            </p>
          </div>
        )}
      </div>

      <Nav />
    </>
  );
}
