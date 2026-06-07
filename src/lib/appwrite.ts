import { Client, Databases, Account, Storage, ID, Permission, Role } from 'appwrite';
import { ENV } from '@/lib/env';

// ─── Client ──────────────────────────────────────────────────────────────────

export const client = new Client()
  .setEndpoint(ENV.APPWRITE_ENDPOINT)
  .setProject(ENV.APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// ─── Resource IDs (set via env vars) ─────────────────────────────────────────

export const DB_ID = ENV.APPWRITE_DB_ID;
export const STORAGE_BUCKET_ID = ENV.STORAGE_BUCKET_ID;

export const COLLECTIONS = {
  tasks:          ENV.TASKS_COLLECTION_ID,
  projects:       ENV.PROJECTS_COLLECTION_ID,
  calendarEvents: ENV.CALENDAR_COLLECTION_ID,
  recurringTasks: ENV.RECURRING_COLLECTION_ID,
  dailyReports:   ENV.REPORTS_COLLECTION_ID,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** True when all required Appwrite env vars are present. */
export const isAppwriteConfigured = (): boolean =>
  Boolean(ENV.APPWRITE_PROJECT_ID && ENV.APPWRITE_DB_ID);

/** Re-export utility classes so callers only need to import from this module. */
export { ID, Permission, Role };
