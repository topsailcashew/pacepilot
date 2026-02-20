import { Client, Databases, Account, ID, Permission, Role } from 'appwrite';

// ─── Client ──────────────────────────────────────────────────────────────────

const ENDPOINT =
  import.meta.env.VITE_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? '';

export const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// ─── Resource IDs (set via env vars) ─────────────────────────────────────────

export const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID ?? '';

export const COLLECTIONS = {
  tasks: import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID ?? '',
  projects: import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID ?? '',
  calendarEvents: import.meta.env.VITE_APPWRITE_CALENDAR_COLLECTION_ID ?? '',
  recurringTasks: import.meta.env.VITE_APPWRITE_RECURRING_COLLECTION_ID ?? '',
  dailyReports: import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID ?? '',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** True when all required Appwrite env vars are present. */
export const isAppwriteConfigured = (): boolean =>
  Boolean(PROJECT_ID && DB_ID);

/** Re-export utility classes so callers only need to import from this module. */
export { ID, Permission, Role };
