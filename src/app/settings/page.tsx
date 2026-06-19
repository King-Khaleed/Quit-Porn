"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import { subscribeToPush } from "@/lib/push";
import { techniques } from "@/data/techniques";
import ExportFlow from "@/components/ExportFlow";
import ImportFlow from "@/components/ImportFlow";
import { IconCheck, IconAlert } from "@/components/icons";
import { encrypt } from "@/lib/crypto";

const STORAGE_KEYS = [
  "qp_streak",
  "qp_last_journal_date",
  "qp_passphrase",
  "qp_salt",
  "sb-nexckttwgdcairejirmb-auth-token",
];

const DB_NAME = "quitporn";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getIOSVersion(): number {
  if (typeof navigator === "undefined") return 0;
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) return parseInt(match[1]) + parseInt(match[2]) / 10;
  return 0;
}

function getiOSPushSupport(): "supported" | "unsupported" | "unknown" {
  if (!isIOS()) return "unknown";
  return getIOSVersion() >= 16.4 ? "supported" : "unsupported";
}

export default function SettingsPage() {
  const { session, logout } = useAuth();
  const { streak, reset } = useStreak();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [domain, setDomain] = useState("");
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("qp_blocklist");
    if (stored) {
      try { setBlocklist(JSON.parse(stored)); } catch {}
    }
    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushSupported(true);
      if (Notification.permission === "granted") setPushEnabled(true);
    }
    if (isIOS() && getiOSPushSupport() === "unsupported") {
      setPushSupported(false);
    }
  }, []);

  const updateBlocklist = useCallback((newList: string[]) => {
    setBlocklist(newList);
    localStorage.setItem("qp_blocklist", JSON.stringify(newList));
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "UPDATE_BLOCKLIST",
        blocklist: newList,
      });
    }
  }, []);

  const addDomain = useCallback(() => {
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    if (!d || blocklist.includes(d)) return;
    updateBlocklist([...blocklist, d]);
    setDomain("");
  }, [domain, blocklist, updateBlocklist]);

  const removeDomain = useCallback((d: string) => {
    updateBlocklist(blocklist.filter((x) => x !== d));
  }, [blocklist, updateBlocklist]);

  const handleExportJournal = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const passphrase = localStorage.getItem("qp_passphrase");
      if (!passphrase) {
        setMessage({ text: "No encryption key found. Generate one in the Journal first.", type: "error" });
        return;
      }
      const { getLocalJournalEntries } = await import("@/lib/db");
      const { decrypt } = await import("@/lib/crypto");
      const entries = await getLocalJournalEntries();
      const decrypted = [];
      for (const entry of entries) {
        let content = "";
        if (entry.encrypted === "relapse_log") {
          content = "Auto-logged relapse";
        } else {
          try { content = await decrypt(entry.encrypted, passphrase); } catch { content = "[decryption failed]"; }
        }
        decrypted.push({
          date: entry.timestamp,
          mood: entry.mood,
          content,
        });
      }
      const blob = new Blob([JSON.stringify(decrypted, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quitporn-journal-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ text: "Journal exported successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: "Export failed: " + (err instanceof Error ? err.message : "Unknown error"), type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    try {
      const { openDB } = await import("idb");
      const db = await indexedDB.databases?.();
      if (db) {
        for (const d of db) {
          if (d.name) indexedDB.deleteDatabase(d.name);
        }
      } else {
        indexedDB.deleteDatabase(DB_NAME);
      }
      for (const key of STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
      localStorage.clear();
      if (session) await logout();
      window.location.reload();
    } catch (err) {
      setMessage({ text: "Delete failed: " + (err instanceof Error ? err.message : "Unknown error"), type: "error" });
      setDeleting(false);
    }
  };

  const handlePushToggle = async () => {
    if (pushEnabled) return;
    const ok = await subscribeToPush();
    if (ok) setPushEnabled(true);
  };

  const handleSubmitFeedback = async () => {
    const text = feedbackText.trim();
    if (!text) return;
    setFeedbackSubmitting(true);
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const supabase = getSupabase();
      await supabase.from("user_feedback").insert({ feedback: text });
      setFeedbackText("");
      setMessage({ text: "Feedback sent. Thank you!", type: "success" });
    } catch {
      setMessage({ text: "Failed to send feedback. Try again.", type: "error" });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage your data and preferences.</p>
        </div>

        {message && (
          <div className={`mt-4 px-4 py-2.5 rounded-xl text-xs ${
            message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
          } animate-fade-in`}>
            {message.text}
          </div>
        )}

        {/* Push Notifications */}
        <div className="mt-6 bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up space-y-3">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Notifications</h2>
          {pushSupported ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Push Notifications</p>
                <p className="text-xs text-text-tertiary">Milestone reminders every 7 days</p>
              </div>
              <button
                onClick={handlePushToggle}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                  pushEnabled ? "bg-accent" : "bg-bg-elevated"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${
                  pushEnabled ? "translate-x-5" : ""
                }`} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <IconAlert size={14} className="text-text-tertiary shrink-0 mt-0.5" />
                <p className="text-xs text-text-tertiary leading-relaxed">
                  {isIOS()
                    ? `Push notifications require iOS 16.4 or later. Your device is running iOS ${getIOSVersion()}.`
                    : "Push notifications are not supported in this browser."}
                </p>
              </div>
              {isIOS() && getIOSVersion() < 16.4 && (
                <a
                  href="https://support.apple.com/en-us/HT204204"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-accent hover:text-accent-hover transition-colors ml-7"
                >
                  Learn how to update iOS →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Custom Blocklist */}
        <div className="mt-4 bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up stagger-1 space-y-3">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Content Blocking</h2>
          <p className="text-xs text-text-tertiary">
            Add custom domains to block. {blocklist.length + 94} total domains blocked.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="example.com"
              className="flex-1 bg-bg-elevated border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              onClick={addDomain}
              disabled={!domain.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Add
            </button>
          </div>
          {blocklist.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {blocklist.map((d) => (
                <div key={d} className="flex items-center justify-between bg-bg-elevated rounded-lg px-3 py-1.5">
                  <span className="text-xs text-text-secondary">{d}</span>
                  <button
                    onClick={() => removeDomain(d)}
                    className="text-xs text-danger/70 hover:text-danger transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="mt-4 bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up stagger-2 space-y-3">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Data Management</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              Export Full Backup
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
            >
              Import Backup
            </button>
            <button
              onClick={handleExportJournal}
              disabled={exporting}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-bg-elevated text-text-tertiary hover:bg-bg-surface-hover border border-border-primary disabled:opacity-40 transition-all"
            >
              {exporting ? "Exporting..." : "Export Journal (plain text)"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all"
            >
              Delete All Data
            </button>
          </div>
          <p className="text-xs text-text-tertiary">
            Full backup includes all encrypted data and can be transferred between devices. Deletion is permanent and cannot be undone.
          </p>
        </div>

        {/* Account */}
        <div className="mt-4 bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up stagger-3 space-y-3">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <p className="text-xs text-text-tertiary">
                Free — signed in anonymously
              </p>
            </div>
            <span className="text-[10px] text-text-tertiary bg-bg-elevated px-2 py-1 rounded-md">
              Free tier
            </span>
          </div>
        </div>

        {/* Feedback */}
        <div className="mt-4 bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up stagger-4 space-y-3">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Send Feedback</h2>
          <p className="text-xs text-text-tertiary">
            Help us improve. Bug reports, feature requests, or just saying hi.
          </p>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Your feedback..."
            rows={3}
            className="w-full bg-bg-elevated border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
          />
          <button
            onClick={handleSubmitFeedback}
            disabled={!feedbackText.trim() || feedbackSubmitting}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {feedbackSubmitting ? "Sending..." : "Send Feedback"}
          </button>
        </div>

        {/* Streak Stats */}
        <div className="mt-4 bg-bg-surface border border-border-primary rounded-xl p-4 animate-fade-in-up stagger-4 space-y-2">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Stats</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-tertiary">Current Streak: </span>
              <span className="text-text-secondary font-medium">{streak.current} days</span>
            </div>
            <div>
              <span className="text-text-tertiary">Best Streak: </span>
              <span className="text-text-secondary font-medium">{streak.longest} days</span>
            </div>
            <div>
              <span className="text-text-tertiary">Relapses: </span>
              <span className="text-text-secondary font-medium">{streak.relapseDates.length}</span>
            </div>
            <div>
              <span className="text-text-tertiary">Techniques: </span>
              <span className="text-text-secondary font-medium">{techniques.length} available</span>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6 animate-fade-in">
          <div className="bg-bg-surface border border-border-primary rounded-2xl max-w-sm w-full p-6 animate-scale-in space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-3">
                <IconAlert size={24} className="text-danger" />
              </div>
              <h2 className="text-lg font-heading font-semibold text-text-primary">
                Delete All Data?
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                This will permanently delete your streak, journal entries, encryption keys, and all local data. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-danger text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {deleting ? "Deleting..." : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && <ExportFlow onClose={() => setShowExport(false)} />}

      {showImport && <ImportFlow onClose={() => setShowImport(false)} />}

      <Nav />
    </>
  );
}
