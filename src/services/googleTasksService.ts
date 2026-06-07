import { gFetch } from '@/lib/googleApi';
import type { TaskZone } from '@/types';

// Task lists live under users/@me/lists; task items live under lists/{id}/tasks
const TASKLISTS_BASE = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
const LISTS_BASE     = 'https://tasks.googleapis.com/tasks/v1/lists';

// ── Zone encoding in notes ─────────────────────────────────────────────────────
// We embed zone as the first line of the notes field: "[pacepilot:zone=Green]"

const ZONE_TAG_RE = /\[pacepilot:zone=(\w+)\]/;

export function encodeZoneInNotes(zone: TaskZone, existingNotes?: string): string {
  const tag = `[pacepilot:zone=${zone}]`;
  const cleaned = (existingNotes ?? '').replace(ZONE_TAG_RE, '').trim();
  return cleaned ? `${tag}\n${cleaned}` : tag;
}

export function decodeZoneFromNotes(notes?: string): TaskZone {
  const match = notes?.match(ZONE_TAG_RE);
  const z = match?.[1] as TaskZone | undefined;
  const valid: TaskZone[] = ['Blue', 'Green', 'Grey', 'Yellow', 'Red'];
  return valid.includes(z as TaskZone) ? (z as TaskZone) : 'Grey';
}

export function stripZoneTag(notes?: string): string {
  return (notes ?? '').replace(ZONE_TAG_RE, '').trim();
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GoogleTaskList {
  id: string;
  title: string;
}

export interface GoogleTask {
  googleTaskId: string;
  listId: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  notes?: string;
  zone: TaskZone;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function tasksBase(listId: string) {
  return `${LISTS_BASE}/${encodeURIComponent(listId)}/tasks`;
}

function parseTask(
  t: { id: string; title?: string; status?: string; due?: string; notes?: string },
  listId: string
): GoogleTask {
  return {
    googleTaskId: t.id,
    listId,
    title: t.title ?? '',
    completed: t.status === 'completed',
    dueDate: t.due ? t.due.slice(0, 10) : undefined,
    notes: stripZoneTag(t.notes),
    zone: decodeZoneFromNotes(t.notes),
  };
}

// ── Task Lists ─────────────────────────────────────────────────────────────────

/** Fetch all Google Task lists for this user. */
export async function fetchGoogleTaskLists(token: string): Promise<GoogleTaskList[]> {
  const res = await gFetch(token, `${TASKLISTS_BASE}?maxResults=100`);
  if (res.status === 401 || res.status === 403) return [];
  if (!res.ok) throw new Error(`Google Task Lists fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as { items?: Array<{ id: string; title: string }> };
  return (data.items ?? []).map((l) => ({ id: l.id, title: l.title }));
}

/** Create a new task list. Returns its id. */
export async function createGoogleTaskList(token: string, title: string): Promise<string | null> {
  const res = await gFetch(token, TASKLISTS_BASE, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`Google Task Lists create failed: HTTP ${res.status}`);
  const created = (await res.json()) as { id: string };
  return created.id;
}

/** Delete a task list. */
export async function deleteGoogleTaskList(token: string, listId: string): Promise<void> {
  const res = await gFetch(token, `${TASKLISTS_BASE}/${encodeURIComponent(listId)}`, { method: 'DELETE' });
  if (res.status === 401 || res.status === 404 || res.status === 204) return;
  if (!res.ok) throw new Error(`Google Task Lists delete failed: HTTP ${res.status}`);
}

// ── Tasks ──────────────────────────────────────────────────────────────────────

/** Fetch all tasks (including completed) from a specific list. */
export async function fetchGoogleTasks(token: string, listId = '@default'): Promise<GoogleTask[]> {
  const params = new URLSearchParams({ showCompleted: 'true', maxResults: '100' });
  const res = await gFetch(token, `${tasksBase(listId)}?${params}`);
  if (res.status === 401 || res.status === 403) return [];
  if (!res.ok) throw new Error(`Google Tasks fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as {
    items?: Array<{ id: string; title?: string; status?: string; due?: string; notes?: string }>
  };
  return (data.items ?? []).map((t) => parseTask(t, listId));
}

/** Fetch tasks from ALL lists in parallel. */
export async function fetchAllGoogleTasks(token: string): Promise<GoogleTask[]> {
  const lists = await fetchGoogleTaskLists(token);
  if (lists.length === 0) return fetchGoogleTasks(token, '@default');

  const results = await Promise.allSettled(
    lists.map((l) => fetchGoogleTasks(token, l.id))
  );
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

/** Create a task in a specific list, embedding zone in notes. */
export async function createGoogleTask(
  token: string,
  title: string,
  listId = '@default',
  zone: TaskZone = 'Grey',
  dueDate?: string,
  userNotes?: string,
): Promise<string | null> {
  const body: Record<string, string> = {
    title,
    notes: encodeZoneInNotes(zone, userNotes),
  };
  if (dueDate) body.due = `${dueDate}T00:00:00.000Z`;

  const res = await gFetch(token, tasksBase(listId), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Google Tasks create failed: HTTP ${res.status}`);
  const created = (await res.json()) as { id: string };
  return created.id;
}

/** Update task title, zone (via notes), and optional due date. */
export async function updateGoogleTask(
  token: string,
  googleTaskId: string,
  listId: string,
  title: string,
  zone?: TaskZone,
  dueDate?: string,
): Promise<void> {
  const body: Record<string, string> = { title };
  if (zone) body.notes = encodeZoneInNotes(zone);
  if (dueDate) body.due = `${dueDate}T00:00:00.000Z`;

  const res = await gFetch(token, `${tasksBase(listId)}/${googleTaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 404) return;
  if (!res.ok) throw new Error(`Google Tasks update failed: HTTP ${res.status}`);
}

/** Mark a task completed. */
export async function completeGoogleTask(
  token: string,
  googleTaskId: string,
  listId = '@default',
): Promise<void> {
  const res = await gFetch(token, `${tasksBase(listId)}/${googleTaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });
  if (res.status === 401 || res.status === 404) return;
  if (!res.ok) throw new Error(`Google Tasks complete failed: HTTP ${res.status}`);
}

/** Mark a task incomplete (reopen). */
export async function uncompleteGoogleTask(
  token: string,
  googleTaskId: string,
  listId = '@default',
): Promise<void> {
  const res = await gFetch(token, `${tasksBase(listId)}/${googleTaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'needsAction', completed: null }),
  });
  if (res.status === 401 || res.status === 404) return;
  if (!res.ok) throw new Error(`Google Tasks uncomplete failed: HTTP ${res.status}`);
}

/** Delete a task. */
export async function deleteGoogleTask(
  token: string,
  googleTaskId: string,
  listId = '@default',
): Promise<void> {
  const res = await gFetch(token, `${tasksBase(listId)}/${googleTaskId}`, { method: 'DELETE' });
  if (res.status === 401 || res.status === 404 || res.status === 204) return;
  if (!res.ok) throw new Error(`Google Tasks delete failed: HTTP ${res.status}`);
}
