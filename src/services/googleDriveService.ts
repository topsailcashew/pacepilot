/**
 * googleDriveService — Google Drive API v3 helpers.
 *
 * Uses the shared `gFetch` bearer-token wrapper.
 * Requires the `drive.readonly` OAuth scope.
 */

import { gFetch } from '@/lib/googleApi';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DriveFileKind =
  | 'folder'
  | 'doc'
  | 'sheet'
  | 'slide'
  | 'form'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'zip'
  | 'text'
  | 'other';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  kind: DriveFileKind;
  modifiedTime: string;
  size?: string;               // bytes as string (not on Docs/Sheets/etc.)
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  starred: boolean;
  parents?: string[];
  owners?: { displayName: string; photoLink?: string }[];
}

export interface DriveBreadcrumb {
  id: string;
  name: string;
}

// ── MIME → kind mapping ────────────────────────────────────────────────────────

const MIME_KIND: Record<string, DriveFileKind> = {
  'application/vnd.google-apps.folder':       'folder',
  'application/vnd.google-apps.document':     'doc',
  'application/vnd.google-apps.spreadsheet':  'sheet',
  'application/vnd.google-apps.presentation': 'slide',
  'application/vnd.google-apps.form':         'form',
  'application/pdf':                          'pdf',
  'text/plain':                               'text',
  'text/csv':                                 'text',
};

export function mimeToKind(mime: string): DriveFileKind {
  if (MIME_KIND[mime]) return MIME_KIND[mime];
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('zip') || mime.includes('compressed')) return 'zip';
  return 'other';
}

// ── kind → emoji ───────────────────────────────────────────────────────────────

export const KIND_EMOJI: Record<DriveFileKind, string> = {
  folder: '📁',
  doc:    '📄',
  sheet:  '📊',
  slide:  '📋',
  form:   '📝',
  pdf:    '📕',
  image:  '🖼️',
  video:  '🎬',
  audio:  '🎵',
  zip:    '📦',
  text:   '📃',
  other:  '📎',
};

// ── kind → colour ──────────────────────────────────────────────────────────────

export const KIND_COLOR: Record<DriveFileKind, string> = {
  folder: 'text-yellow-400',
  doc:    'text-blue-400',
  sheet:  'text-green-400',
  slide:  'text-orange-400',
  form:   'text-purple-400',
  pdf:    'text-red-400',
  image:  'text-pink-400',
  video:  'text-violet-400',
  audio:  'text-teal-400',
  zip:    'text-amber-400',
  text:   'text-slate-400',
  other:  'text-white/40',
};

// ── API fields requested on every file ────────────────────────────────────────

const FILE_FIELDS =
  'id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink,iconLink,starred,parents,owners(displayName,photoLink)';

// ── Helpers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFile(raw: any): DriveFile {
  return {
    id:            raw.id,
    name:          raw.name,
    mimeType:      raw.mimeType,
    kind:          mimeToKind(raw.mimeType),
    modifiedTime:  raw.modifiedTime ?? '',
    size:          raw.size,
    webViewLink:   raw.webViewLink,
    thumbnailLink: raw.thumbnailLink,
    iconLink:      raw.iconLink,
    starred:       raw.starred ?? false,
    parents:       raw.parents,
    owners:        raw.owners,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * List the files inside a Drive folder (default: My Drive root).
 * Folders are sorted first, then by most-recently modified.
 */
export async function listDriveFiles(
  token: string,
  folderId = 'root',
): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(`files(${FILE_FIELDS}),nextPageToken`);
  const res = await gFetch(
    token,
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=folder,modifiedTime+desc&pageSize=100`
  );
  if (res.status === 403 || res.status === 401) throw Object.assign(new Error(`Drive list failed: ${res.status}`), { status: res.status });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.files ?? []).map((f: any) => parseFile(f));
}

/**
 * Search Drive files by name or content (across all folders).
 */
export async function searchDriveFiles(
  token: string,
  query: string,
): Promise<DriveFile[]> {
  const q = encodeURIComponent(`name contains '${query.replace(/'/g, "\\'")}' and trashed = false`);
  const fields = encodeURIComponent(`files(${FILE_FIELDS})`);
  const res = await gFetch(
    token,
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime+desc&pageSize=50`
  );
  if (res.status === 403 || res.status === 401) throw Object.assign(new Error(`Drive search failed: ${res.status}`), { status: res.status });
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);
  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.files ?? []).map((f: any) => parseFile(f));
}

/**
 * Fetch metadata for a single file (used for breadcrumb resolution).
 */
export async function getDriveFile(
  token: string,
  fileId: string,
): Promise<{ id: string; name: string; parents?: string[] }> {
  const res = await gFetch(
    token,
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,parents`
  );
  if (!res.ok) throw new Error(`Drive getFile failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch recent files modified across all of Drive.
 */
export async function listRecentDriveFiles(token: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`trashed = false and mimeType != 'application/vnd.google-apps.folder'`);
  const fields = encodeURIComponent(`files(${FILE_FIELDS})`);
  const res = await gFetch(
    token,
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime+desc&pageSize=20`
  );
  if (res.status === 403 || res.status === 401) throw Object.assign(new Error(`Drive recent failed: ${res.status}`), { status: res.status });
  if (!res.ok) throw new Error(`Drive recent failed: ${res.status}`);
  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.files ?? []).map((f: any) => parseFile(f));
}

/** Format file size bytes → human readable string. */
export function formatSize(bytes?: string): string {
  if (!bytes) return '—';
  const n = parseInt(bytes, 10);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Format ISO date to relative / short string. */
export function formatDriveDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}
