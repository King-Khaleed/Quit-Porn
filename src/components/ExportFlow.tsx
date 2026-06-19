"use client";

import { useState, useEffect } from "react";
import { collectBackupData, formatBackupSize, generateTransferCode, type BackupData } from "@/lib/backup";
import { IconCheck, IconAlert } from "@/components/icons";

interface Props {
  onClose: () => void;
}

export default function ExportFlow({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BackupData | null>(null);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    collectBackupData()
      .then((d) => {
        setData(d);
        setTransferCode(generateTransferCode(d));
      })
      .catch((e) => setError(e.message || "Failed to collect data"))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    if (!data) return;
    try {
      const { downloadBackup } = await import("@/lib/backup");
      downloadBackup(data);
      setExported(true);

      // Try Web Share API
      if (navigator.share && data) {
        const json = JSON.stringify(data, null, 2);
        const file = new File([json], `quitporn-backup-${data.exportedAt.split("T")[0]}.qpbackup`, { type: "application/json" });
        try {
          await navigator.share({ files: [file], title: "QuitPorn Backup" });
        } catch {}
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6 animate-fade-in">
      <div className="bg-bg-surface border border-border-primary rounded-2xl max-w-sm w-full p-6 animate-scale-in space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
            {exported ? (
              <IconCheck size={24} className="text-accent" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            {exported ? "Backup Exported" : "Export Backup"}
          </h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            {exported
              ? "Your full backup has been downloaded."
              : "Download a complete backup of your data, including encrypted journal entries."}
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
            <p className="text-xs text-danger leading-relaxed">{error}</p>
          </div>
        )}

        {/* Stats Preview */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="bg-bg-elevated border border-border-primary rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Backup Summary</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <span className="text-text-tertiary">Streak</span>
              <span className="text-text-secondary text-right font-medium">{data.stats.streakDays} days</span>
              <span className="text-text-tertiary">Urges Logged</span>
              <span className="text-text-secondary text-right font-medium">{data.stats.totalUrges}</span>
              <span className="text-text-tertiary">Journal Entries</span>
              <span className="text-text-secondary text-right font-medium">{data.stats.totalJournalEntries}</span>
              <span className="text-text-tertiary">Recoveries</span>
              <span className="text-text-secondary text-right font-medium">{data.stats.totalRecoveries}</span>
              <span className="text-text-tertiary">File Size</span>
              <span className="text-text-secondary text-right font-medium">{formatBackupSize(data)}</span>
            </div>
          </div>
        ) : null}

        {/* Transfer Code */}
        {transferCode && !exported && (
          <div>
            <button
              onClick={() => setShowCode(!showCode)}
              className="w-full text-left text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showCode ? "Hide transfer code" : "Show transfer code (for small backups)"}
            </button>
            {showCode && (
              <div className="mt-2 bg-bg-elevated border border-border-primary rounded-xl p-3">
                <p className="text-[10px] text-text-tertiary mb-1.5">Type this code on your other device's Import screen:</p>
                <code className="block text-xs text-accent font-mono break-all bg-black/20 rounded-lg px-3 py-2 select-all">
                  {transferCode}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all"
          >
            {exported ? "Done" : "Cancel"}
          </button>
          {!exported && (
            <button
              onClick={handleDownload}
              disabled={loading || !data}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Download .qpbackup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
