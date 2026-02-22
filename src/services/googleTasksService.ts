/**
 * googleTasksService.ts
 *
 * Thin wrapper around the Google Tasks REST API v1.
 * Operates on the user's default task list (@default).
 *
 * All functions return null / [] on auth errors (401) so callers can
 * decide whether to prompt re-auth or skip silently.
 */

const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function authorisedFetch(
  token: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GoogleTask {
  googleTaskId: string;
  title: string;
  completed: boolean;
}

/**
 * Fetch all tasks from the user's default Google Tasks list.
 * Returns [] on auth error.
 */
export async function fetchGoogleTasks(token: string): Promise<GoogleTask[]> {
  const params = new URLSearchParams({ showCompleted: 'false', maxResults: '100' });
  const res = await authorisedFetch(token, `${TASKS_BASE}?${params}`);
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Google Tasks fetch failed: HTTP ${res.status}`);

  const data = (await res.json()) as { items?: Array<{ id: string; title?: string; status?: string }> };
  return (data.items ?? []).map((t) => ({
    googleTaskId: t.id,
    title: t.title ?? '',
    completed: t.status === 'completed',
  }));
}

/**
 * Create a task in the user's default Google Tasks list.
 * Returns the Google task ID, or null on auth error.
 */
export async function createGoogleTask(
  token: string,
  title: string
): Promise<string | null> {
  const res = await authorisedFetch(token, TASKS_BASE, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Google Tasks create failed: HTTP ${res.status}`);

  const created = (await res.json()) as { id: string };
  return created.id;
}

/**
 * Mark a Google Task as completed.
 */
export async function completeGoogleTask(
  token: string,
  googleTaskId: string
): Promise<void> {
  const res = await authorisedFetch(token, `${TASKS_BASE}/${googleTaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' }),
  });
  if (res.status === 401 || res.status === 404) return;
  if (!res.ok) throw new Error(`Google Tasks complete failed: HTTP ${res.status}`);
}

/**
 * Delete a Google Task by ID.
 */
export async function deleteGoogleTask(
  token: string,
  googleTaskId: string
): Promise<void> {
  const res = await authorisedFetch(token, `${TASKS_BASE}/${googleTaskId}`, {
    method: 'DELETE',
  });
  if (res.status === 401 || res.status === 404 || res.status === 204) return;
  if (!res.ok) throw new Error(`Google Tasks delete failed: HTTP ${res.status}`);
}
