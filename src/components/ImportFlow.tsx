"use client";

import { useState, useRef } from "react";
import { readBackupFile, restoreBackup, formatBackupSize, decodeTransferCode, type BackupData } from "@/lib/backup";
import { IconAlert } from "@/components/icons";

interface Props {
  onClose: () => void;
}

type Stage = "choose" | "preview" | "restoring" | "done" | "error";

export default function ImportFlow({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [data, setData] = useState<BackupData | null>(null);
  const [results, setResults] = useState<{ restored: string[]; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"file" | "code" | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const d = await readBackupFile(file);
      setData(d);
      setMethod("file");
      setStage("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
      setStage("error");
    }
  };

  const handleCodeSubmit = () => {
    const code = codeRef.current?.value?.trim();
    if (!code) return;
    const result = decodeTransferCode(code);
    if (result.valid && result.data) {
      setData(result.data);
      setMethod("code");
      setStage("preview");
    } else {
      setError(result.error || "Invalid code");
      setStage("error");
    }
  };

  const handleRestore = async () => {
    if (!data) return;
    setStage("restoring");
    try {
      const result = await restoreBackup(data);
      setResults(result);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
      setStage("error");
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6 animate-fade-in">
      <div className="bg-bg-surface border border-border-primary rounded-2xl max-w-sm w-full p-6 animate-scale-in space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full border border-border-primary flex items-center justify-center mx-auto mb-3 ${
            stage === "done" ? "bg-success/10 border-success/20" : "bg-bg-elevated"
          }`}>
            {stage === "done" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : stage === "restoring" ? (
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            {stage === "choose" && "Import Backup"}
            {stage === "preview" && "Restore Backup?"}
            {stage === "restoring" && "Restoring..."}
            {stage === "done" && "Restore Complete"}
            {stage === "error" && "Import Failed"}
          </h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
            {stage === "choose" && "Select a .qpbackup file or paste a transfer code from another device."}
            {stage === "preview" && "This will overwrite your current data. Make sure you've exported a backup first."}
            {stage === "restoring" && "Please wait while your data is restored..."}
            {stage === "done" && "Your data has been restored. Reload the app to see the changes."}
            {stage === "error" && error}
          </p>
        </div>

        {/* Stage: Choose method */}
        {stage === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-4 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              Choose .qpbackup File
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".qpbackup,.json"
              onChange={handleFile}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-primary" />
              <span className="text-xs text-text-tertiary">or</span>
              <div className="flex-1 h-px bg-border-primary" />
            </div>

            <div className="flex gap-2">
              <input
                ref={codeRef}
                type="text"
                placeholder="Paste transfer code"
                className="flex-1 bg-bg-elevated border border-border-primary rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all font-mono text-xs"
              />
              <button
                onClick={handleCodeSubmit}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
              >
                Restore
              </button>
            </div>

            <p className="text-xs text-text-tertiary text-center">
              Transfer codes work for small backups only (under 2KB). For larger backups, use the file method.
            </p>
          </div>
        )}

        {/* Stage: Preview */}
        {stage === "preview" && data && (
          <>
            <div className="bg-bg-elevated border border-border-primary rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                {method === "file" ? "File Summary" : "Transfer Code Data"}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <span className="text-text-tertiary">Exported</span>
                <span className="text-text-secondary text-right font-medium">
                  {new Date(data.exportedAt).toLocaleDateString()}
                </span>
                <span className="text-text-tertiary">Streak</span>
                <span className="text-text-secondary text-right font-medium">{data.stats.streakDays} days</span>
                <span className="text-text-tertiary">Urges</span>
                <span className="text-text-secondary text-right font-medium">{data.stats.totalUrges}</span>
                <span className="text-text-tertiary">Journal</span>
                <span className="text-text-secondary text-right font-medium">{data.stats.totalJournalEntries} entries</span>
                {method === "file" && (
                  <>
                    <span className="text-text-tertiary">File Size</span>
                    <span className="text-text-secondary text-right font-medium">{formatBackupSize(data)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 flex items-start gap-2">
              <IconAlert size={14} className="text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger leading-relaxed">
                This will replace all your current data. Existing data will be lost. Make sure you have a current backup.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
              >
                Restore Data
              </button>
            </div>
          </>
        )}

        {/* Stage: Restoring */}
        {stage === "restoring" && (
          <div className="flex items-center justify-center py-4">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Stage: Done */}
        {stage === "done" && results && (
          <>
            <div className="bg-bg-elevated border border-border-primary rounded-xl p-4 space-y-1.5">
              <p className="text-xs text-text-tertiary">
                Restored {results.restored.length} items
                {results.errors.length > 0 && ` (${results.errors.length} errors)`}
              </p>
              {results.errors.length > 0 && (
                <div className="space-y-1">
                  {results.errors.map((e, i) => (
                    <p key={i} className="text-[10px] text-danger leading-relaxed">{e}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all"
              >
                Close
              </button>
              <button
                onClick={handleReload}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
              >
                Reload App
              </button>
            </div>
          </>
        )}

        {/* Stage: Error */}
        {stage === "error" && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setStage("choose");
                setError(null);
                setData(null);
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
