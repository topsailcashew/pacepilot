import { gFetch } from '@/lib/googleApi';
import type { GmailMessage, GmailThread, GmailThreadSummary } from '@/types';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function header(msg: GmailMessage, name: string): string {
  return msg.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function decodeBody(data?: string): string {
  if (!data) return '';
  return decodeURIComponent(
    atob(data.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
}

function extractBody(msg: GmailMessage): { html: string; text: string } {
  const walk = (parts: GmailMessage['payload']['parts']): { html: string; text: string } => {
    let html = '';
    let text = '';
    for (const part of parts ?? []) {
      if (part.mimeType === 'text/html') html = decodeBody(part.body.data);
      else if (part.mimeType === 'text/plain') text = decodeBody(part.body.data);
      else if (part.parts) {
        const inner = walk(part.parts);
        if (!html && inner.html) html = inner.html;
        if (!text && inner.text) text = inner.text;
      }
    }
    return { html, text };
  };

  if (msg.payload.mimeType === 'text/html') return { html: decodeBody(msg.payload.body.data), text: '' };
  if (msg.payload.mimeType === 'text/plain') return { html: '', text: decodeBody(msg.payload.body.data) };
  return walk(msg.payload.parts);
}

// ─── Exported helpers (used by MailPage) ──────────────────────────────────────

export { header, extractBody };

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listInboxThreads(
  token: string,
  maxResults = 20,
  pageToken?: string
): Promise<{ threads: GmailThreadSummary[]; nextPageToken?: string; authError?: 'scope' | 'api_disabled' }> {
  const params = new URLSearchParams({ labelIds: 'INBOX', maxResults: String(maxResults) });
  if (pageToken) params.set('pageToken', pageToken);

  const res = await gFetch(token, `${GMAIL_BASE}/threads?${params}`);
  if (res.status === 401) return { threads: [], authError: 'scope' };
  if (res.status === 403) return { threads: [], authError: 'api_disabled' };
  if (!res.ok) throw new Error(`Gmail list failed: HTTP ${res.status}`);

  const data = (await res.json()) as {
    threads?: Array<{ id: string; snippet: string }>;
    nextPageToken?: string;
  };

  // Fetch first message of each thread to get subject/from/date
  const summaries = await Promise.all(
    (data.threads ?? []).map(async (t) => {
      try {
        const thread = await getThread(token, t.id, 'metadata');
        const first = thread.messages[0];
        return {
          id: t.id,
          snippet: t.snippet,
          subject: header(first, 'Subject') || '(no subject)',
          from: header(first, 'From'),
          date: header(first, 'Date'),
          unread: first.labelIds?.includes('UNREAD') ?? false,
        } satisfies GmailThreadSummary;
      } catch {
        return {
          id: t.id,
          snippet: t.snippet,
          subject: '(no subject)',
          from: '',
          date: '',
          unread: false,
        } satisfies GmailThreadSummary;
      }
    })
  );

  return { threads: summaries, nextPageToken: data.nextPageToken };
}

export async function getThread(
  token: string,
  threadId: string,
  format: 'full' | 'metadata' = 'full'
): Promise<GmailThread> {
  const res = await gFetch(token, `${GMAIL_BASE}/threads/${threadId}?format=${format}`);
  if (!res.ok) throw new Error(`Gmail get thread failed: HTTP ${res.status}`);
  return res.json() as Promise<GmailThread>;
}

export async function markAsRead(token: string, messageId: string): Promise<void> {
  await gFetch(token, `${GMAIL_BASE}/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
}

export async function sendMessage(
  token: string,
  opts: { to: string; subject: string; body: string; cc?: string; threadId?: string; inReplyTo?: string; references?: string }
): Promise<void> {
  const headers = [
    `To: ${opts.to}`,
    ...(opts.cc ? [`Cc: ${opts.cc}`] : []),
    `Subject: ${opts.subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    ...(opts.inReplyTo ? [`In-Reply-To: ${opts.inReplyTo}`, `References: ${opts.references ?? opts.inReplyTo}`] : []),
  ].join('\r\n');

  const raw = btoa(unescape(encodeURIComponent(`${headers}\r\n\r\n${opts.body}`)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const body: Record<string, string> = { raw };
  if (opts.threadId) body.threadId = opts.threadId;

  const res = await gFetch(token, `${GMAIL_BASE}/messages/send`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gmail send failed: HTTP ${res.status}`);
}

export async function trashThread(token: string, threadId: string): Promise<void> {
  const res = await gFetch(token, `${GMAIL_BASE}/threads/${threadId}/trash`, { method: 'POST' });
  if (!res.ok) throw new Error(`Gmail trash failed: HTTP ${res.status}`);
}
