export interface BackupPayload {
  streak: Record<string, unknown>;
  urges: unknown[];
  checkins: unknown[];
  recoveries: unknown[];
  journal: unknown[];
  techniqueLogs: unknown[];
  settings: Record<string, unknown>;
  blocklist: string[];
  commitStreak: number;
  passphrase: string | null;
  feed: unknown[];
  coachSession: unknown;
  coachUsage: unknown;
  premium: boolean;
}

export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  stats: {
    streakDays: number;
    totalUrges: number;
    totalJournalEntries: number;
    totalRecoveries: number;
    exportedFrom: string;
  };
  data: BackupPayload;
}

const BACKUP_VERSION = 1;
const APP_NAME = "QuitPorn";

function getLocalItem(key: string): unknown {
  try {
    const val = localStorage.getItem(key);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  } catch {
    return null;
  }
}

function getUserDataKeys(): string[] {
  return [
    "qp_streak",
    "qp_urges",
    "qp_checkins",
    "qp_commit_streak",
    "qp_recoveries",
    "qp_feed",
    "qp_blocklist",
    "qp_passphrase",
    "qp_salt",
    "qp_premium",
    "qp_coach_session",
    "qp_coach_usage",
  ];
}

async function getIndexedDBData(): Promise<{
  journal: unknown[];
  techniqueLogs: unknown[];
  settings: Record<string, unknown>;
}> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return { journal: [], techniqueLogs: [], settings: {} };
  }

  const result = { journal: [] as unknown[], techniqueLogs: [] as unknown[], settings: {} as Record<string, unknown> };

  try {
    const db = await new Promise<IDBDatabase | null>((resolve, reject) => {
      const req = indexedDB.open("quitporn", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (!db) return result;

    const tx = db.transaction(["journal_entries", "technique_logs", "settings"], "readonly");

    const journalStore = tx.objectStore("journal_entries");
    const journalReq = journalStore.getAll();
    await new Promise<void>((resolve) => {
      journalReq.onsuccess = () => {
        result.journal = journalReq.result || [];
        resolve();
      };
      journalReq.onerror = () => resolve();
    });

    const techStore = tx.objectStore("technique_logs");
    const techReq = techStore.getAll();
    await new Promise<void>((resolve) => {
      techReq.onsuccess = () => {
        result.techniqueLogs = techReq.result || [];
        resolve();
      };
      techReq.onerror = () => resolve();
    });

    const settingsStore = tx.objectStore("settings");
    const settingsReq = settingsStore.getAll();
    await new Promise<void>((resolve) => {
      settingsReq.onsuccess = () => {
        const all: Record<string, unknown> = {};
        for (const s of settingsReq.result || []) {
          all[s.key] = s.value;
        }
        result.settings = all;
        resolve();
      };
      settingsReq.onerror = () => resolve();
    });

    db.close();
  } catch {
    // IndexedDB unavailable
  }

  return result;
}

export async function collectBackupData(): Promise<BackupData> {
  const streak = getLocalItem("qp_streak") as Record<string, unknown> || {};
  const urges = getLocalItem("qp_urges") as unknown[] || [];
  const checkins = getLocalItem("qp_checkins") as unknown[] || [];
  const recoveries = getLocalItem("qp_recoveries") as unknown[] || [];
  const feed = getLocalItem("qp_feed") as unknown[] || [];
  const blocklist = getLocalItem("qp_blocklist") as string[] || [];
  const commitStreak = (getLocalItem("qp_commit_streak") as number) || 0;
  const passphrase = getLocalItem("qp_passphrase") as string | null;
  const premium = getLocalItem("qp_premium") === true;
  const coachSession = getLocalItem("qp_coach_session");
  const coachUsage = getLocalItem("qp_coach_usage");

  const { journal, techniqueLogs, settings } = await getIndexedDBData();

  return {
    version: BACKUP_VERSION,
    appName: APP_NAME,
    exportedAt: new Date().toISOString(),
    stats: {
      streakDays: (streak.current as number) || 0,
      totalUrges: urges.length,
      totalJournalEntries: journal.length,
      totalRecoveries: recoveries.length,
      exportedFrom: typeof window !== "undefined" ? window.location.origin : "",
    },
    data: {
      streak,
      urges,
      checkins,
      recoveries,
      journal,
      techniqueLogs,
      settings,
      blocklist,
      commitStreak,
      passphrase,
      feed,
      coachSession,
      coachUsage,
      premium,
    },
  };
}

export function downloadBackup(data: BackupData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = data.exportedAt.split("T")[0];
  a.download = `quitporn-backup-${date}.qpbackup`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;
        if (!data.version || !data.data) {
          reject(new Error("Invalid backup file format"));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error("Could not parse backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export async function restoreBackup(data: BackupData): Promise<{ restored: string[]; errors: string[] }> {
  const restored: string[] = [];
  const errors: string[] = [];

  const payload = data.data;

  const setLocal = (key: string, val: unknown) => {
    try {
      if (val === null || val === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(val));
      }
      restored.push(key);
    } catch (e) {
      errors.push(`Failed to set ${key}: ${e}`);
    }
  };

  // Restore localStorage data
  setLocal("qp_streak", payload.streak);
  setLocal("qp_urges", payload.urges);
  setLocal("qp_checkins", payload.checkins);
  setLocal("qp_commit_streak", payload.commitStreak);
  setLocal("qp_recoveries", payload.recoveries);
  setLocal("qp_feed", payload.feed);
  setLocal("qp_blocklist", payload.blocklist);
  setLocal("qp_passphrase", payload.passphrase);
  if (payload.premium) setLocal("qp_premium", true);
  if (payload.coachSession) setLocal("qp_coach_session", payload.coachSession);
  if (payload.coachUsage) setLocal("qp_coach_usage", payload.coachUsage);

  // Restore IndexedDB data
  if (payload.journal.length > 0 || payload.techniqueLogs.length > 0 || Object.keys(payload.settings).length > 0) {
    try {
      const req = indexedDB.open("quitporn", 1);
      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(["journal_entries", "technique_logs", "settings"], "readwrite");

          if (payload.journal.length > 0) {
            const journalStore = tx.objectStore("journal_entries");
            journalStore.clear();
            for (const entry of payload.journal) {
              journalStore.add(entry);
            }
          }

          if (payload.techniqueLogs.length > 0) {
            const techStore = tx.objectStore("technique_logs");
            techStore.clear();
            for (const log of payload.techniqueLogs) {
              techStore.add(log);
            }
          }

          if (Object.keys(payload.settings).length > 0) {
            const settingsStore = tx.objectStore("settings");
            settingsStore.clear();
            for (const [key, value] of Object.entries(payload.settings)) {
              settingsStore.add({ key, value });
            }
          }

          tx.oncomplete = () => {
            restored.push("indexeddb");
            db.close();
            resolve();
          };
          tx.onerror = () => {
            errors.push("Failed to restore IndexedDB data");
            db.close();
            resolve();
          };
        };
        req.onerror = () => {
          errors.push("Could not open IndexedDB for restore");
          resolve();
        };
      });
    } catch (e) {
      errors.push(`IndexedDB restore error: ${e}`);
    }
  }

  return { restored, errors };
}

export function formatBackupSize(data: BackupData): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateTransferCode(data: BackupData): string | null {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json).length;
  if (bytes > 2000) return null;

  try {
    const compressed = btoa(json).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    if (compressed.length > 1000) return null;
    return compressed;
  } catch {
    return null;
  }
}

export interface TransferCodeResult {
  code: string;
  valid: boolean;
  data?: BackupData;
  error?: string;
}

export function decodeTransferCode(code: string): TransferCodeResult {
  try {
    const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const padding = 4 - (base64.length % 4);
    const padded = base64 + "=".repeat(padding === 4 ? 0 : padding);
    const json = atob(padded);
    const data = JSON.parse(json) as BackupData;
    return { code, valid: true, data };
  } catch (e) {
    return { code, valid: false, error: "Invalid transfer code" };
  }
}
