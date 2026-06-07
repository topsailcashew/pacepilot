import { describe, it, expect } from 'vitest';
import { formatSize, formatDriveDate, mimeToKind, KIND_EMOJI } from './googleDriveService';

// ── formatSize ────────────────────────────────────────────────────────────────

describe('formatSize', () => {
  it('returns em-dash when bytes is undefined', () => {
    expect(formatSize(undefined)).toBe('—');
  });

  it('formats bytes < 1024 as B', () => {
    expect(formatSize('500')).toBe('500 B');
  });

  it('formats bytes in KB range', () => {
    expect(formatSize('2048')).toBe('2.0 KB');
  });

  it('formats bytes in MB range', () => {
    expect(formatSize('1048576')).toBe('1.0 MB');
  });

  it('formats bytes in GB range', () => {
    expect(formatSize('1073741824')).toBe('1.0 GB');
  });
});

// ── formatDriveDate ───────────────────────────────────────────────────────────

describe('formatDriveDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatDriveDate('')).toBe('');
  });

  it('returns "Today" for an ISO timestamp from today', () => {
    const todayIso = new Date().toISOString();
    expect(formatDriveDate(todayIso)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(formatDriveDate(d.toISOString())).toBe('Yesterday');
  });

  it('returns N-days-ago format for recent dates', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    expect(formatDriveDate(d.toISOString())).toBe('3d ago');
  });

  it('returns weeks-ago format for dates 7–29 days old', () => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    expect(formatDriveDate(d.toISOString())).toBe('2w ago');
  });
});

// ── mimeToKind ────────────────────────────────────────────────────────────────

describe('mimeToKind', () => {
  it('maps Google Docs mime to "doc"', () => {
    expect(mimeToKind('application/vnd.google-apps.document')).toBe('doc');
  });

  it('maps Google Sheets mime to "sheet"', () => {
    expect(mimeToKind('application/vnd.google-apps.spreadsheet')).toBe('sheet');
  });

  it('maps folder mime to "folder"', () => {
    expect(mimeToKind('application/vnd.google-apps.folder')).toBe('folder');
  });

  it('maps image/* mimes to "image"', () => {
    expect(mimeToKind('image/png')).toBe('image');
    expect(mimeToKind('image/jpeg')).toBe('image');
  });

  it('maps video/* mimes to "video"', () => {
    expect(mimeToKind('video/mp4')).toBe('video');
  });

  it('maps audio/* mimes to "audio"', () => {
    expect(mimeToKind('audio/mpeg')).toBe('audio');
  });

  it('maps zip-containing mimes to "zip"', () => {
    expect(mimeToKind('application/zip')).toBe('zip');
  });

  it('returns "other" for unknown mime', () => {
    expect(mimeToKind('application/unknown-something')).toBe('other');
  });
});

// ── KIND_EMOJI ────────────────────────────────────────────────────────────────

describe('KIND_EMOJI', () => {
  it('has an emoji for every known kind', () => {
    const kinds = [
      'folder', 'doc', 'sheet', 'slide', 'form',
      'pdf', 'image', 'video', 'audio', 'zip', 'text', 'other',
    ] as const;
    kinds.forEach((kind) => {
      expect(KIND_EMOJI[kind]).toBeTruthy();
    });
  });
});
