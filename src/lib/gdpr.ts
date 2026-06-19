const DB_NAME = "quitporn";

export interface GDPRExportData {
  exported_at: string;
  server_data: Record<string, unknown> | null;
  client_data: {
    localStorage: Record<string, unknown>;
    indexeDB: {
      journal_entries: unknown[];
      technique_logs: unknown[];
      settings: Record<string, unknown>;
    };
  };
}

export async function exportGdprData(): Promise<void> {
  const keys = [
    "qp_streak",
    "qp_last_journal_date",
    "qp_salt",
    "qp_premium",
    "qp_commit_streak",
    "qp_urges",
    "qp_checkins",
    "qp_recoveries",
    "qp_feed",
    "qp_coach_session",
    "qp_coach_usage",
    "qp_notifications_enabled",
    "qp_weekly_report_opted_in",
    "qp_feedback_prefs",
  ];

  const localData: Record<string, unknown> = {};
  for (const key of keys) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try {
          localData[key] = JSON.parse(val);
        } catch {
          localData[key] = val;
        }
      }
    } catch {}
  }

  let serverData: Record<string, unknown> | null = null;
  try {
    const res = await fetch("/api/user/export", { method: "POST" });
    if (res.ok) {
      serverData = await res.json();
    }
  } catch {}

  const idbData: { journal_entries: unknown[]; technique_logs: unknown[]; settings: Record<string, unknown> } = { journal_entries: [], technique_logs: [], settings: {} };
  try {
    const db = await new Promise<IDBDatabase | null>((resolve) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    if (db) {
      const tx = db.transaction(["journal_entries", "technique_logs", "settings"], "readonly");

      const jStore = tx.objectStore("journal_entries");
      const jReq = jStore.getAll();
      await new Promise<void>((resolve) => {
        jReq.onsuccess = () => { idbData.journal_entries = jReq.result || []; resolve(); };
        jReq.onerror = () => resolve();
      });

      const tStore = tx.objectStore("technique_logs");
      const tReq = tStore.getAll();
      await new Promise<void>((resolve) => {
        tReq.onsuccess = () => { idbData.technique_logs = tReq.result || []; resolve(); };
        tReq.onerror = () => resolve();
      });

      const sStore = tx.objectStore("settings");
      const sReq = sStore.getAll();
      await new Promise<void>((resolve) => {
        sReq.onsuccess = () => {
          const all: Record<string, unknown> = {};
          for (const s of sReq.result || []) {
            all[s.key] = s.value;
          }
          idbData.settings = all;
          resolve();
        };
        sReq.onerror = () => resolve();
      });

      db.close();
    }
  } catch {}

  const payload: GDPRExportData = {
    exported_at: new Date().toISOString(),
    server_data: serverData,
    client_data: {
      localStorage: localData,
      indexeDB: idbData,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quitporn-gdpr-export-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function deleteRemoteAccount(): Promise<{ success: boolean; deleted: string[]; errors?: string[]; note?: string }> {
  const res = await fetch("/api/user/delete", { method: "POST" });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Account deletion failed");
  }
  return body;
}

export async function deleteAllLocalData(): Promise<void> {
  const db = await indexedDB.databases?.();
  if (db) {
    for (const d of db) {
      if (d.name) indexedDB.deleteDatabase(d.name);
    }
  } else {
    indexedDB.deleteDatabase(DB_NAME);
  }
  localStorage.clear();
  sessionStorage.clear();
}
