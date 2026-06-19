import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "quitporn";
const DB_VERSION = 1;

export interface JournalEntryRecord {
  id?: number;
  encrypted: string;
  mood: string;
  timestamp: string;
  synced: boolean;
}

export interface TechniqueLogRecord {
  id?: number;
  techniqueId: string;
  mood: string;
  time: string;
  worked: boolean;
}

export interface SettingsRecord {
  key: string;
  value: unknown;
}

let dbPromise: Promise<IDBPDatabase<{
  journal_entries: { key: number; value: JournalEntryRecord; };
  technique_logs: { key: number; value: TechniqueLogRecord; };
  settings: { key: string; value: SettingsRecord; };
}>> | null = null;

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

export async function getLocalJournalEntries(): Promise<JournalEntryRecord[]> {
  const db = await getDb();
  return db.getAll("journal_entries");
}

export async function logTechniqueLocal(log: TechniqueLogRecord) {
  const db = await getDb();
  return db.add("technique_logs", { ...log, time: log.time || new Date().toISOString() });
}

export async function getTechniqueLogs(): Promise<TechniqueLogRecord[]> {
  const db = await getDb();
  return db.getAll("technique_logs");
}

export async function saveSetting(key: string, value: unknown) {
  const db = await getDb();
  return db.put("settings", { key, value });
}

export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDb();
  const result = await db.get("settings", key);
  return result?.value as T | undefined;
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const db = await getDb();
  const all = await db.getAll("settings");
  return all.reduce((acc: Record<string, unknown>, s: SettingsRecord) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}


