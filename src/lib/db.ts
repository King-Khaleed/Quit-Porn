import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "quitporn";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("journal_entries")) {
          db.createObjectStore("journal_entries", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains("technique_logs")) {
          db.createObjectStore("technique_logs", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("sync_queue")) {
          db.createObjectStore("sync_queue", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function requestPersistentStorage() {
  if (typeof navigator !== "undefined" && "storage" in navigator) {
    try {
      const persisted = await navigator.storage.persisted();
      if (!persisted) {
        await navigator.storage.persist();
      }
    } catch {}
  }
}

export async function saveJournalEntryLocal(entry: {
  encrypted: string;
  mood: string;
  timestamp: string;
  synced: boolean;
}) {
  const db = await getDb();
  return db.add("journal_entries", { ...entry, synced: false });
}

export async function getLocalJournalEntries(): Promise<any[]> {
  const db = await getDb();
  return db.getAll("journal_entries");
}

export async function getUnsyncedEntries(): Promise<any[]> {
  const db = await getDb();
  const all = await db.getAll("journal_entries");
  return all.filter((e: any) => !e.synced);
}

export async function markEntrySynced(id: number) {
  const db = await getDb();
  const entry = await db.get("journal_entries", id);
  if (entry) {
    entry.synced = true;
    await db.put("journal_entries", entry);
  }
}

export async function logTechniqueLocal(log: {
  techniqueId: string;
  mood: string;
  time: string;
  worked: boolean;
}) {
  const db = await getDb();
  return db.add("technique_logs", log);
}

export async function getTechniqueLogs(): Promise<any[]> {
  const db = await getDb();
  return db.getAll("technique_logs");
}

export async function saveSetting(key: string, value: any) {
  const db = await getDb();
  return db.put("settings", { key, value });
}

export async function getSetting(key: string): Promise<any> {
  const db = await getDb();
  const result = await db.get("settings", key);
  return result?.value;
}

export async function getAllSettings(): Promise<Record<string, any>> {
  const db = await getDb();
  const all = await db.getAll("settings");
  return all.reduce((acc: Record<string, any>, s: any) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

export async function addToSyncQueue(action: string, data: any) {
  const db = await getDb();
  return db.add("sync_queue", { action, data, timestamp: new Date().toISOString() });
}

export async function processSyncQueue(processFn: (action: string, data: any) => Promise<void>) {
  const db = await getDb();
  const queue = await db.getAll("sync_queue");
  for (const item of queue) {
    try {
      await processFn(item.action, item.data);
      await db.delete("sync_queue", item.id);
    } catch {}
  }
}
