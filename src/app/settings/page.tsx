"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import { subscribeToPush } from "@/lib/push";
import { techniques } from "@/data/techniques";
import ExportFlow from "@/components/ExportFlow";
import ImportFlow from "@/components/ImportFlow";
import { IconAlert } from "@/components/icons";
import { getFeedbackPrefs, setFeedbackPrefs, tapFeedback, successFeedback } from "@/lib/feedback";
import { useToast } from "@/components/ToastProvider";

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
  const { streak } = useStreak();
  const { showToast } = useToast();
  const [feedbackPrefs, setFeedbackPrefsState] = useState(getFeedbackPrefs);
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return Notification.permission === "granted";
  });
  const [pushSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    if (isIOS() && getiOSPushSupport() === "unsupported") return false;
    return "Notification" in window && "serviceWorker" in navigator;
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [gdprExporting, setGdprExporting] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const handleGdprExport = async () => {
    setGdprExporting(true);
    setMessage(null);
    try {
      const { exportGdprData } = await import("@/lib/gdpr");
      await exportGdprData();
      setMessage({ text: "GDPR data export downloaded.", type: "success" });
    } catch (err) {
      setMessage({ text: "Export failed: " + (err instanceof Error ? err.message : "Unknown error"), type: "error" });
    } finally {
      setGdprExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setMessage(null);
    try {
      const { deleteRemoteAccount, deleteAllLocalData } = await import("@/lib/gdpr");
      const result = await deleteRemoteAccount();
      await deleteAllLocalData();
      setMessage({
        text: result.deleted.length > 0
          ? "Account deleted. Redirecting..."
          : "Local data cleared. Redirecting...",
        type: "success",
      });
      window.location.reload();
    } catch (err) {
      setMessage({ text: "Delete failed: " + (err instanceof Error ? err.message : "Unknown error"), type: "error" });
      setDeletingAccount(false);
    }
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
      successFeedback();
      showToast("Feedback sent — thank you!", "success");
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

        {/* Interaction Preferences */}
        <div className="mt-4 card-premium p-4 animate-fade-in-up stagger-2 space-y-3">
          <h2 className="text-sm font-heading font-semibold text-text-primary">Interactions</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Tap sounds</p>
              <p className="text-xs text-text-tertiary">Subtle audio on button taps</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = setFeedbackPrefs({ sound: !feedbackPrefs.sound });
                setFeedbackPrefsState(next);
                if (next.sound) tapFeedback();
              }}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                feedbackPrefs.sound ? "bg-accent" : "bg-bg-elevated"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${
                feedbackPrefs.sound ? "translate-x-5" : ""
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Haptic feedback</p>
              <p className="text-xs text-text-tertiary">Light vibration on actions</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = setFeedbackPrefs({ haptics: !feedbackPrefs.haptics });
                setFeedbackPrefsState(next);
                tapFeedback();
              }}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                feedbackPrefs.haptics ? "bg-accent" : "bg-bg-elevated"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200 ${
                feedbackPrefs.haptics ? "translate-x-5" : ""
              }`} />
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-4 card-premium p-4 animate-fade-in-up stagger-2 space-y-3">
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
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleGdprExport}
              disabled={gdprExporting}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover border border-border-primary disabled:opacity-40 transition-all"
            >
              {gdprExporting ? "Exporting..." : "Export My Data (GDPR)"}
            </button>
            <button
              onClick={() => setShowDeleteAccountConfirm(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all"
            >
              Delete Account
            </button>
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

      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6 animate-fade-in">
          <div className="bg-bg-surface border border-border-primary rounded-2xl max-w-sm w-full p-6 animate-scale-in space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-3">
                <IconAlert size={24} className="text-danger" />
              </div>
              <h2 className="text-lg font-heading font-semibold text-text-primary">
                Delete Account?
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                This will delete your account, push subscriptions, and all local data. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccountConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-danger text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {deletingAccount ? "Deleting..." : "Delete Account"}
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
