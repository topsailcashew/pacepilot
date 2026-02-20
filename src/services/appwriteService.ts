/**
 * appwriteService.ts
 *
 * All Appwrite Database and Account operations for Pace Pilot.
 *
 * Design principles:
 *  - Mappers convert Appwrite's `$id`-keyed documents to our own types.
 *  - Every function throws on error so callers (store actions) can decide
 *    whether to revert optimistic UI updates or show a toast.
 *  - `userId` is stored as a plain attribute on every document so we can
 *    filter with Query.equal() even when collection-level security is
 *    set to document-level permissions.
 */

import { Models, Query } from 'appwrite';
import {
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  ID,
  Permission,
  Role,
} from '@/lib/appwrite';
import type {
  Task,
  Project,
  CalendarEvent,
  RecurringTask,
  DailyReport,
  User,
  AppState,
  RecurringStatus,
} from '@/types';

// ─── Document → Domain mappers ────────────────────────────────────────────────

/** Strip Appwrite metadata and normalise $id → id */
function fromDoc<T extends object>(doc: Models.Document): T {
  const {
    $id,
    $collectionId: _c,
    $databaseId: _d,
    $createdAt: _ca,
    $updatedAt: _ua,
    $permissions: _p,
    userId: _uid,
    ...rest
  } = doc as Models.Document & { userId?: string };
  return { id: $id, ...rest } as unknown as T;
}

/** Parse a JSON string stored in Appwrite; return fallback on error */
function safeParseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapTask(doc: Models.Document): Task {
  return fromDoc<Task>(doc);
}

function mapProject(doc: Models.Document): Project {
  return fromDoc<Project>(doc);
}

function mapCalendarEvent(doc: Models.Document): CalendarEvent {
  return fromDoc<CalendarEvent>(doc);
}

function mapRecurringTask(doc: Models.Document): RecurringTask {
  return fromDoc<RecurringTask>(doc);
}

function mapDailyReport(doc: Models.Document): DailyReport {
  const base = fromDoc<Omit<DailyReport, 'taskBreakdown'> & { taskBreakdown?: string }>(doc);
  return {
    ...base,
    taskBreakdown: safeParseJson(base.taskBreakdown as string | undefined, []),
  } as DailyReport;
}

// ─── Permission helper ────────────────────────────────────────────────────────

function userPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Create a new Appwrite account and immediately open a session. */
export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<Models.User<Models.Preferences>> {
  await account.create(ID.unique(), email, password, name);
  return account.createEmailPasswordSession(email, password) as unknown as Models.User<Models.Preferences>;
}

/** Open an email/password session. */
export async function logIn(
  email: string,
  password: string
): Promise<void> {
  await account.createEmailPasswordSession(email, password);
}

/** Destroy the current session (logout). */
export async function logOut(): Promise<void> {
  await account.deleteSession('current');
}

/** Fetch the currently authenticated Appwrite user, or null if not logged in. */
export async function getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

/**
 * Persist user preferences (streak, working hours, daily goal) using
 * Appwrite's built-in user-prefs store — no extra collection needed.
 */
export async function saveUserPreferences(
  prefs: Partial<User['preferences'] & { streak: number }>
): Promise<void> {
  await account.updatePrefs(prefs);
}

/** Load persisted user preferences, falling back to sensible defaults. */
export async function loadUserPreferences(): Promise<
  User['preferences'] & { streak: number }
> {
  const raw = await account.getPrefs<User['preferences'] & { streak: number }>();
  return {
    startTime: raw.startTime ?? '08:00',
    endTime: raw.endTime ?? '18:00',
    dailyGoal: raw.dailyGoal ?? 5,
    streak: raw.streak ?? 0,
  };
}

// ─── Data loading ─────────────────────────────────────────────────────────────

/**
 * Fetch all collections for a given user and return them in the shape
 * expected by `store.initializeData()`.
 */
export async function loadUserData(
  userId: string
): Promise<Partial<AppState>> {
  const q = [Query.equal('userId', userId), Query.limit(100)];

  const [tasksRes, projectsRes, calendarRes, recurringRes, reportsRes] =
    await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.tasks, q),
      databases.listDocuments(DB_ID, COLLECTIONS.projects, q),
      databases.listDocuments(DB_ID, COLLECTIONS.calendarEvents, q),
      databases.listDocuments(DB_ID, COLLECTIONS.recurringTasks, q),
      databases.listDocuments(DB_ID, COLLECTIONS.dailyReports, q),
    ]);

  return {
    tasks: tasksRes.documents.map(mapTask),
    projects: projectsRes.documents.map(mapProject),
    calendarEvents: calendarRes.documents.map(mapCalendarEvent),
    recurringTasks: recurringRes.documents.map(mapRecurringTask),
    dailyReports: reportsRes.documents.map(mapDailyReport),
  };
}

/**
 * Seed a brand-new user's account with default projects so their workspace
 * is not completely empty on first login.
 */
export async function seedDefaultProjects(userId: string): Promise<Project[]> {
  const defaults: Omit<Project, 'id'>[] = [
    { name: 'Work', color: 'bg-pilot-orange', icon: 'Briefcase' },
    { name: 'Personal', color: 'bg-blue-500', icon: 'User' },
    { name: 'Health', color: 'bg-green-500', icon: 'Activity' },
  ];

  const perms = userPermissions(userId);
  const created = await Promise.all(
    defaults.map((p) =>
      databases.createDocument(DB_ID, COLLECTIONS.projects, ID.unique(), { ...p, userId }, perms)
    )
  );
  return created.map(mapProject);
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────

export async function createTask(task: Task, userId: string): Promise<void> {
  const { id, ...data } = task;
  await databases.createDocument(
    DB_ID,
    COLLECTIONS.tasks,
    id,
    { ...data, userId },
    userPermissions(userId)
  );
}

export async function updateTask(
  id: string,
  updates: Partial<Task>
): Promise<void> {
  const { id: _id, ...data } = updates as Task;
  await databases.updateDocument(DB_ID, COLLECTIONS.tasks, id, data);
}

export async function deleteTask(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, COLLECTIONS.tasks, id);
}

// ─── Project CRUD ─────────────────────────────────────────────────────────────

export async function createProject(
  project: Project,
  userId: string
): Promise<void> {
  const { id, ...data } = project;
  await databases.createDocument(
    DB_ID,
    COLLECTIONS.projects,
    id,
    { ...data, userId },
    userPermissions(userId)
  );
}

// ─── Recurring Task CRUD ──────────────────────────────────────────────────────

export async function updateRecurringTask(
  id: string,
  status: RecurringStatus
): Promise<void> {
  await databases.updateDocument(DB_ID, COLLECTIONS.recurringTasks, id, {
    status,
    last: new Date().toLocaleDateString(),
  });
}

// ─── Daily Report CRUD ────────────────────────────────────────────────────────

export async function createDailyReport(
  report: DailyReport,
  userId: string
): Promise<void> {
  const { id, taskBreakdown, ...data } = report as DailyReport & { id?: string };
  await databases.createDocument(
    DB_ID,
    COLLECTIONS.dailyReports,
    id ?? ID.unique(),
    {
      ...data,
      taskBreakdown: JSON.stringify(taskBreakdown),
      userId,
    },
    userPermissions(userId)
  );
}
