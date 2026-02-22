/**
 * googleCalendarService.ts
 *
 * Thin wrapper around the Google Calendar REST API v3.
 * Uses the access token obtained from Appwrite's Google OAuth identity.
 *
 * All functions return null / [] on auth errors (401) and throw on
 * unexpected errors so callers can decide how to surface them.
 */

import { account } from '@/lib/appwrite';
import type { CalendarEvent } from '@/types';

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// ─── Token helper ─────────────────────────────────────────────────────────────

/**
 * Retrieve the current Google OAuth access token stored by Appwrite.
 * Returns null if the user is not signed in with Google or the token is absent.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    const identities = await account.listIdentities();
    const google = identities.identities.find((i) => i.provider === 'google');
    return google?.providerAccessToken ?? null;
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoogleEventDateTime {
  date?: string;       // All-day: "YYYY-MM-DD"
  dateTime?: string;   // Timed: ISO 8601
}

interface GoogleEvent {
  id: string;
  summary?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  status?: string;
}

export interface MappedGoogleEvent {
  googleEventId: string;
  title: string;
  eventDate: string;  // ISO "YYYY-MM-DD"
  time: string;       // "HH:MM" or ""
  location: string;
}

// ─── Mapping helper ───────────────────────────────────────────────────────────

function mapGoogleEvent(e: GoogleEvent): MappedGoogleEvent | null {
  const dateStr = e.start.date ?? e.start.dateTime?.slice(0, 10);
  if (!dateStr || e.status === 'cancelled') return null;
  return {
    googleEventId: e.id,
    title: e.summary ?? '(No title)',
    eventDate: dateStr,
    time: e.start.dateTime ? e.start.dateTime.slice(11, 16) : '',
    location: e.location ?? '',
  };
}

// ─── Auth check ───────────────────────────────────────────────────────────────

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

/**
 * Fetch Google Calendar events between two ISO datetime strings.
 * Returns [] on auth errors (caller should prompt re-auth).
 */
export async function fetchGoogleCalendarEvents(
  token: string,
  timeMin: string,
  timeMax: string
): Promise<MappedGoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const res = await authorisedFetch(token, `${CALENDAR_BASE}?${params}`);
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Google Calendar fetch failed: HTTP ${res.status}`);

  const data = (await res.json()) as { items?: GoogleEvent[] };
  return (data.items ?? []).flatMap((e) => {
    const mapped = mapGoogleEvent(e);
    return mapped ? [mapped] : [];
  });
}

/**
 * Create a new event on the user's primary Google Calendar.
 * Returns the Google event ID, or null on auth error.
 */
export async function createGoogleCalendarEvent(
  token: string,
  event: CalendarEvent
): Promise<string | null> {
  const body: Record<string, unknown> = {
    summary: event.title,
    location: event.loc || undefined,
  };

  if (event.time) {
    // Timed event
    const dateTime = `${event.eventDate}T${event.time}:00`;
    body.start = { dateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    body.end = { dateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else {
    // All-day event
    body.start = { date: event.eventDate };
    body.end = { date: event.eventDate };
  }

  const res = await authorisedFetch(token, CALENDAR_BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Google Calendar create failed: HTTP ${res.status}`);

  const created = (await res.json()) as { id: string };
  return created.id;
}

/**
 * Delete a Google Calendar event by its Google event ID.
 * Silently succeeds if the event is already gone (404).
 */
export async function deleteGoogleCalendarEvent(
  token: string,
  googleEventId: string
): Promise<void> {
  const res = await authorisedFetch(token, `${CALENDAR_BASE}/${googleEventId}`, {
    method: 'DELETE',
  });
  if (res.status === 401 || res.status === 404 || res.status === 204) return;
  if (!res.ok) throw new Error(`Google Calendar delete failed: HTTP ${res.status}`);
}
