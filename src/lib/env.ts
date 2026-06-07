/**
 * env.ts — centralised access to all VITE_ environment variables.
 *
 * Import ENV instead of reading import.meta.env directly throughout the
 * codebase. Defaults are provided so the app degrades gracefully when
 * a variable is absent (e.g. during local development without a full .env).
 */

export const ENV = {
  APPWRITE_ENDPOINT:   import.meta.env.VITE_APPWRITE_ENDPOINT   ?? 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID ?? '',
  APPWRITE_DB_ID:      import.meta.env.VITE_APPWRITE_DATABASE_ID ?? '',
  STORAGE_BUCKET_ID:   import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID ?? '',
  GEMINI_API_KEY:      import.meta.env.VITE_GEMINI_API_KEY ?? '',
  TASKS_COLLECTION_ID:     import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID ?? '',
  PROJECTS_COLLECTION_ID:  import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID ?? '',
  CALENDAR_COLLECTION_ID:  import.meta.env.VITE_APPWRITE_CALENDAR_COLLECTION_ID ?? '',
  RECURRING_COLLECTION_ID: import.meta.env.VITE_APPWRITE_RECURRING_COLLECTION_ID ?? '',
  REPORTS_COLLECTION_ID:   import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID ?? '',
} as const;
